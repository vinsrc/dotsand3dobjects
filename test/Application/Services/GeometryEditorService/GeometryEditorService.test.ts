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
});
