import { describe, it, expect } from "vitest";
import { MeshJsonMapper } from "../../../../src/Application/Services/ProjectSaveService/MeshJsonMapper";
import { VectorJsonMapper } from "../../../../src/Application/Services/ProjectSaveService/VectorJsonMapper";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";

describe("MeshJsonMapper", () => {
  const mapper = new MeshJsonMapper(new VectorJsonMapper());

  it("should serialize and deserialize MeshGeometry with vertices, faces, and explicit edges", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(1, 1, 0),
      new Vector3D(0, 1, 0),
    ];
    const faces = [new Face3D([0, 1, 2, 3], "mat_1")];
    const explicitEdges: readonly [number, number][] = [[0, 2]];
    const mesh = new MeshGeometry(vertices, faces, explicitEdges);

    const json = mapper.toJson(mesh);
    expect(json.vertices.length).toBe(4);
    expect(json.faces.length).toBe(1);
    expect(json.faces[0].materialId).toBe("mat_1");
    expect(json.explicitEdges).toEqual([[0, 2]]);

    const restoredMesh = mapper.fromJson(json);
    expect(restoredMesh.vertices.length).toBe(4);
    expect(restoredMesh.vertices[1].coordinateX).toBe(1);
    expect(restoredMesh.faces.length).toBe(1);
    expect(restoredMesh.faces[0].materialId).toBe("mat_1");
    expect(restoredMesh.faces[0].vertexIndices).toEqual([0, 1, 2, 3]);
    expect(restoredMesh.explicitEdges).toEqual([[0, 2]]);
  });
});
