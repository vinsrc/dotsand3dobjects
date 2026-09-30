import { Vector3D } from "../../Common/Vector3D";
import { Face3D } from "../ModelService/Face3D";
import { MeshGeometry } from "../ModelService/MeshGeometry";
import { ModelService } from "../ModelService/ModelService";
import { SelectionService } from "../SelectionService/SelectionService";
import { GridPlaneType } from "../CameraService/ViewStrategy";
import { FaceSplitter } from "./FaceSplitter";

export class GeometryEditorService {
  private readonly modelService: ModelService;
  private readonly selectionService: SelectionService;
  private readonly faceSplitter: FaceSplitter;

  public constructor(
    modelService: ModelService,
    selectionService: SelectionService,
    faceSplitter: FaceSplitter = new FaceSplitter()
  ) {
    this.modelService = modelService;
    this.selectionService = selectionService;
    this.faceSplitter = faceSplitter;
  }

  public snapToGrid(worldPosition: Vector3D, gridSize: number = 0.25): Vector3D {
    const snappedCoordinateX =
      Math.round(worldPosition.coordinateX / gridSize) * gridSize;
    const snappedCoordinateY =
      Math.round(worldPosition.coordinateY / gridSize) * gridSize;
    const snappedCoordinateZ =
      Math.round(worldPosition.coordinateZ / gridSize) * gridSize;
    return new Vector3D(snappedCoordinateX, snappedCoordinateY, snappedCoordinateZ);
  }

  public snapToGridOnPlane(
    worldPosition: Vector3D,
    gridPlane: GridPlaneType,
    gridSize: number = 0.25
  ): Vector3D {
    const snappedCoordinateX =
      Math.round(worldPosition.coordinateX / gridSize) * gridSize;
    const snappedCoordinateY =
      Math.round(worldPosition.coordinateY / gridSize) * gridSize;
    const snappedCoordinateZ =
      Math.round(worldPosition.coordinateZ / gridSize) * gridSize;

    switch (gridPlane) {
      case "XY":
        return new Vector3D(
          snappedCoordinateX,
          snappedCoordinateY,
          worldPosition.coordinateZ
        );
      case "XZ":
        return new Vector3D(
          snappedCoordinateX,
          worldPosition.coordinateY,
          snappedCoordinateZ
        );
      case "YZ":
        return new Vector3D(
          worldPosition.coordinateX,
          snappedCoordinateY,
          snappedCoordinateZ
        );
      default:
        return new Vector3D(
          snappedCoordinateX,
          snappedCoordinateY,
          snappedCoordinateZ
        );
    }
  }

