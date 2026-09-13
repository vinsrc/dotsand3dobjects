import { describe, it, expect } from "vitest";
import { MeshVertexMerger } from "../../../../src/Application/Services/VertexMergeService/MeshVertexMerger";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("MeshVertexMerger", () => {
  const merger = new MeshVertexMerger();

  it("should return identity result when mesh has 0 or 1 vertices", () => {
    const emptyMesh = MeshGeometry.createEmpty();
    const emptyResult = merger.merge(emptyMesh);
    expect(emptyResult.mergedCount).toBe(0);
    expect(emptyResult.mergedMesh).toBe(emptyMesh);

    const singleVertexMesh = new MeshGeometry([new Vector3D(1, 2, 3)]);
    const singleResult = merger.merge(singleVertexMesh);
    expect(singleResult.mergedCount).toBe(0);
    expect(singleResult.mergedMesh).toBe(singleVertexMesh);
  });

  it("should return identity result when no vertices are coincident within tolerance", () => {
    const mesh = new MeshGeometry([
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ]);
    const result = merger.merge(mesh, 0.001);
    expect(result.mergedCount).toBe(0);
    expect(result.mergedMesh.getVertexCount()).toBe(3);
    expect(result.vertexIndexMap.get(0)).toBe(0);
    expect(result.vertexIndexMap.get(1)).toBe(1);
    expect(result.vertexIndexMap.get(2)).toBe(2);
  });

  it("should merge two coincident vertices and remove self-loop explicit edges", () => {
    // Vertex 0 at (0, 0, 0), Vertex 1 at (0, 0, 0.0001) - coincident
    const mesh = new MeshGeometry(
      [new Vector3D(0, 0, 0), new Vector3D(0, 0, 0.0001), new Vector3D(2, 0, 0)],
      [],
      [
        [0, 1], // Becomes [0, 0] -> self loop, removed
        [1, 2], // Becomes [0, 1]
      ]
    );

    const result = merger.merge(mesh, 0.001);
    expect(result.mergedCount).toBe(1);
    expect(result.mergedMesh.getVertexCount()).toBe(2);
    expect(result.mergedMesh.explicitEdges).toEqual([[0, 1]]);
    expect(result.vertexIndexMap.get(0)).toBe(0);
    expect(result.vertexIndexMap.get(1)).toBe(0);
    expect(result.vertexIndexMap.get(2)).toBe(1);
  });

  it("should prioritize stationary vertices when movedIndices is provided", () => {
    // Vertex 0 was stationary at (1, 1, 1). Vertex 1 was moved to (1, 1, 1).
    const mesh = new MeshGeometry([
      new Vector3D(1, 1, 1),
      new Vector3D(1, 1, 1),
    ]);

    const result = merger.merge(mesh, 0.001, [1]);
    expect(result.mergedCount).toBe(1);
    expect(result.mergedMesh.getVertexCount()).toBe(1);
    // Vertex 1 merges into Vertex 0
    expect(result.vertexIndexMap.get(0)).toBe(0);
    expect(result.vertexIndexMap.get(1)).toBe(0);
  });

  it("should prioritize stationary vertex even if its index is higher than moved vertex index", () => {
    // Vertex 0 was moved to (2, 2, 2). Vertex 1 was already at (2, 2, 2).
    const mesh = new MeshGeometry([
      new Vector3D(2, 2, 2),
      new Vector3D(2, 2, 2),
    ]);

    const result = merger.merge(mesh, 0.001, [0]);
    expect(result.mergedCount).toBe(1);
    expect(result.mergedMesh.getVertexCount()).toBe(1);
    // Vertex 0 merges into Vertex 1
    expect(result.vertexIndexMap.get(0)).toBe(0);
    expect(result.vertexIndexMap.get(1)).toBe(0);
    expect(result.mergedMesh.vertices[0]?.coordinateX).toBe(2);
  });

  it("should collapse quad face into triangle when adjacent vertices merge", () => {
    // Quad [0, 1, 2, 3]
    // 0: (0, 0, 0), 1: (1, 0, 0), 2: (1, 1, 0), 3: (0, 1, 0)
    // Move vertex 1 onto vertex 2 -> (1, 1, 0)
    const quad = new Face3D([0, 1, 2, 3], "wood");
    const mesh = new MeshGeometry(
      [
        new Vector3D(0, 0, 0),
        new Vector3D(1, 1, 0), // moved onto vertex 2
        new Vector3D(1, 1, 0),
        new Vector3D(0, 1, 0),
      ],
      [quad]
    );

    const result = merger.merge(mesh, 0.001, [1]);
    expect(result.mergedCount).toBe(1);
    expect(result.mergedMesh.getVertexCount()).toBe(3);
    expect(result.mergedMesh.faces.length).toBe(1);

    const resultingFace = result.mergedMesh.faces[0]!;
    expect(resultingFace.vertexIndices.length).toBe(3);
    expect(resultingFace.materialId).toBe("wood");
    expect(result.faceIndexMap.get(0)).toBe(0);
  });

  it("should collapse triangle face into explicit edge when two of its vertices merge", () => {
    // Triangle [0, 1, 2]
    // Move vertex 1 onto vertex 2
    const triangle = new Face3D([0, 1, 2], "metal");
    const mesh = new MeshGeometry(
      [
        new Vector3D(0, 0, 0),
        new Vector3D(0, 1, 0), // moved to vertex 2
        new Vector3D(0, 1, 0),
      ],
      [triangle]
    );

    const result = merger.merge(mesh, 0.001, [1]);
    expect(result.mergedCount).toBe(1);
    expect(result.mergedMesh.getVertexCount()).toBe(2);
    // Face collapsed because only 2 unique vertices remain
    expect(result.mergedMesh.faces.length).toBe(0);
    expect(result.faceIndexMap.get(0)).toBeNull();
    // Non-collapsed edge [0, 1] preserved as explicit wireframe edge
    expect(result.mergedMesh.explicitEdges).toEqual([[0, 1]]);
  });

  it("should ignore coincident stationary pairs if movedIndices does not include either", () => {
    // Vertices 0 and 1 are coincident, but neither was moved.
    // Vertex 2 was moved to (5, 5, 5) where nothing else is.
    const mesh = new MeshGeometry([
      new Vector3D(0, 0, 0),
      new Vector3D(0, 0, 0),
      new Vector3D(5, 5, 5),
    ]);

    const result = merger.merge(mesh, 0.001, [2]);
    expect(result.mergedCount).toBe(0);
    expect(result.mergedMesh.getVertexCount()).toBe(3);
  });

  it("should merge multiple vertices into a single cluster if all coincident", () => {
    const mesh = new MeshGeometry([
      new Vector3D(0, 0, 0),
      new Vector3D(0, 0, 0),
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
    ]);

    const result = merger.merge(mesh, 0.001);
    expect(result.mergedCount).toBe(2);
    expect(result.mergedMesh.getVertexCount()).toBe(2);
    expect(result.vertexIndexMap.get(0)).toBe(0);
    expect(result.vertexIndexMap.get(1)).toBe(0);
    expect(result.vertexIndexMap.get(2)).toBe(0);
    expect(result.vertexIndexMap.get(3)).toBe(1);
  });
});
