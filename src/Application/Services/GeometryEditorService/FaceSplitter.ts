import { Face3D } from "../ModelService/Face3D";

export interface FaceSplitResult {
  readonly faces: readonly Face3D[];
  readonly wasSplit: boolean;
}

export class FaceSplitter {
  public splitFacesByEdge(
    faces: readonly Face3D[],
    firstVertexIndex: number,
    secondVertexIndex: number
  ): FaceSplitResult {
    let wasSplit = false;
    const resultingFaces: Face3D[] = [];

    for (const face of faces) {
      const subFaces = this.splitFaceIfDivided(
        face,
        firstVertexIndex,
        secondVertexIndex
      );

      if (subFaces !== null) {
        wasSplit = true;
        resultingFaces.push(subFaces[0], subFaces[1]);
      } else {
        resultingFaces.push(face);
      }
    }

    return {
      faces: resultingFaces,
      wasSplit,
    };
  }

  private splitFaceIfDivided(
    face: Face3D,
    firstVertexIndex: number,
    secondVertexIndex: number
  ): [Face3D, Face3D] | null {
    const vertexIndices = face.vertexIndices;
    const vertexCount = vertexIndices.length;
    if (vertexCount < 4) {
      return null;
    }

    const firstIndexInFace = vertexIndices.indexOf(firstVertexIndex);
    const secondIndexInFace = vertexIndices.indexOf(secondVertexIndex);

    if (firstIndexInFace === -1 || secondIndexInFace === -1) {
      return null;
    }

    if (firstIndexInFace === secondIndexInFace) {
      return null;
    }

    const isAdjacent =
      (firstIndexInFace + 1) % vertexCount === secondIndexInFace ||
      (secondIndexInFace + 1) % vertexCount === firstIndexInFace;

    if (isAdjacent) {
      return null;
    }

    const firstPath = this.collectPath(
      vertexIndices,
      firstIndexInFace,
      secondIndexInFace
    );
    const secondPath = this.collectPath(
      vertexIndices,
      secondIndexInFace,
      firstIndexInFace
    );

    if (firstPath.length < 3 || secondPath.length < 3) {
      return null;
    }

    const firstSubFace = new Face3D(firstPath, face.materialId);
    const secondSubFace = new Face3D(secondPath, face.materialId);

    return [firstSubFace, secondSubFace];
  }

  private collectPath(
    vertexIndices: readonly number[],
    startIndex: number,
    endIndex: number
  ): number[] {
    const path: number[] = [];
    const totalCount = vertexIndices.length;
    let currentIndex = startIndex;

    while (currentIndex !== endIndex) {
      const vertex = vertexIndices[currentIndex];
      if (vertex !== undefined) {
        path.push(vertex);
      }
      currentIndex = (currentIndex + 1) % totalCount;
    }

    const endVertex = vertexIndices[endIndex];
    if (endVertex !== undefined) {
      path.push(endVertex);
    }

    return path;
  }
}
