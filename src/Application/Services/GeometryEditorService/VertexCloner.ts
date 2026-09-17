import { Vector3D } from "../../Common/Vector3D";
import { MeshGeometry } from "../ModelService/MeshGeometry";

export interface VertexCloneResult {
  readonly updatedModel: MeshGeometry;
  readonly newVertexIndices: readonly number[];
  readonly clonedPairs: readonly [number, number][];
}

export class VertexCloner {
  public cloneVertices(
    model: MeshGeometry,
    vertexIndicesToClone: readonly number[],
    autoConnect: boolean
  ): VertexCloneResult {
    if (vertexIndicesToClone.length === 0) {
      return {
        updatedModel: model,
        newVertexIndices: [],
        clonedPairs: [],
      };
    }

    const currentVertices = [...model.vertices];
    const newVertexIndices: number[] = [];
    const clonedPairs: [number, number][] = [];
    const oldToNewMap = new Map<number, number>();

    for (const originalIndex of vertexIndicesToClone) {
      const originalVertex = currentVertices[originalIndex];
      if (!originalVertex) {
        continue;
      }

      const newIndex = currentVertices.length;
      const duplicatedVertex = new Vector3D(
        originalVertex.coordinateX,
        originalVertex.coordinateY,
        originalVertex.coordinateZ
      );

      currentVertices.push(duplicatedVertex);
      newVertexIndices.push(newIndex);
      clonedPairs.push([originalIndex, newIndex]);
      oldToNewMap.set(originalIndex, newIndex);
    }

    const updatedExplicitEdges: [number, number][] = [
      ...model.explicitEdges,
    ];

    if (autoConnect) {
      for (const [originalIndex, newIndex] of clonedPairs) {
        updatedExplicitEdges.push([originalIndex, newIndex]);
      }

      const originalWireframeEdges = model.getWireframeEdges();
      for (const [firstVertex, secondVertex] of originalWireframeEdges) {
        const firstCloned = oldToNewMap.get(firstVertex);
        const secondCloned = oldToNewMap.get(secondVertex);
        if (firstCloned !== undefined && secondCloned !== undefined) {
          updatedExplicitEdges.push([firstCloned, secondCloned]);
        }
      }
    }

    const updatedModel = new MeshGeometry(
      currentVertices,
      model.faces,
      updatedExplicitEdges
    );

    return {
      updatedModel,
      newVertexIndices,
      clonedPairs,
    };
  }
}
