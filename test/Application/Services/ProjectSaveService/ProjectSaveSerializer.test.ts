import { describe, it, expect } from "vitest";
import { ProjectSaveSerializer } from "../../../../src/Application/Services/ProjectSaveService/ProjectSaveSerializer";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";
import { Material3D } from "../../../../src/Application/Services/MaterialService/Material3D";
import { DecalPlane } from "../../../../src/Application/Services/DecalService/DecalPlane";

describe("ProjectSaveSerializer", () => {
  const serializer = new ProjectSaveSerializer();

  const createDummyState = () => {
    const mesh = new MeshGeometry(
      [
        new Vector3D(0, 0, 0),
        new Vector3D(1, 0, 0),
        new Vector3D(1, 1, 0),
      ],
      [new Face3D([0, 1, 2], "mat_1")],
      [[0, 1]]
    );

    const materials = [
      new Material3D({
        id: "mat_1",
        name: "Test Red",
        baseColor: "#ff0000",
        roughness: 0.5,
        metalness: 0.1,
      }),
    ];

    const decals = [
      new DecalPlane(
        "decal_1",
        0,
        new Vector3D(0.5, 0.5, 0),
        new Vector3D(0, 0, 1),
        0.5,
        0,
        [
          new Vector3D(0.25, 0.25, 0),
          new Vector3D(0.75, 0.25, 0),
          new Vector3D(0.75, 0.75, 0),
          new Vector3D(0.25, 0.75, 0),
        ],
        "mat_1"
      ),
    ];

    return {
      mesh,
      materials,
      selectedMaterialId: "mat_1",
      decals,
    };
  };

  it("should create document, convert to json and parse back", () => {
    const state = createDummyState();
    const doc = serializer.createDocument("My Test Project", "2026-10-01T23:00:00Z", state);
    expect(doc.version).toBe(1);
    expect(doc.name).toBe("My Test Project");
    expect(doc.savedAt).toBe("2026-10-01T23:00:00Z");

    const json = serializer.toJson(doc);
    expect(typeof json).toBe("string");

    const parsed = serializer.parseDocument(json);
    expect(parsed.name).toBe("My Test Project");
    expect(parsed.version).toBe(1);

    const restoredState = serializer.restoreState(parsed);
    expect(restoredState.mesh.vertices.length).toBe(3);
    expect(restoredState.mesh.faces.length).toBe(1);
    expect(restoredState.materials.length).toBe(1);
    expect(restoredState.materials[0].id).toBe("mat_1");
    expect(restoredState.selectedMaterialId).toBe("mat_1");
    expect(restoredState.decals.length).toBe(1);
    expect(restoredState.decals[0].id).toBe("decal_1");
  });

  it("should throw error for invalid JSON", () => {
    expect(() => serializer.parseDocument("not-json")).toThrow(
      "The save file is not valid JSON"
    );
  });

  it("should throw error for missing document fields", () => {
    expect(() => serializer.parseDocument(JSON.stringify({ name: "hello" }))).toThrow(
      "The save file is missing required project data"
    );
  });

  it("should throw error for unsupported version", () => {
    const badVersionDoc = {
      version: 99,
      name: "Future",
      savedAt: "2026-10-01T00:00:00Z",
      mesh: { vertices: [], faces: [], explicitEdges: [] },
      materials: [],
      selectedMaterialId: null,
      decals: [],
    };
    expect(() => serializer.parseDocument(JSON.stringify(badVersionDoc))).toThrow(
      "Unsupported save file version"
    );
  });
});
