import { Vector3D } from "../../Common/Vector3D";

export class Face3D {
  public readonly vertexIndices: readonly number[];
  public readonly materialId: string | null;

  public constructor(
    vertexIndices: readonly number[],
    materialId: string | null = null
  ) {
    if (vertexIndices.length < 3) {
      throw new Error("A 3D face must contain at least three vertex indices.");
    }
    this.vertexIndices = [...vertexIndices];
    this.materialId = materialId;
  }

  public getMaterialId(): string | null {
    return this.materialId;
  }

  public withMaterialId(materialId: string | null): Face3D {
    return new Face3D(this.vertexIndices, materialId);
  }

  public withReversedVertices(): Face3D {
    return new Face3D([...this.vertexIndices].reverse(), this.materialId);
  }

  public getVertexCount(): number {
    return this.vertexIndices.length;
  }

  public isTriangle(): boolean {
    return this.vertexIndices.length === 3;
  }

  public isQuad(): boolean {
    return this.vertexIndices.length === 4;
  }

  public calculateNormal(vertexList: readonly Vector3D[]): Vector3D {
    const firstVertexIndex = this.vertexIndices[0];
    const secondVertexIndex = this.vertexIndices[1];
    const thirdVertexIndex = this.vertexIndices[2];

    if (
      firstVertexIndex === undefined ||
      secondVertexIndex === undefined ||
      thirdVertexIndex === undefined
    ) {
      return new Vector3D(0, 1, 0);
    }

    const firstVertex = vertexList[firstVertexIndex];
    const secondVertex = vertexList[secondVertexIndex];
    const thirdVertex = vertexList[thirdVertexIndex];

    if (!firstVertex || !secondVertex || !thirdVertex) {
      return new Vector3D(0, 1, 0);
    }

    const edgeVectorOne = secondVertex.subtract(firstVertex);
    const edgeVectorTwo = thirdVertex.subtract(firstVertex);
    return edgeVectorOne.calculateCrossProduct(edgeVectorTwo).normalize();
  }

  public calculateCenter(vertexList: readonly Vector3D[]): Vector3D {
    let accumulatedX = 0;
    let accumulatedY = 0;
    let accumulatedZ = 0;
    let validVertexCount = 0;

    for (const index of this.vertexIndices) {
      const vertex = vertexList[index];
      if (vertex) {
        accumulatedX += vertex.coordinateX;
        accumulatedY += vertex.coordinateY;
        accumulatedZ += vertex.coordinateZ;
        validVertexCount += 1;
      }
    }

    if (validVertexCount === 0) {
      return new Vector3D(0, 0, 0);
    }

    return new Vector3D(
      accumulatedX / validVertexCount,
      accumulatedY / validVertexCount,
      accumulatedZ / validVertexCount
    );
  }

  public triangulate(): Face3D[] {
    if (this.vertexIndices.length === 3) {
      return [this];
    }

    const triangulatedFaces: Face3D[] = [];
    const rootVertexIndex = this.vertexIndices[0];
    if (rootVertexIndex === undefined) {
      return triangulatedFaces;
    }

    for (
      let currentVertexOffset = 1;
      currentVertexOffset < this.vertexIndices.length - 1;
      currentVertexOffset += 1
    ) {
      const secondVertexIndex = this.vertexIndices[currentVertexOffset];
      const thirdVertexIndex = this.vertexIndices[currentVertexOffset + 1];

      if (
        secondVertexIndex !== undefined &&
        thirdVertexIndex !== undefined
      ) {
        triangulatedFaces.push(
          new Face3D(
            [rootVertexIndex, secondVertexIndex, thirdVertexIndex],
            this.materialId
          )
        );
      }
    }

    return triangulatedFaces;
  }
}
