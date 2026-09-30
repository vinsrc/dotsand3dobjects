import { describe, it, expect } from "vitest";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("Face3D", () => {
  it("should throw error if less than 3 vertex indices are provided", () => {
    expect(() => new Face3D([0, 1])).toThrow(
      "A 3D face must contain at least three vertex indices."
    );
  });

  it("should identify triangles and quads correctly", () => {
    const triangleFace = new Face3D([0, 1, 2]);
    expect(triangleFace.isTriangle()).toBe(true);
    expect(triangleFace.isQuad()).toBe(false);
    expect(triangleFace.getVertexCount()).toBe(3);

    const quadFace = new Face3D([0, 1, 2, 3]);
    expect(quadFace.isTriangle()).toBe(false);
    expect(quadFace.isQuad()).toBe(true);
    expect(quadFace.getVertexCount()).toBe(4);
  });

  it("should calculate normal vector for coplanar vertices", () => {
    const vertexList: Vector3D[] = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ];
    const face = new Face3D([0, 1, 2]);
    const normalVector = face.calculateNormal(vertexList);

    expect(normalVector.coordinateX).toBe(0);
    expect(normalVector.coordinateY).toBe(0);
    expect(normalVector.coordinateZ).toBe(1);
  });

  it("should return default normal if vertices are missing", () => {
    const vertexList: Vector3D[] = [new Vector3D(0, 0, 0)];
    const face = new Face3D([0, 5, 9]);
    const normalVector = face.calculateNormal(vertexList);

    expect(normalVector.coordinateY).toBe(1);
  });

  it("should triangulate a triangle to itself", () => {
    const triangleFace = new Face3D([0, 1, 2]);
    const triangulatedList = triangleFace.triangulate();

    expect(triangulatedList.length).toBe(1);
    expect(triangulatedList[0]?.vertexIndices).toEqual([0, 1, 2]);
  });

  it("should triangulate a quad into two triangles", () => {
    const quadFace = new Face3D([0, 1, 2, 3]);
    const triangulatedList = quadFace.triangulate();

    expect(triangulatedList.length).toBe(2);
    expect(triangulatedList[0]?.vertexIndices).toEqual([0, 1, 2]);
    expect(triangulatedList[1]?.vertexIndices).toEqual([0, 2, 3]);
  });

  it("should handle normal calculation with missing vertex in list gracefully", () => {
    const face = new Face3D([0, 1, 2]);
    const normal = face.calculateNormal([]);
    expect(normal.coordinateY).toBe(1);
  });

  it("should calculate center of face from vertices", () => {
    const vertexList: Vector3D[] = [
      new Vector3D(0, 0, 0),
      new Vector3D(2, 0, 0),
      new Vector3D(2, 2, 0),
      new Vector3D(0, 2, 0),
    ];
    const face = new Face3D([0, 1, 2, 3]);
    const center = face.calculateCenter(vertexList);

    expect(center.coordinateX).toBe(1);
    expect(center.coordinateY).toBe(1);
    expect(center.coordinateZ).toBe(0);

    const emptyListFace = new Face3D([0, 1, 2]);
    expect(emptyListFace.calculateCenter([])).toEqual(new Vector3D(0, 0, 0));
  });

  it("should support materialId and withMaterialId, preserving it in triangulate", () => {
    const faceWithoutMaterial = new Face3D([0, 1, 2]);
    expect(faceWithoutMaterial.materialId).toBeNull();
    expect(faceWithoutMaterial.getMaterialId()).toBeNull();

    const faceWithMaterial = faceWithoutMaterial.withMaterialId("mat_123");
    expect(faceWithMaterial.materialId).toBe("mat_123");
    expect(faceWithMaterial.getMaterialId()).toBe("mat_123");

    const quadWithMaterial = new Face3D([0, 1, 2, 3], "mat_quad");
    expect(quadWithMaterial.getMaterialId()).toBe("mat_quad");

    const triangulated = quadWithMaterial.triangulate();
    expect(triangulated).toHaveLength(2);
    expect(triangulated[0].getMaterialId()).toBe("mat_quad");
    expect(triangulated[1].getMaterialId()).toBe("mat_quad");
  });

  it("should return a new Face3D with reversed vertex indices and preserved materialId", () => {
    const face = new Face3D([0, 1, 2, 3], "mat_blue");
    const reversed = face.withReversedVertices();

    expect(reversed.vertexIndices).toEqual([3, 2, 1, 0]);
    expect(reversed.materialId).toBe("mat_blue");
    expect(face.vertexIndices).toEqual([0, 1, 2, 3]);
  });
});
