import { describe, expect, it } from "vitest";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { VertexCloner } from "../../../../src/Application/Services/GeometryEditorService/VertexCloner";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";

describe("VertexCloner", () => {
  it("should return unchanged model when no vertex indices to clone", () => {
    const cloner = new VertexCloner();
    const model = new MeshGeometry([new Vector3D(1, 2, 3)], []);
    const result = cloner.cloneVertices(model, [], false);

    expect(result.updatedModel).toBe(model);
    expect(result.newVertexIndices).toEqual([]);
    expect(result.clonedPairs).toEqual([]);
  });

  it("should clone single vertex without auto-connect", () => {
    const cloner = new VertexCloner();
    const model = new MeshGeometry([new Vector3D(1, 2, 3)], []);
    const result = cloner.cloneVertices(model, [0], false);

    expect(result.newVertexIndices).toEqual([1]);
    expect(result.clonedPairs).toEqual([[0, 1]]);
    expect(result.updatedModel.vertices.length).toBe(2);
    expect(result.updatedModel.vertices[1]?.equals(new Vector3D(1, 2, 3))).toBe(true);
    expect(result.updatedModel.explicitEdges).toEqual([]);
  });

  it("should clone single vertex with auto-connect and create connecting edge", () => {
    const cloner = new VertexCloner();
    const model = new MeshGeometry([new Vector3D(1, 2, 3)], []);
    const result = cloner.cloneVertices(model, [0], true);

    expect(result.newVertexIndices).toEqual([1]);
    expect(result.clonedPairs).toEqual([[0, 1]]);
    expect(result.updatedModel.vertices.length).toBe(2);
    expect(result.updatedModel.explicitEdges).toEqual([[0, 1]]);
  });

  it("should clone multiple vertices with auto-connect and connect cloned edges", () => {
    const cloner = new VertexCloner();
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ];
    const face = new Face3D([0, 1, 2]);
    const model = new MeshGeometry(vertices, [face]);

    // Clone vertices 0 and 1 (which share an edge in the face)
    const result = cloner.cloneVertices(model, [0, 1], true);

    expect(result.newVertexIndices).toEqual([3, 4]);
    expect(result.clonedPairs).toEqual([
      [0, 3],
      [1, 4],
    ]);
    expect(result.updatedModel.vertices.length).toBe(5);

    // Explicit edges should have [0, 3], [1, 4] and [3, 4] (from original wireframe edge [0, 1])
    expect(result.updatedModel.explicitEdges).toContainEqual([0, 3]);
    expect(result.updatedModel.explicitEdges).toContainEqual([1, 4]);
    expect(result.updatedModel.explicitEdges).toContainEqual([3, 4]);
  });

  it("should ignore invalid/out-of-bounds vertex indices", () => {
    const cloner = new VertexCloner();
    const model = new MeshGeometry([new Vector3D(1, 2, 3)], []);
    const result = cloner.cloneVertices(model, [-1, 0, 99], true);

    expect(result.newVertexIndices).toEqual([1]);
    expect(result.clonedPairs).toEqual([[0, 1]]);
    expect(result.updatedModel.vertices.length).toBe(2);
  });
});
