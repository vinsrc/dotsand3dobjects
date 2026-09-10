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

  it("should translate vertices by offset vector", () => {
    const vertices = [
      new Vector3D(1, 2, 3),
      new Vector3D(4, 5, 6),
    ];
    const faces = [new Face3D([0, 1, 0])];
    const mesh = new MeshGeometry(vertices, faces);

    const translatedMesh = mesh.translate(new Vector3D(10, -5, 2));

    expect(translatedMesh.vertices[0].coordinateX).toBe(11);
    expect(translatedMesh.vertices[0].coordinateY).toBe(-3);
    expect(translatedMesh.vertices[0].coordinateZ).toBe(5);

    expect(translatedMesh.vertices[1].coordinateX).toBe(14);
    expect(translatedMesh.vertices[1].coordinateY).toBe(0);
    expect(translatedMesh.vertices[1].coordinateZ).toBe(8);

    expect(translatedMesh.faces).toEqual(faces);
  });

  it("should scale vertices uniformly by scalar factor", () => {
    const vertices = [
      new Vector3D(2, 4, -6),
      new Vector3D(0, 1, 3),
    ];
    const faces = [new Face3D([0, 1, 0])];
    const mesh = new MeshGeometry(vertices, faces);

    const scaledMesh = mesh.scale(2.5);

    expect(scaledMesh.vertices[0].coordinateX).toBe(5);
    expect(scaledMesh.vertices[0].coordinateY).toBe(10);
    expect(scaledMesh.vertices[0].coordinateZ).toBe(-15);

    expect(scaledMesh.vertices[1].coordinateX).toBe(0);
    expect(scaledMesh.vertices[1].coordinateY).toBe(2.5);
    expect(scaledMesh.vertices[1].coordinateZ).toBe(7.5);
  });

  it("should fit geometry to target dimension and center at origin", () => {
    // A box from (10, 20, 30) to (50, 40, 30)
    // Dimensions: X = 40, Y = 20, Z = 0. Max dimension = 40.
    // Center: (30, 30, 30).
    const vertices = [
      new Vector3D(10, 20, 30),
      new Vector3D(50, 20, 30),
      new Vector3D(50, 40, 30),
      new Vector3D(10, 40, 30),
    ];
    const faces = [new Face3D([0, 1, 2, 3])];
    const mesh = new MeshGeometry(vertices, faces);

    const fittedMesh = mesh.fitToDimension(2.0);

    const newCenter = fittedMesh.calculateCenter();
    expect(newCenter.coordinateX).toBeCloseTo(0, 5);
    expect(newCenter.coordinateY).toBeCloseTo(0, 5);
    expect(newCenter.coordinateZ).toBeCloseTo(0, 5);

    const boundingBox = fittedMesh.calculateBoundingBox();
    const extentX = boundingBox.maximum.coordinateX - boundingBox.minimum.coordinateX;
    const extentY = boundingBox.maximum.coordinateY - boundingBox.minimum.coordinateY;
    const extentZ = boundingBox.maximum.coordinateZ - boundingBox.minimum.coordinateZ;
    const maxExtent = Math.max(extentX, extentY, extentZ);

    expect(maxExtent).toBeCloseTo(2.0, 5);
    expect(extentX).toBeCloseTo(2.0, 5);
    expect(extentY).toBeCloseTo(1.0, 5);
    expect(extentZ).toBeCloseTo(0, 5);
  });

  it("should handle empty geometry when fitToDimension is called", () => {
    const emptyMesh = new MeshGeometry([], []);
    const fittedEmpty = emptyMesh.fitToDimension(2.0);
    expect(fittedEmpty.isEmpty()).toBe(true);
  });

  it("should handle point geometry with zero dimension gracefully", () => {
    const singlePointMesh = new MeshGeometry(
      [new Vector3D(5, 5, 5)],
      []
    );
    const fittedPoint = singlePointMesh.fitToDimension(2.0);
    expect(fittedPoint.vertices[0].coordinateX).toBeCloseTo(0, 5);
    expect(fittedPoint.vertices[0].coordinateY).toBeCloseTo(0, 5);
    expect(fittedPoint.vertices[0].coordinateZ).toBeCloseTo(0, 5);
  });

  it("should support explicit edges and combine them with face edges", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(1, 1, 0),
      new Vector3D(0, 1, 0),
      new Vector3D(2, 2, 2),
    ];
    const faces = [new Face3D([0, 1, 2])];
    const explicitEdges: [number, number][] = [
      [2, 3],
      [3, 0],
      [2, 4],
      [0, 1],
      [-1, 0],
      [0, 0],
    ];

    const mesh = new MeshGeometry(vertices, faces, explicitEdges);
    expect(mesh.explicitEdges).toEqual(explicitEdges);

    const edges = mesh.getWireframeEdges();
    expect(edges.length).toBe(6);

    const translated = mesh.translate(new Vector3D(1, 1, 1));
    expect(translated.explicitEdges).toEqual(explicitEdges);
  });
});