  public getCoplanarVertexIndices(
    activeVertexIndex: number,
    gridPlane: GridPlaneType,
    tolerance: number = 0.0001
  ): readonly number[] {
    const currentModel = this.modelService.getCurrentModel();
    const totalVertices = currentModel.vertices.length;
    if (
      activeVertexIndex < 0 ||
      activeVertexIndex >= totalVertices ||
      gridPlane === "NONE"
    ) {
      return Array.from({ length: totalVertices }, (_, index) => index);
    }

    const activeVertex = currentModel.vertices[activeVertexIndex];
    if (!activeVertex) {
      return Array.from({ length: totalVertices }, (_, index) => index);
    }

    const coplanarIndices: number[] = [];

    for (let index = 0; index < totalVertices; index += 1) {
      const vertex = currentModel.vertices[index];
      if (!vertex) {
        continue;
      }

      let isCoplanar = false;
      switch (gridPlane) {
        case "XZ":
          isCoplanar =
            Math.abs(vertex.coordinateY - activeVertex.coordinateY) <= tolerance;
          break;
        case "YZ":
          isCoplanar =
            Math.abs(vertex.coordinateX - activeVertex.coordinateX) <= tolerance;
          break;
        case "XY":
          isCoplanar =
            Math.abs(vertex.coordinateZ - activeVertex.coordinateZ) <= tolerance;
          break;
        default:
          isCoplanar = true;
          break;
      }

      if (isCoplanar) {
        coplanarIndices.push(index);
      }
    }

    return coplanarIndices;
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

      for (let loopIndex = 0; loopIndex < count; loopIndex += 1) {
        const nextLoopIndex = (loopIndex + 1) % count;
        const currentVertexIndex = indices[loopIndex];
        const nextVertexIndex = indices[nextLoopIndex];

        if (currentVertexIndex !== undefined) {
          newIndices.push(currentVertexIndex);
        }

        if (
          (currentVertexIndex === startVertexIndex &&
            nextVertexIndex === endVertexIndex) ||
          (currentVertexIndex === endVertexIndex &&
            nextVertexIndex === startVertexIndex)
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

    for (const [firstEdgeVertex, secondEdgeVertex] of currentModel.explicitEdges) {
      const curLower = Math.min(firstEdgeVertex, secondEdgeVertex);
      const curHigher = Math.max(firstEdgeVertex, secondEdgeVertex);
      if (curLower === lower && curHigher === higher) {
        // Replace with two split edges
        updatedExplicitEdges.push([startVertexIndex, newVertexIndex]);
        updatedExplicitEdges.push([newVertexIndex, endVertexIndex]);
      } else {
        updatedExplicitEdges.push([firstEdgeVertex, secondEdgeVertex]);
      }
    }

    // Always ensure the new edges exist
    const hasFirstSplit = updatedExplicitEdges.some(
      ([firstEdgeVertex, secondEdgeVertex]) =>
        (firstEdgeVertex === startVertexIndex && secondEdgeVertex === newVertexIndex) ||
        (firstEdgeVertex === newVertexIndex && secondEdgeVertex === startVertexIndex)
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
      .some(
        ([firstEdgeVertex, secondEdgeVertex]) =>
          Math.min(firstEdgeVertex, secondEdgeVertex) === lower &&
          Math.max(firstEdgeVertex, secondEdgeVertex) === higher
      );

    const splitResult = this.faceSplitter.splitFacesByEdge(
      currentModel.faces,
      firstVertexIndex,
      secondVertexIndex
    );

    if (splitResult.wasSplit || !alreadyExists) {
      const updatedExplicitEdges: [number, number][] = alreadyExists
        ? [...currentModel.explicitEdges]
        : [
            ...currentModel.explicitEdges,
            [firstVertexIndex, secondVertexIndex],
          ];
      const updatedModel = new MeshGeometry(
        currentModel.vertices,
        splitResult.wasSplit ? splitResult.faces : currentModel.faces,
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
      const hasDeletedVertex = currentFace.vertexIndices.some((vertexIndex) =>
        selectedSet.has(vertexIndex)
      );
      if (!hasDeletedVertex) {
        const remappedIndices = currentFace.vertexIndices.map(
          (vertexIndex) => oldToNewMap.get(vertexIndex)!
        );
        updatedFaces.push(new Face3D(remappedIndices));
      } else {
        const count = currentFace.vertexIndices.length;
        for (let edgeIndex = 0; edgeIndex < count; edgeIndex += 1) {
          const firstVertex = currentFace.vertexIndices[edgeIndex];
          const secondVertex = currentFace.vertexIndices[(edgeIndex + 1) % count];
          if (
            firstVertex !== undefined &&
            secondVertex !== undefined &&
            !selectedSet.has(firstVertex) &&
            !selectedSet.has(secondVertex)
          ) {
            preservedEdgesFromDeletedFaces.push([
              oldToNewMap.get(firstVertex)!,
              oldToNewMap.get(secondVertex)!,
            ]);
          }
        }
      }
    }

    const updatedExplicitEdges: [number, number][] = [];
    for (const [startVertex, endVertex] of currentModel.explicitEdges) {
      if (!selectedSet.has(startVertex) && !selectedSet.has(endVertex)) {
        const remappedStart = oldToNewMap.get(startVertex)!;
        const remappedEnd = oldToNewMap.get(endVertex)!;
        updatedExplicitEdges.push([remappedStart, remappedEnd]);
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

  public deleteFace(faceIndex: number): boolean {
    const currentModel = this.modelService.getCurrentModel();
    if (faceIndex < 0 || faceIndex >= currentModel.faces.length) {
      return false;
    }

    const faceToDelete = currentModel.faces[faceIndex];
    if (!faceToDelete) {
      return false;
    }

    const updatedFaces = currentModel.faces.filter((_, index) => index !== faceIndex);

    const existingEdgeSet = new Set<string>();
    for (const [start, end] of currentModel.explicitEdges) {
      const lower = Math.min(start, end);
      const higher = Math.max(start, end);
      existingEdgeSet.add(`${lower}_${higher}`);
    }

    const updatedExplicitEdges: [number, number][] = [...currentModel.explicitEdges];
    const vertexIndices = faceToDelete.vertexIndices;
    const count = vertexIndices.length;
    for (let index = 0; index < count; index += 1) {
      const firstVertex = vertexIndices[index];
      const secondVertex = vertexIndices[(index + 1) % count];
      if (firstVertex !== undefined && secondVertex !== undefined && firstVertex !== secondVertex) {
        const lower = Math.min(firstVertex, secondVertex);
        const higher = Math.max(firstVertex, secondVertex);
        const key = `${lower}_${higher}`;
        if (!existingEdgeSet.has(key)) {
          existingEdgeSet.add(key);
          updatedExplicitEdges.push([lower, higher]);
        }
      }
    }

    const updatedModel = new MeshGeometry(
      currentModel.vertices,
      updatedFaces,
      updatedExplicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
    return true;
  }

  public deleteEdges(edgesToDelete: readonly [number, number][]): boolean {
    if (edgesToDelete.length === 0) {
      return false;
    }

    const currentModel = this.modelService.getCurrentModel();
    const deleteKeySet = new Set<string>();
    for (const [start, end] of edgesToDelete) {
      const lower = Math.min(start, end);
      const higher = Math.max(start, end);
      deleteKeySet.add(`${lower}_${higher}`);
    }

    const updatedExplicitEdges: [number, number][] = currentModel.explicitEdges.filter(
      ([start, end]) => {
        const lower = Math.min(start, end);
        const higher = Math.max(start, end);
        return !deleteKeySet.has(`${lower}_${higher}`);
      }
    );

    const updatedModel = new MeshGeometry(
      currentModel.vertices,
      currentModel.faces,
      updatedExplicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
    return true;
  }

  public createFaceFromSelection(
    vertexIndices: readonly number[]
  ): Face3D | null {
    if (vertexIndices.length < 3) {
      return null;
    }

    const currentModel = this.modelService.getCurrentModel();
    const totalVertices = currentModel.vertices.length;

    for (const vertexIndex of vertexIndices) {
      if (vertexIndex < 0 || vertexIndex >= totalVertices) {
        return null;
      }
    }

    const uniqueIndices = Array.from(new Set(vertexIndices));
    if (uniqueIndices.length !== vertexIndices.length) {
      return null;
    }

    const selectedSet = new Set(vertexIndices);
    const existingFace = currentModel.faces.find((candidateFace) => {
      if (candidateFace.vertexIndices.length !== vertexIndices.length) {
        return false;
      }
      return candidateFace.vertexIndices.every((faceVertexIndex) =>
        selectedSet.has(faceVertexIndex)
      );
    });

    if (existingFace) {
      this.selectionService.clearSelection();
      return existingFace;
    }

    const orderedIndices =
      vertexIndices.length === 4
        ? this.orderQuadVertices(vertexIndices, currentModel.vertices)
        : [...vertexIndices];

    const createdFace = new Face3D(orderedIndices);
    const updatedFaces = [...currentModel.faces, createdFace];
    const updatedModel = new MeshGeometry(
      currentModel.vertices,
      updatedFaces,
      currentModel.explicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
    this.selectionService.clearSelection();

    return createdFace;
  }

  private orderQuadVertices(
    vertexIndices: readonly number[],
    allVertices: readonly Vector3D[]
  ): number[] {
    const firstVertex = allVertices[vertexIndices[0] as number];
    const secondVertex = allVertices[vertexIndices[1] as number];
    const thirdVertex = allVertices[vertexIndices[2] as number];
    const fourthVertex = allVertices[vertexIndices[3] as number];

    if (!firstVertex || !secondVertex || !thirdVertex || !fourthVertex) {
      return [...vertexIndices];
    }

    const centroid = new Vector3D(
      (firstVertex.coordinateX +
        secondVertex.coordinateX +
        thirdVertex.coordinateX +
        fourthVertex.coordinateX) /
        4,
      (firstVertex.coordinateY +
        secondVertex.coordinateY +
        thirdVertex.coordinateY +
        fourthVertex.coordinateY) /
        4,
      (firstVertex.coordinateZ +
        secondVertex.coordinateZ +
        thirdVertex.coordinateZ +
        fourthVertex.coordinateZ) /
        4
    );

    const diagonalOne = thirdVertex.subtract(firstVertex);
    const diagonalTwo = fourthVertex.subtract(secondVertex);
    let planeNormal = diagonalOne.calculateCrossProduct(diagonalTwo);

    if (planeNormal.calculateMagnitude() < 0.000001) {
      const edgeOne = secondVertex.subtract(firstVertex);
      const edgeTwo = thirdVertex.subtract(firstVertex);
      planeNormal = edgeOne.calculateCrossProduct(edgeTwo);
    }

    if (planeNormal.calculateMagnitude() < 0.000001) {
      return [...vertexIndices];
    }

    const normalizedNormal = planeNormal.normalize();

    let referenceBasisU = firstVertex.subtract(centroid);
    if (referenceBasisU.calculateMagnitude() < 0.000001) {
      referenceBasisU = new Vector3D(1, 0, 0).calculateCrossProduct(
        normalizedNormal
      );
      if (referenceBasisU.calculateMagnitude() < 0.000001) {
        referenceBasisU = new Vector3D(0, 1, 0).calculateCrossProduct(
          normalizedNormal
        );
      }
    }
    const normalizedBasisU = referenceBasisU.normalize();
    const normalizedBasisV = normalizedNormal
      .calculateCrossProduct(normalizedBasisU)
      .normalize();

    const angularVertices = vertexIndices.map((vertexIndex) => {
      const currentPos = allVertices[vertexIndex] as Vector3D;
      const offsetFromCenter = currentPos.subtract(centroid);
      const coordinateU =
        offsetFromCenter.calculateDotProduct(normalizedBasisU);
      const coordinateV =
        offsetFromCenter.calculateDotProduct(normalizedBasisV);
      const angularValue = Math.atan2(coordinateV, coordinateU);
      return { vertexIndex, angularValue };
    });

    angularVertices.sort(
      (firstItem, secondItem) =>
        firstItem.angularValue - secondItem.angularValue
    );

    const sortedIndices = angularVertices.map((item) => item.vertexIndex);

    const initialIndex = vertexIndices[0] as number;
    const startIndexInSorted = sortedIndices.indexOf(initialIndex);
    const rotatedIndices: number[] = [];
    for (
      let cycleOffset = 0;
      cycleOffset < sortedIndices.length;
      cycleOffset += 1
    ) {
      const mappedIndex =
        (startIndexInSorted + cycleOffset) % sortedIndices.length;
      rotatedIndices.push(sortedIndices[mappedIndex] as number);
    }

    const secondSelected = vertexIndices[1] as number;
    if (rotatedIndices[3] === secondSelected) {
      return [
        rotatedIndices[0] as number,
        rotatedIndices[3] as number,
        rotatedIndices[2] as number,
        rotatedIndices[1] as number,
      ];
    }

    return rotatedIndices;
  }
}
