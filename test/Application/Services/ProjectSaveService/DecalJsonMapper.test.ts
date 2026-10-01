import { describe, it, expect } from "vitest";
import { DecalJsonMapper } from "../../../../src/Application/Services/ProjectSaveService/DecalJsonMapper";
import { VectorJsonMapper } from "../../../../src/Application/Services/ProjectSaveService/VectorJsonMapper";
import { DecalPlane } from "../../../../src/Application/Services/DecalService/DecalPlane";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("DecalJsonMapper", () => {
  const mapper = new DecalJsonMapper(new VectorJsonMapper());

  it("should serialize and deserialize DecalPlane correctly", () => {
    const center = new Vector3D(1, 2, 3);
    const normal = new Vector3D(0, 0, 1);
    const vertices: [Vector3D, Vector3D, Vector3D, Vector3D] = [
      new Vector3D(0.5, 1.5, 3),
      new Vector3D(1.5, 1.5, 3),
      new Vector3D(1.5, 2.5, 3),
      new Vector3D(0.5, 2.5, 3),
    ];
    const decal = new DecalPlane(
      "decal_1",
      2,
      center,
      normal,
      1.0,
      45,
      vertices,
      "mat_decal"
    );

    const json = mapper.toJson(decal);
    expect(json.id).toBe("decal_1");
    expect(json.parentFaceIndex).toBe(2);
    expect(json.size).toBe(1.0);
    expect(json.rotationAngle).toBe(45);
    expect(json.materialId).toBe("mat_decal");
    expect(json.vertices.length).toBe(4);

    const restored = mapper.fromJson(json);
    expect(restored.id).toBe("decal_1");
    expect(restored.parentFaceIndex).toBe(2);
    expect(restored.center.coordinateX).toBe(1);
    expect(restored.center.coordinateY).toBe(2);
    expect(restored.center.coordinateZ).toBe(3);
    expect(restored.normal.coordinateZ).toBe(1);
    expect(restored.size).toBe(1.0);
    expect(restored.rotationAngle).toBe(45);
    expect(restored.materialId).toBe("mat_decal");
    expect(restored.vertices.length).toBe(4);
  });
});
