import { Vector3D } from "../../Common/Vector3D";
import { Face3D } from "../ModelService/Face3D";
import { MeshGeometry } from "../ModelService/MeshGeometry";

export interface MeshMergeResult {
  readonly mergedMesh: MeshGeometry;
  readonly mergedCount: number;
  readonly vertexIndexMap: ReadonlyMap<number, number>;
  readonly faceIndexMap: ReadonlyMap<number, number | null>;
}

export class MeshVertexMerger {
  public merge(
    mesh: MeshGeometry,
    tolerance: number = 0.001,
    movedIndices?: readonly number[]
  ): MeshMergeResult {
    const totalVertices = mesh.vertices.length;
    if (totalVertices <= 1) {
      return this.createIdentityResult(mesh);
    }

    const clusters = this.findCoincidentClusters(
      mesh.vertices,
      tolerance,
      movedIndices
    );

    if (clusters.size === 0) {
      return this.createIdentityResult(mesh);
    }

    const { remappedIndexMap, keptVertices } = this.buildRemappedVertices(
      mesh.vertices,
      clusters,
      movedIndices
    );

    const mergedCount = totalVertices - keptVertices.length;
    if (mergedCount === 0) {
      return this.createIdentityResult(mesh);
    }

    const { remappedFaces, faceIndexMap, collapsedFaceEdges } =
      this.remapFaces(mesh.faces, remappedIndexMap);

    const remappedExplicitEdges = this.remapExplicitEdges(
      mesh.explicitEdges,
      remappedIndexMap,
      collapsedFaceEdges
    );

    const mergedMesh = new MeshGeometry(
      keptVertices,
      remappedFaces,
      remappedExplicitEdges
    );

    return {
      mergedMesh,
      mergedCount,
      vertexIndexMap: remappedIndexMap,
      faceIndexMap,
    };
  }

  private createIdentityResult(mesh: MeshGeometry): MeshMergeResult {
    const identityVertexMap = new Map<number, number>();
    for (let index = 0; index < mesh.vertices.length; index += 1) {
      identityVertexMap.set(index, index);
    }

    const identityFaceMap = new Map<number, number | null>();
    for (let faceIndex = 0; faceIndex < mesh.faces.length; faceIndex += 1) {
      identityFaceMap.set(faceIndex, faceIndex);
    }

    return {
      mergedMesh: mesh,
      mergedCount: 0,
      vertexIndexMap: identityVertexMap,
      faceIndexMap: identityFaceMap,
    };
  }

  private findCoincidentClusters(
    vertices: readonly Vector3D[],
    tolerance: number,
    movedIndices?: readonly number[]
  ): Map<number, Set<number>> {
    const movedSet = movedIndices ? new Set(movedIndices) : null;
    const parentMap = new Map<number, number>();

    const findRoot = (index: number): number => {
      let current = index;
      while (parentMap.has(current) && parentMap.get(current) !== current) {
        current = parentMap.get(current)!;
      }
      let node = index;
      while (parentMap.has(node) && parentMap.get(node) !== current) {
        const next = parentMap.get(node)!;
        parentMap.set(node, current);
        node = next;
      }
      return current;
    };

    const union = (firstIndex: number, secondIndex: number): void => {
      const firstRoot = findRoot(firstIndex);
      const secondRoot = findRoot(secondIndex);
      if (firstRoot !== secondRoot) {
        parentMap.set(firstRoot, secondRoot);
      }
    };

    for (let index = 0; index < vertices.length; index += 1) {
      parentMap.set(index, index);
    }

    let foundAnyCoincident = false;
    for (let i = 0; i < vertices.length; i += 1) {
      const vertexA = vertices[i] as Vector3D;
      for (let j = i + 1; j < vertices.length; j += 1) {
        if (movedSet && !movedSet.has(i) && !movedSet.has(j)) {
          continue;
        }

        const vertexB = vertices[j] as Vector3D;
        if (vertexA.calculateDistanceTo(vertexB) <= tolerance) {
          union(i, j);
          foundAnyCoincident = true;
        }
      }
    }

    if (!foundAnyCoincident) {
      return new Map();
    }

    const clusters = new Map<number, Set<number>>();
    for (let index = 0; index < vertices.length; index += 1) {
      const root = findRoot(index);
      if (!clusters.has(root)) {
        clusters.set(root, new Set());
      }
      clusters.get(root)!.add(index);
    }

    const validClusters = new Map<number, Set<number>>();
    for (const [root, clusterMembers] of clusters.entries()) {
      if (clusterMembers.size > 1) {
        validClusters.set(root, clusterMembers);
      }
    }

    return validClusters;
  }

