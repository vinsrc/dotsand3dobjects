import { describe, it, expect } from "vitest";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";

describe("MeshGeometry", () => {
  it("should handle empty geometry gracefully", () => {
    const emptyMesh = MeshGeometry.createEmpty();
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

  it("should calculate face center or fallback to mesh center", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(2, 0, 0),
      new Vector3D(2, 2, 0),
    ];
    const faces = [new Face3D([0, 1, 2])];
    const mesh = new MeshGeometry(vertices, faces);

    const faceCenter = mesh.calculateFaceCenter(0);
    expect(faceCenter.coordinateX).toBeCloseTo(4 / 3);
    expect(faceCenter.coordinateY).toBeCloseTo(2 / 3);
    expect(faceCenter.coordinateZ).toBe(0);

    // Non-existent face index falls back to mesh center
    const fallbackCenter = mesh.calculateFaceCenter(99);
    expect(fallbackCenter).toEqual(mesh.calculateCenter());
  });

  it("should reverse face winding order for specified face index", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(1, 1, 0),
      new Vector3D(0, 1, 0),
    ];
    const faces = [new Face3D([0, 1, 2, 3])];
    const mesh = new MeshGeometry(vertices, faces);

    const reversedMesh = mesh.reverseFaceWinding(0);
    expect(reversedMesh.faces[0]?.vertexIndices).toEqual([3, 2, 1, 0]);

    // Out of bounds faceIndex returns same mesh
    expect(mesh.reverseFaceWinding(-1)).toBe(mesh);
    expect(mesh.reverseFaceWinding(99)).toBe(mesh);
  });

  it("should rotate vertices around specified axis and center point", () => {
    const vertices = [
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ];
    const mesh = new MeshGeometry(vertices, []);

    // Rotate 90 degrees around Z axis (0, 0, 1) through origin (0, 0, 0)
    const rotatedZ = mesh.rotateAroundAxis(
      new Vector3D(0, 0, 0),
      new Vector3D(0, 0, 1),
      Math.PI / 2
    );

    expect(rotatedZ.vertices[0].coordinateX).toBeCloseTo(0, 5);
    expect(rotatedZ.vertices[0].coordinateY).toBeCloseTo(1, 5);
    expect(rotatedZ.vertices[0].coordinateZ).toBeCloseTo(0, 5);

    expect(rotatedZ.vertices[1].coordinateX).toBeCloseTo(-1, 5);
    expect(rotatedZ.vertices[1].coordinateY).toBeCloseTo(0, 5);
    expect(rotatedZ.vertices[1].coordinateZ).toBeCloseTo(0, 5);
  });

  it("should scale vertices around origin or specified center point", () => {
    const vertices = [
      new Vector3D(1, 2, 3),
      new Vector3D(3, 4, 5),
    ];
    const mesh = new MeshGeometry(vertices, []);

    // Scaling without centerPoint scales around origin
    const scaledOrigin = mesh.scale(2);
    expect(scaledOrigin.vertices[0].coordinateX).toBe(2);
    expect(scaledOrigin.vertices[0].coordinateY).toBe(4);
    expect(scaledOrigin.vertices[0].coordinateZ).toBe(6);

    // Scaling with centerPoint (2, 3, 4) by factor 2
    const center = new Vector3D(2, 3, 4);
    const scaledCenter = mesh.scale(2, center);
    expect(scaledCenter.vertices[0].coordinateX).toBe(0); // 2 + (1-2)*2 = 0
    expect(scaledCenter.vertices[0].coordinateY).toBe(1); // 3 + (2-3)*2 = 1
    expect(scaledCenter.vertices[0].coordinateZ).toBe(2); // 4 + (3-4)*2 = 2

    expect(scaledCenter.vertices[1].coordinateX).toBe(4); // 2 + (3-2)*2 = 4
    expect(scaledCenter.vertices[1].coordinateY).toBe(5); // 3 + (4-3)*2 = 5
    expect(scaledCenter.vertices[1].coordinateZ).toBe(6); // 4 + (5-4)*2 = 6
  });

  it("should scale axes independently with scaleAxes", () => {
    const vertices = [
      new Vector3D(1, 2, 3),
      new Vector3D(3, 4, 5),
    ];
    const mesh = new MeshGeometry(vertices, []);

    // Center of mesh is (2, 3, 4)
    // Scale X by 2, Y by 3, Z by 4 around center
    const scaled = mesh.scaleAxes(2, 3, 4);

    // vertex 0: relative (-1, -1, -1) -> center + (-2, -3, -4) = (0, 0, 0)
    expect(scaled.vertices[0].coordinateX).toBe(0);
    expect(scaled.vertices[0].coordinateY).toBe(0);
    expect(scaled.vertices[0].coordinateZ).toBe(0);

    // vertex 1: relative (1, 1, 1) -> center + (2, 3, 4) = (4, 6, 8)
    expect(scaled.vertices[1].coordinateX).toBe(4);
    expect(scaled.vertices[1].coordinateY).toBe(6);
    expect(scaled.vertices[1].coordinateZ).toBe(8);

    // Test with explicit centerPoint
    const customCenter = new Vector3D(0, 0, 0);
    const scaledCustom = mesh.scaleAxes(2, 0.5, 3, customCenter);
    expect(scaledCustom.vertices[0].coordinateX).toBe(2);
    expect(scaledCustom.vertices[0].coordinateY).toBe(1);
    expect(scaledCustom.vertices[0].coordinateZ).toBe(9);
  });
});
