import { describe, it, expect } from "vitest";
import { FaceOrthographicViewStrategy } from "../../../../src/Application/Services/CameraService/FaceOrthographicViewStrategy";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("FaceOrthographicViewStrategy", () => {
  it("should initialize correctly for Z-dominant normal", () => {
    const strategy = new FaceOrthographicViewStrategy(2, new Vector3D(0, 0, 5));

    expect(strategy.getFaceIndex()).toBe(2);
    expect(strategy.isOrthographic()).toBe(true);
    expect(strategy.getAxisLabel()).toBe("Face 2");
    expect(strategy.getViewDirection()).toEqual(new Vector3D(0, 0, 1));
    expect(strategy.getGridPlane()).toBe("XY");
    expect(strategy.getUpDirection()).toEqual(new Vector3D(0, 1, 0));
  });

  it("should determine YZ grid plane for X-dominant normal", () => {
    const strategy = new FaceOrthographicViewStrategy(0, new Vector3D(10, 1, 2));

    expect(strategy.getGridPlane()).toBe("YZ");
    expect(strategy.getViewDirection().coordinateX).toBeCloseTo(10 / Math.sqrt(105));
  });

  it("should determine XZ grid plane for Y-dominant normal and pick non-parallel up vector", () => {
    const strategy = new FaceOrthographicViewStrategy(1, new Vector3D(0, 1, 0));

    expect(strategy.getGridPlane()).toBe("XZ");
    expect(strategy.getViewDirection()).toEqual(new Vector3D(0, 1, 0));
    // Up vector should be orthogonal to view direction
    const dot = strategy.getViewDirection().calculateDotProduct(strategy.getUpDirection());
    expect(dot).toBeCloseTo(0);
    expect(strategy.getUpDirection().calculateMagnitude()).toBeCloseTo(1);
  });

  it("should accept explicit up vector", () => {
    const strategy = new FaceOrthographicViewStrategy(
      3,
      new Vector3D(0, 0, 1),
      new Vector3D(1, 0, 0)
    );

    expect(strategy.getUpDirection()).toEqual(new Vector3D(1, 0, 0));
  });
});
