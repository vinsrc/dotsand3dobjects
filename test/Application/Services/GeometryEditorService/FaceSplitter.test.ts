import { describe, expect, it } from "vitest";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";
import { FaceSplitter } from "../../../../src/Application/Services/GeometryEditorService/FaceSplitter";

describe("FaceSplitter", () => {
  it("should split a quad into two triangles across a diagonal", () => {
    const splitter = new FaceSplitter();
    const quad = new Face3D([0, 1, 2, 3]);
    const result = splitter.splitFacesByEdge([quad], 0, 2);

    expect(result.wasSplit).toBe(true);
    expect(result.faces.length).toBe(2);
    expect(result.faces[0]?.vertexIndices).toEqual([0, 1, 2]);
    expect(result.faces[1]?.vertexIndices).toEqual([2, 3, 0]);
  });

  it("should split a quad into two triangles across the other diagonal", () => {
    const splitter = new FaceSplitter();
    const quad = new Face3D([0, 1, 2, 3]);
    const result = splitter.splitFacesByEdge([quad], 1, 3);

    expect(result.wasSplit).toBe(true);
    expect(result.faces.length).toBe(2);
    expect(result.faces[0]?.vertexIndices).toEqual([1, 2, 3]);
    expect(result.faces[1]?.vertexIndices).toEqual([3, 0, 1]);
  });

  it("should preserve material ID on both sub-faces after split", () => {
    const splitter = new FaceSplitter();
    const quadWithMaterial = new Face3D([0, 1, 2, 3], "material_gold");
    const result = splitter.splitFacesByEdge([quadWithMaterial], 0, 2);

    expect(result.wasSplit).toBe(true);
    expect(result.faces[0]?.materialId).toBe("material_gold");
    expect(result.faces[1]?.materialId).toBe("material_gold");
  });

  it("should split a pentagon into a quad and a triangle", () => {
    const splitter = new FaceSplitter();
    const pentagon = new Face3D([0, 1, 2, 3, 4]);
    const result = splitter.splitFacesByEdge([pentagon], 1, 4);

    expect(result.wasSplit).toBe(true);
    expect(result.faces.length).toBe(2);
    // Path from 1 to 4: 1 -> 2 -> 3 -> 4 (quad)
    // Path from 4 to 1: 4 -> 0 -> 1 (triangle)
    expect(result.faces[0]?.vertexIndices).toEqual([1, 2, 3, 4]);
    expect(result.faces[1]?.vertexIndices).toEqual([4, 0, 1]);
  });

  it("should not split a triangle because all vertex pairs are adjacent", () => {
    const splitter = new FaceSplitter();
    const triangle = new Face3D([0, 1, 2]);
    const result = splitter.splitFacesByEdge([triangle], 0, 2);

    expect(result.wasSplit).toBe(false);
    expect(result.faces).toEqual([triangle]);
  });

  it("should not split a quad if the edge connects adjacent vertices (boundary edge)", () => {
    const splitter = new FaceSplitter();
    const quad = new Face3D([0, 1, 2, 3]);
    const result = splitter.splitFacesByEdge([quad], 0, 1);

    expect(result.wasSplit).toBe(false);
    expect(result.faces).toEqual([quad]);
  });

  it("should not split if vertices are not present in the face", () => {
    const splitter = new FaceSplitter();
    const quad = new Face3D([0, 1, 2, 3]);
    const result = splitter.splitFacesByEdge([quad], 0, 7);

    expect(result.wasSplit).toBe(false);
    expect(result.faces).toEqual([quad]);
  });

  it("should not split if the same vertex is passed twice", () => {
    const splitter = new FaceSplitter();
    const quad = new Face3D([0, 1, 2, 3]);
    const result = splitter.splitFacesByEdge([quad], 2, 2);

    expect(result.wasSplit).toBe(false);
    expect(result.faces).toEqual([quad]);
  });

  it("should only split the affected face among multiple faces", () => {
    const splitter = new FaceSplitter();
    const face1 = new Face3D([0, 1, 2, 3]);
    const face2 = new Face3D([4, 5, 6]);
    const result = splitter.splitFacesByEdge([face1, face2], 0, 2);

    expect(result.wasSplit).toBe(true);
    expect(result.faces.length).toBe(3);
    expect(result.faces[0]?.vertexIndices).toEqual([0, 1, 2]);
    expect(result.faces[1]?.vertexIndices).toEqual([2, 3, 0]);
    expect(result.faces[2]?.vertexIndices).toEqual([4, 5, 6]);
  });
});
