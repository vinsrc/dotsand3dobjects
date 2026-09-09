import { describe, it, expect } from "vitest";
import { PerspectiveViewStrategy } from "../../../../src/Application/Services/CameraService/PerspectiveViewStrategy";

describe("PerspectiveViewStrategy", () => {
  it("should initialize with default angles and indicate non-orthographic mode", () => {
    const strategy = new PerspectiveViewStrategy();
    expect(strategy.isOrthographic()).toBe(false);
    expect(strategy.getAxisLabel()).toBe("Perspective");
    expect(strategy.getGridPlane()).toBe("NONE");
    expect(strategy.getUpDirection().coordinateY).toBe(1);

    const viewDirection = strategy.getViewDirection();
    expect(viewDirection.calculateMagnitude()).toBeCloseTo(1);
  });
});
