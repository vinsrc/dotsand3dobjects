import { describe, it, expect } from "vitest";
import {
  OrthographicViewStrategyFactory,
  PositiveXViewStrategy,
  NegativeXViewStrategy,
  PositiveYViewStrategy,
  NegativeYViewStrategy,
  PositiveZViewStrategy,
  NegativeZViewStrategy,
} from "../../../../src/Application/Services/CameraService/OrthographicViewStrategy";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("OrthographicViewStrategy", () => {
  const factory = new OrthographicViewStrategyFactory();

  it("should create PositiveXViewStrategy (+X) with correct directions", () => {
    const strategy = factory.createStrategy("+X");
    expect(strategy).toBeInstanceOf(PositiveXViewStrategy);
    expect(strategy.isOrthographic()).toBe(true);
    expect(strategy.getAxisLabel()).toBe("+X");
    expect(strategy.getGridPlane()).toBe("YZ");
    expect(strategy.getViewDirection().coordinateX).toBe(1);
    expect(strategy.getUpDirection().coordinateY).toBe(1);
  });

  it("should create NegativeXViewStrategy (-X) with correct directions", () => {
    const strategy = factory.createStrategy("-X");
    expect(strategy).toBeInstanceOf(NegativeXViewStrategy);
    expect(strategy.isOrthographic()).toBe(true);
    expect(strategy.getAxisLabel()).toBe("-X");
    expect(strategy.getGridPlane()).toBe("YZ");
    expect(strategy.getViewDirection().coordinateX).toBe(-1);
    expect(strategy.getUpDirection().coordinateY).toBe(1);
  });

  it("should create PositiveYViewStrategy (+Y) with correct directions", () => {
    const strategy = factory.createStrategy("+Y");
    expect(strategy).toBeInstanceOf(PositiveYViewStrategy);
    expect(strategy.isOrthographic()).toBe(true);
    expect(strategy.getAxisLabel()).toBe("+Y");
    expect(strategy.getGridPlane()).toBe("XZ");
    expect(strategy.getViewDirection().coordinateY).toBe(1);
    expect(strategy.getUpDirection().coordinateZ).toBe(-1);
  });

  it("should create NegativeYViewStrategy (-Y) with correct directions", () => {
    const strategy = factory.createStrategy("-Y");
    expect(strategy).toBeInstanceOf(NegativeYViewStrategy);
    expect(strategy.isOrthographic()).toBe(true);
    expect(strategy.getAxisLabel()).toBe("-Y");
    expect(strategy.getGridPlane()).toBe("XZ");
    expect(strategy.getViewDirection().coordinateY).toBe(-1);
    expect(strategy.getUpDirection().coordinateZ).toBe(1);
  });

  it("should create PositiveZViewStrategy (+Z) with correct directions", () => {
    const strategy = factory.createStrategy("+Z");
    expect(strategy).toBeInstanceOf(PositiveZViewStrategy);
    expect(strategy.isOrthographic()).toBe(true);
    expect(strategy.getAxisLabel()).toBe("+Z");
    expect(strategy.getGridPlane()).toBe("XY");
    expect(strategy.getViewDirection().coordinateZ).toBe(1);
    expect(strategy.getUpDirection().coordinateY).toBe(1);
  });

  it("should create NegativeZViewStrategy (-Z) with correct directions", () => {
    const strategy = factory.createStrategy("-Z");
    expect(strategy).toBeInstanceOf(NegativeZViewStrategy);
    expect(strategy.isOrthographic()).toBe(true);
    expect(strategy.getAxisLabel()).toBe("-Z");
    expect(strategy.getGridPlane()).toBe("XY");
    expect(strategy.getViewDirection().coordinateZ).toBe(-1);
    expect(strategy.getUpDirection().coordinateY).toBe(1);
  });

  it("should support custom up directions across strategies", () => {
    const customUpZ = factory.createStrategy("+Y", new Vector3D(0, 0, 1));
    expect(customUpZ.getUpDirection()).toEqual(new Vector3D(0, 0, 1));

    const customUpX = factory.createStrategy("+Y", new Vector3D(1, 0, 0));
    expect(customUpX.getUpDirection()).toEqual(new Vector3D(1, 0, 0));

    const customUpY = factory.createStrategy("+X", new Vector3D(0, -1, 0));
    expect(customUpY.getUpDirection()).toEqual(new Vector3D(0, -1, 0));
  });
});

