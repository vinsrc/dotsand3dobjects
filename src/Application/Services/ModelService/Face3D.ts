import { Vector3D } from "../../Common/Vector3D";

export class Face3D {
  public readonly vertexIndices: readonly number[];

  public constructor(vertexIndices: readonly number[]) {
    if (vertexIndices.length < 3) {
      throw new Error("A 3D face must contain at least three vertex indices.");
    }
    this.vertexIndices = [...vertexIndices];
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
          new Face3D([rootVertexIndex, secondVertexIndex, thirdVertexIndex])
        );
      }
    }

    return triangulatedFaces;
  }
}
