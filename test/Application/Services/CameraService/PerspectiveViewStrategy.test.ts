import { describe, it, expect } from "vitest";
import { PerspectiveViewStrategy } from "../../../../src/Application/Services/CameraService/PerspectiveViewStrategy";

describe("PerspectiveViewStrategy", () => {
  it("should initialize with default angles and indicate non-orthographic mode", () => {
    const strategy = new PerspectiveViewStrategy();
    expect(strategy.isOrthographic()).toBe(false);
    expect(strategy.getAxisLabel()).toBe("Perspective");
    expect(strategy.getGridPlane()).toBe("NONE");

    const upDirection = strategy.getUpDirection();
    expect(upDirection.coordinateY).toBeCloseTo(Math.cos(Math.PI / 6), 5);
    expect(upDirection.calculateMagnitude()).toBeCloseTo(1);

    const viewDirection = strategy.getViewDirection();
    expect(viewDirection.calculateMagnitude()).toBeCloseTo(1);

    // Up and view directions must be strictly orthogonal
    const dotProduct =
      upDirection.coordinateX * viewDirection.coordinateX +
      upDirection.coordinateY * viewDirection.coordinateY +
      upDirection.coordinateZ * viewDirection.coordinateZ;
    expect(dotProduct).toBeCloseTo(0, 5);
  });

  it("should return (0, 1, 0) for zero elevation", () => {
    const strategy = new PerspectiveViewStrategy(Math.PI / 3, 0);
    const upDirection = strategy.getUpDirection();
    expect(upDirection.coordinateX).toBeCloseTo(0, 5);
    expect(upDirection.coordinateY).toBeCloseTo(1, 5);
    expect(upDirection.coordinateZ).toBeCloseTo(0, 5);
  });
});
