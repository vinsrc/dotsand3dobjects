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

  it("should translate selected vertices only", () => {
    const { modelService, selectionService, editorService } = setupService();

    // Start with 2 vertices: (0, 0, 0) and (2, 2, 2)
    const vertices = [new Vector3D(0, 0, 0), new Vector3D(2, 2, 2)];
    modelService.setCurrentModel(new MeshGeometry(vertices, []));

    // Select vertex 0 only
    selectionService.selectSingle(0);

    editorService.translateSelected(new Vector3D(0, 3, 5));

    const currentModel = modelService.getCurrentModel();
    expect(currentModel.vertices[0].coordinateX).toBe(0);
    expect(currentModel.vertices[0].coordinateY).toBe(3);
    expect(currentModel.vertices[0].coordinateZ).toBe(5);

    // Vertex 1 should be untouched
    expect(currentModel.vertices[1].coordinateX).toBe(2);
    expect(currentModel.vertices[1].coordinateY).toBe(2);
    expect(currentModel.vertices[1].coordinateZ).toBe(2);
  });

  it("should do nothing when translating with empty selection", () => {
    const { modelService, editorService } = setupService();
    const beforeModel = modelService.getCurrentModel();
    editorService.translateSelected(new Vector3D(1, 1, 1));
    expect(modelService.getCurrentModel()).toBe(beforeModel);
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

  it("should do nothing in applyTranslationFromInitial if no vertices are selected", () => {
    const { modelService, editorService } = setupService();
    const initialModel = modelService.getCurrentModel();
    editorService.applyTranslationFromInitial(
      initialModel,
      new Vector3D(1.5, 2.5, 3.5),
      "XY",
      true
    );
    expect(modelService.getCurrentModel()).toBe(initialModel);
  });

  it("should translate selected vertices continuously when snapEnabled is false", () => {
    const { modelService, selectionService, editorService } = setupService();
    const initialModel = modelService.getCurrentModel();
    selectionService.restoreSelection([0, 1], 0);

    const initialPosZero = initialModel.vertices[0] as Vector3D;
    const initialPosOne = initialModel.vertices[1] as Vector3D;
    const continuousOffset = new Vector3D(0.33, 0.67, 0);

    editorService.applyTranslationFromInitial(
      initialModel,
      continuousOffset,
      "XY",
      false
    );

    const updatedVertices = modelService.getCurrentModel().vertices;
    expect(updatedVertices[0]?.coordinateX).toBeCloseTo(
      initialPosZero.coordinateX + 0.33,
      5
    );
    expect(updatedVertices[0]?.coordinateY).toBeCloseTo(
      initialPosZero.coordinateY + 0.67,
      5
    );
    expect(updatedVertices[1]?.coordinateX).toBeCloseTo(
      initialPosOne.coordinateX + 0.33,
      5
    );
    expect(updatedVertices[1]?.coordinateY).toBeCloseTo(
      initialPosOne.coordinateY + 0.67,
      5
    );
    // Unselected vertex 2 remains unchanged
    expect(updatedVertices[2]?.coordinateX).toBe(
      initialModel.vertices[2]?.coordinateX
    );
  });

  it("should translate selected vertices with grid snapping when snapEnabled is true using active vertex", () => {
    const { modelService, selectionService, editorService } = setupService();
    // Use an initial model with known integer coordinates
    const testVertices = [
      new Vector3D(1, 1, 0),
      new Vector3D(2, 1, 0),
      new Vector3D(3, 3, 0),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    // Select vertex 0 and 1, with active vertex = 0
    selectionService.restoreSelection([0, 1], 0);

    // Drag offset moves vertex 0 candidate from (1, 1, 0) + (1.2, 0.8, 0) = (2.2, 1.8, 0) -> snaps to (2, 2, 0)
    // Effective offset is (2, 2, 0) - (1, 1, 0) = (1, 1, 0)
    editorService.applyTranslationFromInitial(
      baseModel,
      new Vector3D(1.2, 0.8, 0),
      "XY",
      true
    );

    const resultVertices = modelService.getCurrentModel().vertices;
    expect(resultVertices[0]?.coordinateX).toBe(2);
    expect(resultVertices[0]?.coordinateY).toBe(2);
    expect(resultVertices[1]?.coordinateX).toBe(3);
    expect(resultVertices[1]?.coordinateY).toBe(2);
    // Unselected vertex 2 remains at (3, 3, 0)
    expect(resultVertices[2]?.coordinateX).toBe(3);
    expect(resultVertices[2]?.coordinateY).toBe(3);
  });

  it("should fallback to first selected vertex if active vertex is null or not in selection when snapEnabled is true", () => {
    const { modelService, selectionService, editorService } = setupService();
    const testVertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(5, 5, 0),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    // Select vertex 1, but active vertex is 0 (not in selection)
    selectionService.restoreSelection([1], 0);

    // Candidate for vertex 1: (5, 5, 0) + (0.9, 0.1, 0) = (5.9, 5.1, 0) -> snaps to (6, 5, 0)
    // Effective offset: (1, 0, 0)
    editorService.applyTranslationFromInitial(
      baseModel,
      new Vector3D(0.9, 0.1, 0),
      "XY",
      true
    );

    const resultVertices = modelService.getCurrentModel().vertices;
    expect(resultVertices[1]?.coordinateX).toBe(6);
    expect(resultVertices[1]?.coordinateY).toBe(5);
  });
});
