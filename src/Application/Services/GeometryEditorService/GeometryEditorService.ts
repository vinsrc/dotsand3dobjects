import { Vector3D } from "../../Common/Vector3D";
import { Face3D } from "../ModelService/Face3D";
import { MeshGeometry } from "../ModelService/MeshGeometry";
import { ModelService } from "../ModelService/ModelService";
import { SelectionService } from "../SelectionService/SelectionService";

export class GeometryEditorService {
  private readonly modelService: ModelService;
  private readonly selectionService: SelectionService;

  public constructor(
    modelService: ModelService,
    selectionService: SelectionService
  ) {
    this.modelService = modelService;
    this.selectionService = selectionService;
  }

  public snapToGrid(worldPosition: Vector3D, gridSize: number = 1.0): Vector3D {
    const snappedX = Math.round(worldPosition.coordinateX / gridSize) * gridSize;
    const snappedY = Math.round(worldPosition.coordinateY / gridSize) * gridSize;
    const snappedZ = Math.round(worldPosition.coordinateZ / gridSize) * gridSize;
    return new Vector3D(snappedX, snappedY, snappedZ);
  }

  public addVertex(position: Vector3D, autoConnect: boolean): number {
    const currentModel = this.modelService.getCurrentModel();
    const updatedVertices = [...currentModel.vertices, position];
    const newVertexIndex = updatedVertices.length - 1;

    const updatedExplicitEdges: [number, number][] = [
      ...currentModel.explicitEdges,
    ];

    if (autoConnect) {
      const activeVertex = this.selectionService.getActiveVertex();
      if (
        activeVertex !== null &&
        activeVertex >= 0 &&
        activeVertex < currentModel.vertices.length &&
        activeVertex !== newVertexIndex
      ) {
        updatedExplicitEdges.push([activeVertex, newVertexIndex]);
      }
    }

    const updatedModel = new MeshGeometry(
      updatedVertices,
      currentModel.faces,
      updatedExplicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
    this.selectionService.setActiveVertex(newVertexIndex);

    return newVertexIndex;
  }

  public translateSelected(offsetVector: Vector3D): void {
    const selectedIndices = this.selectionService.getSelectedIndices();
    if (selectedIndices.length === 0) {
      return;
    }

    const selectedSet = new Set(selectedIndices);
    const currentModel = this.modelService.getCurrentModel();

    const updatedVertices = currentModel.vertices.map(
      (currentVertex, vertexIndex) => {
        if (selectedSet.has(vertexIndex)) {
          return currentVertex.add(offsetVector);
        }
        return currentVertex;
      }
    );

    const updatedModel = new MeshGeometry(
      updatedVertices,
      currentModel.faces,
      currentModel.explicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
  }

  public insertVertexOnEdge(
    startVertexIndex: number,
    endVertexIndex: number
  ): number {
    const currentModel = this.modelService.getCurrentModel();
    const startVertex = currentModel.vertices[startVertexIndex];
    const endVertex = currentModel.vertices[endVertexIndex];

    if (!startVertex || !endVertex || startVertexIndex === endVertexIndex) {
      return -1;
    }

    const midpointPosition = new Vector3D(
      (startVertex.coordinateX + endVertex.coordinateX) / 2,
      (startVertex.coordinateY + endVertex.coordinateY) / 2,
      (startVertex.coordinateZ + endVertex.coordinateZ) / 2
    );

    const updatedVertices = [...currentModel.vertices, midpointPosition];
    const newVertexIndex = updatedVertices.length - 1;

    // Subdivide faces that contain this edge
    const updatedFaces: Face3D[] = currentModel.faces.map((currentFace) => {
      const indices = currentFace.vertexIndices;
      const count = indices.length;
      const newIndices: number[] = [];

      for (let i = 0; i < count; i += 1) {
        const next = (i + 1) % count;
        const currentIdx = indices[i];
        const nextIdx = indices[next];

        if (currentIdx !== undefined) {
          newIndices.push(currentIdx);
        }

        if (
          (currentIdx === startVertexIndex && nextIdx === endVertexIndex) ||
          (currentIdx === endVertexIndex && nextIdx === startVertexIndex)
        ) {
          newIndices.push(newVertexIndex);
        }
      }

      return newIndices.length > count ? new Face3D(newIndices) : currentFace;
    });

    // Subdivide explicit edges
    const lower = Math.min(startVertexIndex, endVertexIndex);
    const higher = Math.max(startVertexIndex, endVertexIndex);
    const updatedExplicitEdges: [number, number][] = [];

    for (const [v1, v2] of currentModel.explicitEdges) {
      const curLower = Math.min(v1, v2);
      const curHigher = Math.max(v1, v2);
      if (curLower === lower && curHigher === higher) {
        // Replace with two split edges
        updatedExplicitEdges.push([startVertexIndex, newVertexIndex]);
        updatedExplicitEdges.push([newVertexIndex, endVertexIndex]);
      } else {
        updatedExplicitEdges.push([v1, v2]);
      }
    }

    // Always ensure the new edges exist
    const hasFirstSplit = updatedExplicitEdges.some(
      ([v1, v2]) =>
        (v1 === startVertexIndex && v2 === newVertexIndex) ||
        (v1 === newVertexIndex && v2 === startVertexIndex)
    );
    if (!hasFirstSplit) {
      updatedExplicitEdges.push([startVertexIndex, newVertexIndex]);
      updatedExplicitEdges.push([newVertexIndex, endVertexIndex]);
    }

    const updatedModel = new MeshGeometry(
      updatedVertices,
      updatedFaces,
      updatedExplicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
    this.selectionService.selectSingle(newVertexIndex);

    return newVertexIndex;
  }

  public connectVertices(
    firstVertexIndex: number,
    secondVertexIndex: number
  ): void {
    const currentModel = this.modelService.getCurrentModel();
    if (
      firstVertexIndex < 0 ||
      firstVertexIndex >= currentModel.vertices.length ||
      secondVertexIndex < 0 ||
      secondVertexIndex >= currentModel.vertices.length ||
      firstVertexIndex === secondVertexIndex
    ) {
      return;
    }

    const lower = Math.min(firstVertexIndex, secondVertexIndex);
    const higher = Math.max(firstVertexIndex, secondVertexIndex);

    const alreadyExists = currentModel
      .getWireframeEdges()
      .some(([v1, v2]) => Math.min(v1, v2) === lower && Math.max(v1, v2) === higher);

    if (!alreadyExists) {
      const updatedExplicitEdges: [number, number][] = [
        ...currentModel.explicitEdges,
        [firstVertexIndex, secondVertexIndex],
      ];
      const updatedModel = new MeshGeometry(
        currentModel.vertices,
        currentModel.faces,
        updatedExplicitEdges
      );
      this.modelService.setCurrentModel(updatedModel);
    }

    this.selectionService.restoreSelection([secondVertexIndex], secondVertexIndex);
  }

  public deleteSelectedVertices(): void {
    const selectedIndices = this.selectionService.getSelectedIndices();
    if (selectedIndices.length === 0) {
      return;
    }

    const selectedSet = new Set(selectedIndices);
    const currentModel = this.modelService.getCurrentModel();
    const updatedVertices: Vector3D[] = [];
    const oldToNewMap = new Map<number, number>();

    currentModel.vertices.forEach((vertex, oldIndex) => {
      if (!selectedSet.has(oldIndex)) {
        const newIndex = updatedVertices.length;
        updatedVertices.push(vertex);
        oldToNewMap.set(oldIndex, newIndex);
      }
    });

    const updatedFaces: Face3D[] = [];
    const preservedEdgesFromDeletedFaces: [number, number][] = [];

    for (const currentFace of currentModel.faces) {
      const hasDeletedVertex = currentFace.vertexIndices.some((idx) =>
        selectedSet.has(idx)
      );
      if (!hasDeletedVertex) {
        const remappedIndices = currentFace.vertexIndices.map(
          (idx) => oldToNewMap.get(idx)!
        );
        updatedFaces.push(new Face3D(remappedIndices));
      } else {
        const count = currentFace.vertexIndices.length;
        for (let i = 0; i < count; i += 1) {
          const u = currentFace.vertexIndices[i];
          const v = currentFace.vertexIndices[(i + 1) % count];
          if (
            u !== undefined &&
            v !== undefined &&
            !selectedSet.has(u) &&
            !selectedSet.has(v)
          ) {
            preservedEdgesFromDeletedFaces.push([
              oldToNewMap.get(u)!,
              oldToNewMap.get(v)!,
            ]);
          }
        }
      }
    }

    const updatedExplicitEdges: [number, number][] = [];
    for (const [u, v] of currentModel.explicitEdges) {
      if (!selectedSet.has(u) && !selectedSet.has(v)) {
        const newU = oldToNewMap.get(u)!;
        const newV = oldToNewMap.get(v)!;
        updatedExplicitEdges.push([newU, newV]);
      }
    }

    for (const edge of preservedEdgesFromDeletedFaces) {
      updatedExplicitEdges.push(edge);
    }

    const updatedModel = new MeshGeometry(
      updatedVertices,
      updatedFaces,
      updatedExplicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
    this.selectionService.clearSelection();
  }
}
