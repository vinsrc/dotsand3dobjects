import { describe, it, expect } from "vitest";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";

describe("MeshGeometry", () => {
  it("should handle empty geometry gracefully", () => {
    const emptyMesh = new MeshGeometry([], []);
    expect(emptyMesh.isEmpty()).toBe(true);
    expect(emptyMesh.getVertexCount()).toBe(0);
    expect(emptyMesh.getFaceCount()).toBe(0);
    expect(emptyMesh.getWireframeEdges().length).toBe(0);

    const boundingBox = emptyMesh.calculateBoundingBox();
    expect(boundingBox.minimum.coordinateX).toBe(0);
    expect(boundingBox.maximum.coordinateX).toBe(0);
    expect(emptyMesh.calculateBoundingRadius()).toBe(1);
  });

  it("should calculate bounding box, center, and radius correctly", () => {
    const vertices = [
      new Vector3D(-2, -1, 0),
      new Vector3D(2, 3, 4),
    ];
    const faces = [new Face3D([0, 1, 0])];
    const mesh = new MeshGeometry(vertices, faces);

    expect(mesh.isEmpty()).toBe(false);
    expect(mesh.getVertexCount()).toBe(2);

    const boundingBox = mesh.calculateBoundingBox();
    expect(boundingBox.minimum.coordinateX).toBe(-2);
    expect(boundingBox.minimum.coordinateY).toBe(-1);
    expect(boundingBox.minimum.coordinateZ).toBe(0);
    expect(boundingBox.maximum.coordinateX).toBe(2);
    expect(boundingBox.maximum.coordinateY).toBe(3);
    expect(boundingBox.maximum.coordinateZ).toBe(4);

    const centerPoint = mesh.calculateCenter();
    expect(centerPoint.coordinateX).toBe(0);
    expect(centerPoint.coordinateY).toBe(1);
    expect(centerPoint.coordinateZ).toBe(2);

    expect(mesh.calculateBoundingRadius()).toBeGreaterThan(0);
  });

  it("should extract unique wireframe edges without duplicates", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(1, 1, 0),
      new Vector3D(0, 1, 0),
    ];
    // Two triangles sharing edge (0, 2)
    const faces = [
      new Face3D([0, 1, 2]),
      new Face3D([0, 2, 3]),
    ];
    const mesh = new MeshGeometry(vertices, faces);
    const uniqueEdges = mesh.getWireframeEdges();

    // Edges should be: (0,1), (1,2), (0,2), (2,3), (0,3) -> 5 unique edges
    expect(uniqueEdges.length).toBe(5);
  });
});
