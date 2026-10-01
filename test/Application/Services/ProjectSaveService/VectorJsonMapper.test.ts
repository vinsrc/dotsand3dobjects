import { describe, it, expect } from "vitest";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { VectorJsonMapper } from "../../../../src/Application/Services/ProjectSaveService/VectorJsonMapper";

describe("VectorJsonMapper", () => {
  const mapper = new VectorJsonMapper();

  it("should serialize Vector3D to JSON object", () => {
    const vector = new Vector3D(1.5, -2.5, 3.25);
    const json = mapper.toJson(vector);
    expect(json).toEqual({ x: 1.5, y: -2.5, z: 3.25 });
  });

  it("should deserialize JSON object to Vector3D", () => {
    const vector = mapper.fromJson({ x: 10, y: 20, z: -30 });
    expect(vector.coordinateX).toBe(10);
    expect(vector.coordinateY).toBe(20);
    expect(vector.coordinateZ).toBe(-30);
  });
});