  private buildRemappedVertices(
    vertices: readonly Vector3D[],
    clusters: Map<number, Set<number>>,
    movedIndices?: readonly number[]
  ): {
    remappedIndexMap: Map<number, number>;
    keptVertices: Vector3D[];
  } {
    const movedSet = movedIndices ? new Set(movedIndices) : null;
    const vertexTargetMap = new Map<number, number>();

    for (const clusterMembers of clusters.values()) {
      let targetIndex = -1;
      if (movedSet) {
        for (const memberIndex of clusterMembers) {
          if (!movedSet.has(memberIndex)) {
            if (targetIndex === -1 || memberIndex < targetIndex) {
              targetIndex = memberIndex;
            }
          }
        }
      }

      if (targetIndex === -1) {
        for (const memberIndex of clusterMembers) {
          if (targetIndex === -1 || memberIndex < targetIndex) {
            targetIndex = memberIndex;
          }
        }
      }

      for (const memberIndex of clusterMembers) {
        vertexTargetMap.set(memberIndex, targetIndex);
      }
    }

    const keptVertices: Vector3D[] = [];
    const remappedIndexMap = new Map<number, number>();
    const originalToKeptIndex = new Map<number, number>();

    for (let index = 0; index < vertices.length; index += 1) {
      const targetIndex = vertexTargetMap.get(index) ?? index;
      if (targetIndex === index) {
        const newIndex = keptVertices.length;
        keptVertices.push(vertices[index] as Vector3D);
        originalToKeptIndex.set(index, newIndex);
        remappedIndexMap.set(index, newIndex);
      }
    }

    for (let index = 0; index < vertices.length; index += 1) {
      if (!remappedIndexMap.has(index)) {
        const targetIndex = vertexTargetMap.get(index)!;
        const mappedTargetIndex = originalToKeptIndex.get(targetIndex)!;
        remappedIndexMap.set(index, mappedTargetIndex);
      }
    }

    return { remappedIndexMap, keptVertices };
  }

  private remapFaces(
    faces: readonly Face3D[],
    remappedIndexMap: Map<number, number>
  ): {
    remappedFaces: Face3D[];
    faceIndexMap: Map<number, number | null>;
    collapsedFaceEdges: [number, number][];
  } {
    const remappedFaces: Face3D[] = [];
    const faceIndexMap = new Map<number, number | null>();
    const collapsedFaceEdges: [number, number][] = [];

    for (let faceIndex = 0; faceIndex < faces.length; faceIndex += 1) {
      const face = faces[faceIndex] as Face3D;
      const mappedIndices = face.vertexIndices.map(
        (index) => remappedIndexMap.get(index) ?? index
      );

      const collapsedIndices: number[] = [];
      const count = mappedIndices.length;
      for (let i = 0; i < count; i += 1) {
        const current = mappedIndices[i] as number;
        const next = mappedIndices[(i + 1) % count] as number;
        if (current !== next) {
          collapsedIndices.push(current);
        }
      }

      const uniqueSet = new Set(collapsedIndices);
      const isSimplePolygon =
        collapsedIndices.length >= 3 &&
        uniqueSet.size === collapsedIndices.length;

      if (isSimplePolygon) {
        const newFaceIndex = remappedFaces.length;
        remappedFaces.push(new Face3D(collapsedIndices, face.materialId));
        faceIndexMap.set(faceIndex, newFaceIndex);
      } else {
        faceIndexMap.set(faceIndex, null);
        for (let edgeIdx = 0; edgeIdx < count; edgeIdx += 1) {
          const firstVertex = mappedIndices[edgeIdx] as number;
          const secondVertex = mappedIndices[(edgeIdx + 1) % count] as number;
          if (firstVertex !== secondVertex) {
            collapsedFaceEdges.push([firstVertex, secondVertex]);
          }
        }
      }
    }

    return { remappedFaces, faceIndexMap, collapsedFaceEdges };
  }

  private remapExplicitEdges(
    explicitEdges: readonly [number, number][],
    remappedIndexMap: Map<number, number>,
    collapsedFaceEdges: readonly [number, number][]
  ): [number, number][] {
    const uniqueEdgeKeys = new Set<string>();
    const remappedEdges: [number, number][] = [];

    const addEdge = (firstVertex: number, secondVertex: number) => {
      if (firstVertex === secondVertex) {
        return;
      }
      const lower = Math.min(firstVertex, secondVertex);
      const higher = Math.max(firstVertex, secondVertex);
      const key = `${lower}_${higher}`;
      if (!uniqueEdgeKeys.has(key)) {
        uniqueEdgeKeys.add(key);
        remappedEdges.push([lower, higher]);
      }
    };

    for (const [startVertex, endVertex] of explicitEdges as readonly [number, number][]) {
      const mappedStart = remappedIndexMap.get(startVertex) ?? startVertex;
      const mappedEnd = remappedIndexMap.get(endVertex) ?? endVertex;
      addEdge(mappedStart, mappedEnd);
    }

    for (const [startVertex, endVertex] of collapsedFaceEdges) {
      addEdge(startVertex, endVertex);
    }

    return remappedEdges;
  }
}
