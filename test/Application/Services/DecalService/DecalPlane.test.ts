import { describe, it, expect } from "vitest";
import { DecalPlane } from "../../../../src/Application/Services/DecalService/DecalPlane";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("DecalPlane", () => {
  const quadVertices: Vector3D[] = [
    new Vector3D(-1, -1, 1),
    new Vector3D(1, -1, 1),
    new Vector3D(1, 1, 1),
    new Vector3D(-1, 1, 1),
  ];

  it("should create a decal plane from face vertices with normal offset and scale", () => {
    const decal = DecalPlane.createFromFace("decal_1", 0, quadVertices, 0.5, 0.01);

    expect(decal.id).toBe("decal_1");
    expect(decal.parentFaceIndex).toBe(0);
    expect(decal.materialId).toBeNull();

    // Center should be at (0, 0, 1 + offset)
    const center = decal.calculateCenter();
    expect(center.coordinateX).toBeCloseTo(0, 4);
    expect(center.coordinateY).toBeCloseTo(0, 4);
    expect(center.coordinateZ).toBeCloseTo(1.01, 4);

    // Normal should point along +Z
    const normal = decal.calculateNormal();
    expect(normal.coordinateX).toBeCloseTo(0, 4);
    expect(normal.coordinateY).toBeCloseTo(0, 4);
    expect(normal.coordinateZ).toBeCloseTo(1, 4);

    // Should have 4 vertices
    expect(decal.vertices.length).toBe(4);
  });

  it("should throw error if face vertices are fewer than 3", () => {
    expect(() => {
      DecalPlane.createFromFace("decal_fail", 0, [new Vector3D(0, 0, 0)]);
    }).toThrow("fewer than 3 vertices");
  });

  it("should support withMaterialId immutably", () => {
    const decal = DecalPlane.createFromFace("decal_1", 0, quadVertices);
    const withMat = decal.withMaterialId("mat_123");

    expect(withMat.materialId).toBe("mat_123");
    expect(decal.materialId).toBeNull();
    expect(withMat.id).toBe(decal.id);
  });

  it("should translate decal plane immutably", () => {
    const decal = DecalPlane.createFromFace("decal_1", 0, quadVertices);
    const initialCenter = decal.calculateCenter();
    const offset = new Vector3D(0.5, 0.25, 0);

    const translated = decal.translate(offset);
    const newCenter = translated.calculateCenter();

    expect(newCenter.coordinateX).toBeCloseTo(initialCenter.coordinateX + 0.5, 4);
    expect(newCenter.coordinateY).toBeCloseTo(initialCenter.coordinateY + 0.25, 4);
    expect(newCenter.coordinateZ).toBeCloseTo(initialCenter.coordinateZ, 4);

    // Each vertex should also be translated
    for (let i = 0; i < 4; i += 1) {
      expect(translated.vertices[i].coordinateX).toBeCloseTo(
        decal.vertices[i].coordinateX + 0.5,
        4
      );
    }
  });

  it("should rotate decal plane around normal immutably", () => {
    const decal = DecalPlane.createFromFace("decal_1", 0, quadVertices);
    const initialCenter = decal.calculateCenter();

    // Rotate 90 degrees (Math.PI / 2)
    const rotated = decal.rotate(Math.PI / 2);
    const newCenter = rotated.calculateCenter();

    // Center should remain identical
    expect(newCenter.coordinateX).toBeCloseTo(initialCenter.coordinateX, 4);
    expect(newCenter.coordinateY).toBeCloseTo(initialCenter.coordinateY, 4);
    expect(newCenter.coordinateZ).toBeCloseTo(initialCenter.coordinateZ, 4);

    expect(rotated.rotationAngle).toBeCloseTo(Math.PI / 2, 4);
  });

  it("should check if decal is child of face correctly", () => {
    const decal = DecalPlane.createFromFace("decal_1", 2, quadVertices);
    expect(decal.isChildOfFace(2)).toBe(true);
    expect(decal.isChildOfFace(0)).toBe(false);
    expect(decal.isChildOfFace(1)).toBe(false);
  });

  it("should scale decal plane around its center and around custom origin", () => {
    const decal = DecalPlane.createFromFace("decal_1", 0, quadVertices);
    const initialCenter = decal.calculateCenter();
    const initialSize = decal.size;

    // Scale by 1.5 around its center
    const scaled = decal.scale(1.5);
    expect(scaled.size).toBeCloseTo(initialSize * 1.5, 4);
    expect(scaled.calculateCenter().coordinateX).toBeCloseTo(initialCenter.coordinateX, 4);
    expect(scaled.calculateCenter().coordinateY).toBeCloseTo(initialCenter.coordinateY, 4);
    expect(scaled.calculateCenter().coordinateZ).toBeCloseTo(initialCenter.coordinateZ, 4);

    // Scale around custom origin (0, 0, 0)
    const scaledOrigin = decal.scale(2, new Vector3D(0, 0, 0));
    expect(scaledOrigin.size).toBeCloseTo(initialSize * 2, 4);
    expect(scaledOrigin.calculateCenter().coordinateZ).toBeCloseTo(initialCenter.coordinateZ * 2, 4);
  });

  it("should support withParentFaceIndex immutably", () => {
    const decal = DecalPlane.createFromFace("decal_1", 3, quadVertices);
    const updated = decal.withParentFaceIndex(2);

    expect(updated.parentFaceIndex).toBe(2);
    expect(decal.parentFaceIndex).toBe(3);
    expect(updated.id).toBe(decal.id);
  });
});
