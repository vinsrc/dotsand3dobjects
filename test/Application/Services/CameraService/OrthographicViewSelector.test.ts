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
});
