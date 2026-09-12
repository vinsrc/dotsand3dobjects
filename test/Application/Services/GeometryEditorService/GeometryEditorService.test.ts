import { describe, it, expect } from "vitest";
import { GeometryEditorService } from "../../../../src/Application/Services/GeometryEditorService/GeometryEditorService";
import { ModelService } from "../../../../src/Application/Services/ModelService/ModelService";
import { SelectionService } from "../../../../src/Application/Services/SelectionService/SelectionService";
import { ModelFactory } from "../../../../src/Application/Services/ModelService/ModelFactory";
import { ObjParser } from "../../../../src/Application/Services/ModelService/ObjParser";
import { ObjExporter } from "../../../../src/Application/Services/ModelService/ObjExporter";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";

describe("GeometryEditorService", () => {
  const setupService = () => {
    const notifier = new ApplicationStateNotifier();
    const modelFactory = new ModelFactory();
    const objParser = new ObjParser(modelFactory);
    const objExporter = new ObjExporter();
    const modelService = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );
    const selectionService = new SelectionService(notifier);
    const editorService = new GeometryEditorService(
      modelService,
      selectionService
    );
    return { modelService, selectionService, editorService, notifier };
  };

  it("should snap coordinates to nearest 1.0 unit grid", () => {
    const { editorService } = setupService();

    const input1 = new Vector3D(1.2, 2.7, -3.4);
    const snapped1 = editorService.snapToGrid(input1);
    expect(snapped1.coordinateX).toBe(1);
    expect(snapped1.coordinateY).toBe(3);
    expect(snapped1.coordinateZ).toBe(-3);

    const input2 = new Vector3D(-0.49, 0.5, 0.51);
    const snapped2 = editorService.snapToGrid(input2);
    expect(snapped2.coordinateX).toBe(-0);
    expect(snapped2.coordinateY).toBe(1);
    expect(snapped2.coordinateZ).toBe(1);
  });

  it("should snap coordinates on plane preserving perpendicular view axis", () => {
    const { editorService } = setupService();

    // On XY plane (looking from Z axis): X and Y snap, Z is preserved exactly
    const positionForXY = new Vector3D(1.2, 2.7, 3.456);
    const snappedOnXY = editorService.snapToGridOnPlane(positionForXY, "XY");
    expect(snappedOnXY.coordinateX).toBe(1);
    expect(snappedOnXY.coordinateY).toBe(3);
    expect(snappedOnXY.coordinateZ).toBe(3.456);

    // On XZ plane (looking from Y axis): X and Z snap, Y is preserved exactly
    const positionForXZ = new Vector3D(1.2, 2.789, 4.6);
    const snappedOnXZ = editorService.snapToGridOnPlane(positionForXZ, "XZ");
    expect(snappedOnXZ.coordinateX).toBe(1);
    expect(snappedOnXZ.coordinateY).toBe(2.789);
    expect(snappedOnXZ.coordinateZ).toBe(5);

    // On YZ plane (looking from X axis): Y and Z snap, X is preserved exactly
    const positionForYZ = new Vector3D(0.123, 2.7, 4.6);
    const snappedOnYZ = editorService.snapToGridOnPlane(positionForYZ, "YZ");
    expect(snappedOnYZ.coordinateX).toBe(0.123);
    expect(snappedOnYZ.coordinateY).toBe(3);
    expect(snappedOnYZ.coordinateZ).toBe(5);

    // Fallback/NONE plane: snaps all coordinates
    const positionDefault = new Vector3D(1.2, 2.7, 3.4);
    const snappedDefault = editorService.snapToGridOnPlane(positionDefault, "NONE");
    expect(snappedDefault.coordinateX).toBe(1);
    expect(snappedDefault.coordinateY).toBe(3);
    expect(snappedDefault.coordinateZ).toBe(3);
  });

  it("should add vertex without auto-connect", () => {
    const { modelService, selectionService, editorService } = setupService();
    const initialVertexCount = modelService.getCurrentModel().getVertexCount();

    const newPos = new Vector3D(5, 5, 5);
    const addedIndex = editorService.addVertex(newPos, false);

    expect(addedIndex).toBe(initialVertexCount);
    expect(modelService.getCurrentModel().getVertexCount()).toBe(
      initialVertexCount + 1
    );
    expect(selectionService.getActiveVertex()).toBe(addedIndex);
    expect(modelService.getCurrentModel().vertices[addedIndex]).toEqual(newPos);
  });

  it("should add vertex with auto-connect enabled and connect to previous active vertex", () => {
    const { modelService, selectionService, editorService } = setupService();

    // Reset to an empty model for clear edge tracking
    modelService.setCurrentModel(new MeshGeometry([], []));

    const p1 = new Vector3D(0, 0, 0);
    const idx1 = editorService.addVertex(p1, false);
    expect(idx1).toBe(0);
    expect(modelService.getCurrentModel().getWireframeEdges().length).toBe(0);

    const p2 = new Vector3D(1, 0, 0);
    const idx2 = editorService.addVertex(p2, true);
    expect(idx2).toBe(1);

    const edges = modelService.getCurrentModel().getWireframeEdges();
    expect(edges.length).toBe(1);
    expect(edges[0]).toEqual([0, 1]);

    const p3 = new Vector3D(1, 1, 0);
    const idx3 = editorService.addVertex(p3, true);
    expect(idx3).toBe(2);

    const edgesAfterP3 = modelService.getCurrentModel().getWireframeEdges();
    expect(edgesAfterP3.length).toBe(2);
    expect(edgesAfterP3).toContainEqual([1, 2]);
  });

  it("should insert vertex on edge, placing midpoint and splitting the edge", () => {
    const { modelService, selectionService, editorService } = setupService();

    // Setup square face: (0,0,0), (2,0,0), (2,2,0), (0,2,0)
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(2, 0, 0),
      new Vector3D(2, 2, 0),
      new Vector3D(0, 2, 0),
    ];
    const face = new Face3D([0, 1, 2, 3]);
    modelService.setCurrentModel(new MeshGeometry(vertices, [face]));

    // Split edge between 0 and 1 (midpoint should be at (1, 0, 0))
    const newIdx = editorService.insertVertexOnEdge(0, 1);
    expect(newIdx).toBe(4);

    const updatedModel = modelService.getCurrentModel();
    expect(updatedModel.getVertexCount()).toBe(5);
    expect(updatedModel.vertices[4].coordinateX).toBe(1);
    expect(updatedModel.vertices[4].coordinateY).toBe(0);
    expect(updatedModel.vertices[4].coordinateZ).toBe(0);

    // Selection should be placed on the newly inserted vertex
    expect(selectionService.getActiveVertex()).toBe(4);

    // Face should have 5 vertices now
    expect(updatedModel.faces[0].vertexIndices.length).toBe(5);
  });

  it("should return -1 when inserting vertex on invalid edge indices", () => {
    const { editorService } = setupService();
    expect(editorService.insertVertexOnEdge(-1, 0)).toBe(-1);
    expect(editorService.insertVertexOnEdge(0, 0)).toBe(-1);
    expect(editorService.insertVertexOnEdge(0, 999)).toBe(-1);
  });

  it("should connect two vertices with an edge", () => {
    const { modelService, selectionService, editorService } = setupService();

    const vertices = [new Vector3D(0, 0, 0), new Vector3D(5, 5, 5)];
    modelService.setCurrentModel(new MeshGeometry(vertices, []));
    expect(modelService.getCurrentModel().getWireframeEdges().length).toBe(0);

    editorService.connectVertices(0, 1);

    const edges = modelService.getCurrentModel().getWireframeEdges();
    expect(edges.length).toBe(1);
    expect(edges[0]).toEqual([0, 1]);
    expect(selectionService.getActiveVertex()).toBe(1);

    // Connecting again should not duplicate edge
    editorService.connectVertices(1, 0);
    expect(modelService.getCurrentModel().getWireframeEdges().length).toBe(1);
  });

  it("should ignore connecting invalid vertex indices", () => {
    const { modelService, editorService } = setupService();
    const initialEdges = modelService.getCurrentModel().getWireframeEdges().length;
    editorService.connectVertices(-1, 0);
    editorService.connectVertices(0, 0);
    editorService.connectVertices(0, 999);
    expect(modelService.getCurrentModel().getWireframeEdges().length).toBe(
      initialEdges
    );
  });

  it("should split explicit edges when inserting vertex on edge", () => {
    const { modelService, editorService } = setupService();

    const vertices = [new Vector3D(0, 0, 0), new Vector3D(4, 0, 0)];
    const explicitEdges: [number, number][] = [[0, 1]];
    modelService.setCurrentModel(new MeshGeometry(vertices, [], explicitEdges));

    const newIdx = editorService.insertVertexOnEdge(0, 1);
    expect(newIdx).toBe(2);

    const updatedModel = modelService.getCurrentModel();
    expect(updatedModel.getVertexCount()).toBe(3);
    expect(updatedModel.vertices[2].coordinateX).toBe(2);
    expect(updatedModel.explicitEdges).toContainEqual([0, 2]);
    expect(updatedModel.explicitEdges).toContainEqual([2, 1]);
    expect(updatedModel.explicitEdges).not.toContainEqual([0, 1]);
  });

  it("should delete selected vertices and remap remaining geometry and edges", () => {
    const { modelService, selectionService, editorService } = setupService();

    // Triangle face: (0, 0, 0), (1, 0, 0), (0, 1, 0)
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
      new Vector3D(5, 5, 5), // Standalone vertex 3
    ];
    const faces = [new Face3D([0, 1, 2])];
    const explicitEdges: [number, number][] = [[2, 3]];
    modelService.setCurrentModel(new MeshGeometry(vertices, faces, explicitEdges));

    // Select vertex 0 (part of triangle)
    selectionService.selectSingle(0);

    editorService.deleteSelectedVertices();

    const updatedModel = modelService.getCurrentModel();
    // Vertex 0 deleted, 3 vertices remain: (1, 0, 0), (0, 1, 0), (5, 5, 5)
    expect(updatedModel.getVertexCount()).toBe(3);
    expect(updatedModel.vertices[0]).toEqual(new Vector3D(1, 0, 0));
    expect(updatedModel.vertices[1]).toEqual(new Vector3D(0, 1, 0));
    expect(updatedModel.vertices[2]).toEqual(new Vector3D(5, 5, 5));

    // Face [0, 1, 2] contained vertex 0, so it is destroyed
    expect(updatedModel.faces.length).toBe(0);

    // Edge between old 1 and old 2 survives, now remapped to [0, 1]
    expect(updatedModel.explicitEdges).toContainEqual([0, 1]);

    // Explicit edge [2, 3] had neither endpoint deleted; now remapped to [1, 2]
    expect(updatedModel.explicitEdges).toContainEqual([1, 2]);

    // Selection should be cleared
    expect(selectionService.getSelectedIndices()).toEqual([]);
  });

  it("should do nothing when deleteSelectedVertices is called with no selection", () => {
    const { modelService, editorService } = setupService();
    const beforeModel = modelService.getCurrentModel();
    editorService.deleteSelectedVertices();
    expect(modelService.getCurrentModel()).toBe(beforeModel);
  });

  it("should unselect old vertex and leave only second vertex selected in connectVertices", () => {
    const { modelService, selectionService, editorService } = setupService();

    const vertices = [new Vector3D(0, 0, 0), new Vector3D(1, 0, 0)];
    modelService.setCurrentModel(new MeshGeometry(vertices, []));
    selectionService.selectSingle(0);
    expect(selectionService.getSelectedIndices()).toEqual([0]);

    editorService.connectVertices(0, 1);
    expect(selectionService.getSelectedIndices()).toEqual([1]);
    expect(selectionService.getActiveVertex()).toBe(1);
  });

  it("should create a triangle face from 3 selected vertices and clear selection", () => {
    const { modelService, selectionService, editorService } = setupService();
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ];
    modelService.setCurrentModel(new MeshGeometry(vertices, []));
    selectionService.restoreSelection([0, 1, 2], 2);

    const createdFace = editorService.createFaceFromSelection([0, 1, 2]);
    expect(createdFace).not.toBeNull();
    expect(createdFace?.isTriangle()).toBe(true);
    expect(createdFace?.vertexIndices).toEqual([0, 1, 2]);

    const updatedModel = modelService.getCurrentModel();
    expect(updatedModel.faces.length).toBe(1);
    expect(selectionService.getSelectedIndices()).toEqual([]);
  });

  it("should create a quad face from 4 selected vertices and clear selection", () => {
    const { modelService, selectionService, editorService } = setupService();
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(1, 1, 0),
      new Vector3D(0, 1, 0),
    ];
    modelService.setCurrentModel(new MeshGeometry(vertices, []));
    selectionService.restoreSelection([0, 1, 2, 3], 3);

    const createdFace = editorService.createFaceFromSelection([0, 1, 2, 3]);
    expect(createdFace).not.toBeNull();
    expect(createdFace?.isQuad()).toBe(true);
    expect(createdFace?.vertexIndices).toEqual([0, 1, 2, 3]);

    const updatedModel = modelService.getCurrentModel();
    expect(updatedModel.faces.length).toBe(1);
    expect(selectionService.getSelectedIndices()).toEqual([]);
  });

  it("should sort 4 selected vertices to prevent bowtie quad triangulation", () => {
    const { modelService, editorService } = setupService();
    const vertices = [
      new Vector3D(0, 0, 0), // 0: bottom-left
      new Vector3D(1, 0, 0), // 1: bottom-right
      new Vector3D(1, 1, 0), // 2: top-right
      new Vector3D(0, 1, 0), // 3: top-left
    ];
    modelService.setCurrentModel(new MeshGeometry(vertices, []));

    // Selection order has crossed diagonal: 0, 2, 1, 3
    const createdFace = editorService.createFaceFromSelection([0, 2, 1, 3]);
    expect(createdFace).not.toBeNull();
    // Winding order should be cyclic around perimeter: 0, 3, 2, 1 or 0, 1, 2, 3
    expect(createdFace?.vertexIndices).toEqual([0, 3, 2, 1]);
  });

  it("should reject face creation when vertex count is less than 3 or greater than 4", () => {
    const { modelService, editorService } = setupService();
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(1, 1, 0),
      new Vector3D(0, 1, 0),
      new Vector3D(0, 0, 1),
    ];
    modelService.setCurrentModel(new MeshGeometry(vertices, []));

    expect(editorService.createFaceFromSelection([0, 1])).toBeNull();
    expect(editorService.createFaceFromSelection([])).toBeNull();
    expect(modelService.getCurrentModel().faces.length).toBe(0);

    const fiveVertexFace = editorService.createFaceFromSelection([0, 1, 2, 3, 4]);
    expect(fiveVertexFace).not.toBeNull();
    expect(modelService.getCurrentModel().faces.length).toBe(1);
  });

  it("should reject face creation when out of bounds or duplicate indices are passed", () => {
    const { modelService, editorService } = setupService();
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(1, 1, 0),
    ];
    modelService.setCurrentModel(new MeshGeometry(vertices, []));

    expect(editorService.createFaceFromSelection([-1, 0, 1])).toBeNull();
    expect(editorService.createFaceFromSelection([0, 1, 10])).toBeNull();
    expect(editorService.createFaceFromSelection([0, 1, 1])).toBeNull();
    expect(modelService.getCurrentModel().faces.length).toBe(0);
  });

  it("should not add duplicate face when face with same vertices already exists, returning existing face and clearing selection", () => {
    const { modelService, selectionService, editorService } = setupService();
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(1, 1, 0),
    ];
    const initialFace = new Face3D([0, 1, 2]);
    modelService.setCurrentModel(new MeshGeometry(vertices, [initialFace]));
    selectionService.restoreSelection([2, 0, 1], 1);

    const duplicateFace = editorService.createFaceFromSelection([2, 0, 1]);
    expect(duplicateFace).toBe(initialFace);
    expect(modelService.getCurrentModel().faces.length).toBe(1);
    expect(selectionService.getSelectedIndices()).toEqual([]);
  });

  describe("getCoplanarVertexIndices", () => {
    it("should filter coplanar vertices along the Y depth axis for XZ grid plane", () => {
      const { modelService, editorService } = setupService();
      const testVertices = [
        new Vector3D(1, 5, 2),  // index 0: Y = 5
        new Vector3D(3, 5, 4),  // index 1: Y = 5
        new Vector3D(1, 10, 2), // index 2: Y = 10
        new Vector3D(3, -2, 4), // index 3: Y = -2
        new Vector3D(0, 5.00005, 0), // index 4: within tolerance of 5
      ];
      modelService.setCurrentModel(new MeshGeometry(testVertices, []));

      const coplanar = editorService.getCoplanarVertexIndices(0, "XZ");
      expect(coplanar).toEqual([0, 1, 4]);
    });

    it("should filter coplanar vertices along the X depth axis for YZ grid plane", () => {
      const { modelService, editorService } = setupService();
      const testVertices = [
        new Vector3D(7, 1, 2), // index 0: X = 7
        new Vector3D(7, 3, 4), // index 1: X = 7
        new Vector3D(0, 3, 4), // index 2: X = 0
      ];
      modelService.setCurrentModel(new MeshGeometry(testVertices, []));

      const coplanar = editorService.getCoplanarVertexIndices(0, "YZ");
      expect(coplanar).toEqual([0, 1]);
    });

    it("should filter coplanar vertices along the Z depth axis for XY grid plane", () => {
      const { modelService, editorService } = setupService();
      const testVertices = [
        new Vector3D(1, 2, -3), // index 0: Z = -3
        new Vector3D(4, 5, 3),  // index 1: Z = 3
        new Vector3D(0, 0, -3), // index 2: Z = -3
      ];
      modelService.setCurrentModel(new MeshGeometry(testVertices, []));

      const coplanar = editorService.getCoplanarVertexIndices(0, "XY");
      expect(coplanar).toEqual([0, 2]);
    });

    it("should return all vertex indices when activeVertexIndex is invalid or gridPlane is NONE", () => {
      const { modelService, editorService } = setupService();
      const testVertices = [
        new Vector3D(1, 2, 3),
        new Vector3D(4, 5, 6),
      ];
      modelService.setCurrentModel(new MeshGeometry(testVertices, []));

      expect(editorService.getCoplanarVertexIndices(-1, "XZ")).toEqual([0, 1]);
      expect(editorService.getCoplanarVertexIndices(99, "XZ")).toEqual([0, 1]);
      expect(editorService.getCoplanarVertexIndices(0, "NONE")).toEqual([0, 1]);
    });
  });

  describe("deleteFace", () => {
    it("should delete the face and preserve its edges in explicitEdges", () => {
      const { modelService, editorService } = setupService();
      const testVertices = [
        new Vector3D(0, 0, 0),
        new Vector3D(1, 0, 0),
        new Vector3D(1, 1, 0),
        new Vector3D(0, 1, 0),
      ];
      const face0 = new Face3D([0, 1, 2, 3]);
      modelService.setCurrentModel(new MeshGeometry(testVertices, [face0], []));

      const success = editorService.deleteFace(0);
      expect(success).toBe(true);

      const updatedModel = modelService.getCurrentModel();
      expect(updatedModel.faces.length).toBe(0);
      expect(updatedModel.explicitEdges).toEqual([
        [0, 1],
        [1, 2],
        [2, 3],
        [0, 3],
      ]);
      // Wireframe edges should still contain all 4 edges
      expect(updatedModel.getWireframeEdges().length).toBe(4);
    });

    it("should return false for invalid face index", () => {
      const { modelService, editorService } = setupService();
      expect(editorService.deleteFace(-1)).toBe(false);
      expect(editorService.deleteFace(999)).toBe(false);
    });

    it("should not duplicate existing explicit edges when preserving face edges", () => {
      const { modelService, editorService } = setupService();
      const testVertices = [
        new Vector3D(0, 0, 0),
        new Vector3D(1, 0, 0),
        new Vector3D(0, 1, 0),
      ];
      const face0 = new Face3D([0, 1, 2]);
      modelService.setCurrentModel(
        new MeshGeometry(testVertices, [face0], [[0, 1]])
      );

      const success = editorService.deleteFace(0);
      expect(success).toBe(true);

      const updatedModel = modelService.getCurrentModel();
      expect(updatedModel.faces.length).toBe(0);
      expect(updatedModel.explicitEdges).toEqual([
        [0, 1],
        [1, 2],
        [0, 2],
      ]);
    });
  });

  describe("deleteEdges", () => {
    it("should delete specified explicit edges and leave vertices intact", () => {
      const { modelService, editorService } = setupService();
      const testVertices = [
        new Vector3D(0, 0, 0),
        new Vector3D(1, 0, 0),
        new Vector3D(1, 1, 0),
      ];
      modelService.setCurrentModel(
        new MeshGeometry(testVertices, [], [[0, 1], [1, 2]])
      );

      const success = editorService.deleteEdges([[0, 1]]);
      expect(success).toBe(true);

      const updatedModel = modelService.getCurrentModel();
      expect(updatedModel.explicitEdges).toEqual([[1, 2]]);
      expect(updatedModel.vertices.length).toBe(3);
    });

    it("should return false when deleting empty array of edges", () => {
      const { editorService } = setupService();
      expect(editorService.deleteEdges([])).toBe(false);
    });

    it("should delete multiple explicit edges at once", () => {
      const { modelService, editorService } = setupService();
      const testVertices = [
        new Vector3D(0, 0, 0),
        new Vector3D(1, 0, 0),
        new Vector3D(1, 1, 0),
        new Vector3D(0, 1, 0),
      ];
      modelService.setCurrentModel(
        new MeshGeometry(testVertices, [], [[0, 1], [1, 2], [2, 3]])
      );

      const success = editorService.deleteEdges([[0, 1], [2, 3]]);
      expect(success).toBe(true);

      const updatedModel = modelService.getCurrentModel();
      expect(updatedModel.explicitEdges).toEqual([[1, 2]]);
      expect(updatedModel.vertices.length).toBe(4);
    });
  });
});
