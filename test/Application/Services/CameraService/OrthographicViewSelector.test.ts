import { describe, it, expect } from "vitest";
import { OrthographicViewSelector } from "../../../../src/Application/Services/CameraService/OrthographicViewSelector";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("OrthographicViewSelector", () => {
  it("should identify +X as closest axis when pointing primarily along +X", () => {
    const selector = new OrthographicViewSelector();
    expect(selector.findClosestAxis(new Vector3D(1, 0, 0))).toBe("+X");
    expect(selector.findClosestAxis(new Vector3D(0.9, 0.2, 0.1))).toBe("+X");
    expect(selector.findClosestAxis(new Vector3D(0.8, -0.3, 0.2))).toBe("+X");
  });

  it("should identify -X as closest axis when pointing primarily along -X", () => {
    const selector = new OrthographicViewSelector();
    expect(selector.findClosestAxis(new Vector3D(-1, 0, 0))).toBe("-X");
    expect(selector.findClosestAxis(new Vector3D(-0.95, 0.1, -0.1))).toBe("-X");
  });

  it("should identify +Y as closest axis when pointing primarily along +Y", () => {
    const selector = new OrthographicViewSelector();
    expect(selector.findClosestAxis(new Vector3D(0, 1, 0))).toBe("+Y");
    expect(selector.findClosestAxis(new Vector3D(0.1, 0.85, 0.2))).toBe("+Y");
  });

  it("should identify -Y as closest axis when pointing primarily along -Y", () => {
    const selector = new OrthographicViewSelector();
    expect(selector.findClosestAxis(new Vector3D(0, -1, 0))).toBe("-Y");
    expect(selector.findClosestAxis(new Vector3D(-0.2, -0.9, 0.1))).toBe("-Y");
  });

  it("should identify +Z as closest axis when pointing primarily along +Z", () => {
    const selector = new OrthographicViewSelector();
    expect(selector.findClosestAxis(new Vector3D(0, 0, 1))).toBe("+Z");
    expect(selector.findClosestAxis(new Vector3D(0.2, 0.1, 0.95))).toBe("+Z");
  });

  it("should identify -Z as closest axis when pointing primarily along -Z", () => {
    const selector = new OrthographicViewSelector();
    expect(selector.findClosestAxis(new Vector3D(0, 0, -1))).toBe("-Z");
    expect(selector.findClosestAxis(new Vector3D(-0.1, 0.2, -0.9))).toBe("-Z");
  });

  it("should find closest up direction on XZ plane for +Y and -Y views", () => {
    const selector = new OrthographicViewSelector();

    // Looking from +Y with camera up pointing near +Z
    expect(
      selector.findClosestUpDirection("+Y", new Vector3D(0, 0.1, 0.95))
    ).toEqual(new Vector3D(0, 0, 1));

    // Looking from +Y with camera up pointing near -Z
    expect(
      selector.findClosestUpDirection("+Y", new Vector3D(0, 0.1, -0.95))
    ).toEqual(new Vector3D(0, 0, -1));

    // Looking from +Y with camera up pointing near +X
    expect(
      selector.findClosestUpDirection("+Y", new Vector3D(0.95, 0.1, 0))
    ).toEqual(new Vector3D(1, 0, 0));

    // Looking from +Y with camera up pointing near -X
    expect(
      selector.findClosestUpDirection("+Y", new Vector3D(-0.95, 0.1, 0))
    ).toEqual(new Vector3D(-1, 0, 0));

    // Fallback when current up has no significant in-plane component
    expect(
      selector.findClosestUpDirection("+Y", new Vector3D(0, 1, 0))
    ).toEqual(new Vector3D(0, 0, -1));

    // For -Y view, default is (0, 0, 1)
    expect(
      selector.findClosestUpDirection("-Y", new Vector3D(0, -1, 0))
    ).toEqual(new Vector3D(0, 0, 1));
  });

  it("should find closest up direction for side views (+X, -X, +Z, -Z)", () => {
    const selector = new OrthographicViewSelector();

    expect(
      selector.findClosestUpDirection("+X", new Vector3D(0, 0.9, 0.1))
    ).toEqual(new Vector3D(0, 1, 0));

    expect(
      selector.findClosestUpDirection("+X", new Vector3D(0, -0.9, 0.1))
    ).toEqual(new Vector3D(0, -1, 0));

    expect(
      selector.findClosestUpDirection("+Z", new Vector3D(0.9, 0.1, 0))
    ).toEqual(new Vector3D(1, 0, 0));
  });

  it("should find closest face up direction for axis-aligned faces", () => {
    const selector = new OrthographicViewSelector();

    // Top horizontal face (XZ plane) with user viewing with +Z up
    const faceNormalY = new Vector3D(0, 1, 0);
    const userUpZ = new Vector3D(0, 0.2, 0.98);
    expect(selector.findClosestFaceUpDirection(faceNormalY, userUpZ)).toEqual(
      new Vector3D(0, 0, 1)
    );

    // X-aligned face with user viewing with -Y up
    const faceNormalX = new Vector3D(1, 0, 0);
    const userUpNegY = new Vector3D(0.1, -0.98, 0);
    expect(selector.findClosestFaceUpDirection(faceNormalX, userUpNegY)).toEqual(
      new Vector3D(0, -1, 0)
    );
  });

  it("should project camera up for arbitrary angled faces", () => {
    const selector = new OrthographicViewSelector();

    // Angled face at (0.577, 0.577, 0.577)
    const normal = new Vector3D(1, 1, 1).normalize();
    const currentUp = new Vector3D(0, 1, 0);
    const faceUp = selector.findClosestFaceUpDirection(normal, currentUp);

    // Result should be perpendicular to face normal
    expect(faceUp.calculateDotProduct(normal)).toBeCloseTo(0);
    expect(faceUp.calculateMagnitude()).toBeCloseTo(1);

    // When currentUp is parallel to normal, fallback reference is used
    const parallelUp = normal;
    const fallbackFaceUp = selector.findClosestFaceUpDirection(normal, parallelUp);
    expect(fallbackFaceUp.calculateDotProduct(normal)).toBeCloseTo(0);
    expect(fallbackFaceUp.calculateMagnitude()).toBeCloseTo(1);
  });
});

