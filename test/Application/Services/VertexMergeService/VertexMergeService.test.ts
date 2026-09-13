import { describe, it, expect } from "vitest";
import { VertexMergeService } from "../../../../src/Application/Services/VertexMergeService/VertexMergeService";
import { ModelService } from "../../../../src/Application/Services/ModelService/ModelService";
import { ModelFactory } from "../../../../src/Application/Services/ModelService/ModelFactory";
import { ObjParser } from "../../../../src/Application/Services/ModelService/ObjParser";
import { ObjExporter } from "../../../../src/Application/Services/ModelService/ObjExporter";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";
import { SelectionService } from "../../../../src/Application/Services/SelectionService/SelectionService";
import { DecalService } from "../../../../src/Application/Services/DecalService/DecalService";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";

describe("VertexMergeService", () => {
  const createServices = (initialModel?: MeshGeometry) => {
    const notifier = new ApplicationStateNotifier();
    const factory = new ModelFactory();
    const parser = new ObjParser(factory);
    const exporter = new ObjExporter();
    const modelService = new ModelService(
      factory,
      parser,
      exporter,
      notifier,
      undefined,
      initialModel
    );
    const selectionService = new SelectionService(notifier);
    const decalService = new DecalService(notifier);
    const mergeService = new VertexMergeService(
      modelService,
      selectionService,
      decalService
    );

    return {
      notifier,
      modelService,
      selectionService,
      decalService,
      mergeService,
    };
  };

  it("should do nothing when model has no coincident vertices", () => {
    const { modelService, mergeService } = createServices();
    const initialVertexCount = modelService.getCurrentModel().getVertexCount();

    const result = mergeService.mergeCoincidentVertices();
    expect(result.mergedCount).toBe(0);
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialVertexCount);
  });

  it("should merge coincident vertices and update selection and active vertex", () => {
    // 2 vertices: 0 at (0, 0, 0), 1 at (0, 0, 0)
    const customMesh = new MeshGeometry([
      new Vector3D(0, 0, 0),
      new Vector3D(0, 0, 0),
    ]);

    const { modelService, selectionService, mergeService } =
      createServices(customMesh);

    // Select vertex 1 as active
    selectionService.selectSingle(1);
    expect(selectionService.getActiveVertex()).toBe(1);
    expect(selectionService.isSelected(1)).toBe(true);

    const result = mergeService.mergeCoincidentVertices(0.001, [1]);
    expect(result.mergedCount).toBe(1);
    expect(modelService.getCurrentModel().getVertexCount()).toBe(1);

    // Remapped: vertex 1 mapped to 0
    expect(selectionService.getActiveVertex()).toBe(0);
    expect(selectionService.isSelected(0)).toBe(true);
  });

  it("should update selected edges when vertices merge", () => {
    // Vertices: 0 at (0, 0, 0), 1 at (1, 0, 0), 2 at (1, 0, 0), 3 at (2, 0, 0)
    // Edge [0, 1] and [2, 3]. Vertices 1 and 2 are coincident.
    const customMesh = new MeshGeometry(
      [
        new Vector3D(0, 0, 0),
        new Vector3D(1, 0, 0),
        new Vector3D(1, 0, 0),
        new Vector3D(2, 0, 0),
      ],
      [],
      [
        [0, 1],
        [2, 3],
      ]
    );

    const { selectionService, mergeService } = createServices(customMesh);

    // Select edge [2, 3]
    selectionService.selectEdge([2, 3]);
    expect(selectionService.isEdgeSelected([2, 3])).toBe(true);

    // Merge vertex 2 into vertex 1 (vertex 2 index remapped to 1, vertex 3 remapped to 2)
    const result = mergeService.mergeCoincidentVertices(0.001, [2]);
    expect(result.mergedCount).toBe(1);

    // Edge [2, 3] is remapped to [1, 2]
    expect(selectionService.isEdgeSelected([1, 2])).toBe(true);
  });

  it("should remap decal parent face indices and remove decals on collapsed faces", () => {
    // Face 0: Triangle [0, 1, 2], Face 1: Quad [3, 4, 5, 6]
    // 0:(0,0,0), 1:(1,0,0), 2:(0,1,0), 3:(5,0,0), 4:(6,0,0), 5:(6,1,0), 6:(5,1,0)
    const customMesh = new MeshGeometry(
      [
        new Vector3D(0, 0, 0),
        new Vector3D(0, 1, 0), // coincident with 2, so Face 0 will collapse
        new Vector3D(0, 1, 0),
        new Vector3D(5, 0, 0),
        new Vector3D(6, 0, 0),
        new Vector3D(6, 1, 0),
        new Vector3D(5, 1, 0),
      ],
      [new Face3D([0, 1, 2]), new Face3D([3, 4, 5, 6])]
    );

    const { decalService, mergeService, modelService } =
      createServices(customMesh);

    // Add decal on Face 0 and Face 1
    const decal0 = decalService.createDecalOnFace(0, [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ]);

    const decal1 = decalService.createDecalOnFace(1, [
      new Vector3D(5, 0, 0),
      new Vector3D(6, 0, 0),
      new Vector3D(6, 1, 0),
      new Vector3D(5, 1, 0),
    ]);

    expect(decalService.getDecals().length).toBe(2);

    // Merge vertex 1 into 2 -> Face 0 collapses, Face 1 becomes index 0
    mergeService.mergeCoincidentVertices(0.001, [1]);

    expect(modelService.getCurrentModel().faces.length).toBe(1);
    // Decal on Face 0 should be deleted, decal on Face 1 should now have parentFaceIndex 0
    expect(decalService.getDecal(decal0.id)).toBeNull();
    expect(decalService.getDecal(decal1.id)?.parentFaceIndex).toBe(0);
  });
});
