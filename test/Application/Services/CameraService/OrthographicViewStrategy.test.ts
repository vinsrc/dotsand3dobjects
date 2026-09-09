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
});
