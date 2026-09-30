import { describe, it, expect } from "vitest";
import { Vector3D } from "../../../src/Application/Common/Vector3D";

describe("Vector3D", () => {
  it("should initialize coordinates correctly", () => {
    const vector = new Vector3D(1.5, 2.5, 3.5);
    expect(vector.coordinateX).toBe(1.5);
    expect(vector.coordinateY).toBe(2.5);
    expect(vector.coordinateZ).toBe(3.5);
    expect(vector.toArray()).toEqual([1.5, 2.5, 3.5]);
  });

  it("should add two vectors correctly", () => {
    const firstVector = new Vector3D(1, 2, 3);
    const secondVector = new Vector3D(4, 5, 6);
    const resultVector = firstVector.add(secondVector);

    expect(resultVector.coordinateX).toBe(5);
    expect(resultVector.coordinateY).toBe(7);
    expect(resultVector.coordinateZ).toBe(9);
  });

  it("should subtract two vectors correctly", () => {
    const firstVector = new Vector3D(4, 5, 6);
    const secondVector = new Vector3D(1, 2, 3);
    const resultVector = firstVector.subtract(secondVector);

    expect(resultVector.coordinateX).toBe(3);
    expect(resultVector.coordinateY).toBe(3);
    expect(resultVector.coordinateZ).toBe(3);
  });

  it("should scale vector by scalar correctly", () => {
    const vector = new Vector3D(2, -3, 4);
    const scaledVector = vector.scaleBy(2.5);

    expect(scaledVector.coordinateX).toBe(5);
    expect(scaledVector.coordinateY).toBe(-7.5);
    expect(scaledVector.coordinateZ).toBe(10);
  });

  it("should calculate magnitude and normalization correctly", () => {
    const vector = new Vector3D(3, 0, 4);
    expect(vector.calculateMagnitude()).toBe(5);

    const normalizedVector = vector.normalize();
    expect(normalizedVector.coordinateX).toBeCloseTo(0.6);
    expect(normalizedVector.coordinateY).toBe(0);
    expect(normalizedVector.coordinateZ).toBeCloseTo(0.8);
    expect(normalizedVector.calculateMagnitude()).toBeCloseTo(1);
  });

  it("should return zero vector when normalizing zero-length vector", () => {
    const zeroVector = new Vector3D(0, 0, 0);
    const normalizedZero = zeroVector.normalize();

    expect(normalizedZero.coordinateX).toBe(0);
    expect(normalizedZero.coordinateY).toBe(0);
    expect(normalizedZero.coordinateZ).toBe(0);
  });

  it("should calculate dot product correctly", () => {
    const firstVector = new Vector3D(1, 2, 3);
    const secondVector = new Vector3D(4, -5, 6);
    const dotProductValue = firstVector.calculateDotProduct(secondVector);

    expect(dotProductValue).toBe(1 * 4 + 2 * -5 + 3 * 6);
  });

  it("should calculate cross product correctly", () => {
    const unitVectorX = new Vector3D(1, 0, 0);
    const unitVectorY = new Vector3D(0, 1, 0);
    const crossProductVector = unitVectorX.calculateCrossProduct(unitVectorY);

    expect(crossProductVector.coordinateX).toBe(0);
    expect(crossProductVector.coordinateY).toBe(0);
    expect(crossProductVector.coordinateZ).toBe(1);
  });

  it("should calculate distance to another vector", () => {
    const firstVector = new Vector3D(0, 0, 0);
    const secondVector = new Vector3D(0, 3, 4);
    expect(firstVector.calculateDistanceTo(secondVector)).toBe(5);
  });

  it("should check equality within tolerance", () => {
    const firstVector = new Vector3D(1.000001, 2, 3);
    const secondVector = new Vector3D(1.000002, 2, 3);
    const differentVector = new Vector3D(1.1, 2, 3);

    expect(firstVector.equals(secondVector, 0.001)).toBe(true);
    expect(firstVector.equals(differentVector, 0.001)).toBe(false);
  });
});
