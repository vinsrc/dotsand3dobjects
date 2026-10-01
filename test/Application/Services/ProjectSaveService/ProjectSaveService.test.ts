import { describe, it, expect } from "vitest";
import { ProjectSaveService } from "../../../../src/Application/Services/ProjectSaveService/ProjectSaveService";
import { MemoryProjectSaveStorage } from "../../../../src/Application/Services/ProjectSaveService/MemoryProjectSaveStorage";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";

describe("ProjectSaveService", () => {
  const createService = () => {
    const storage = new MemoryProjectSaveStorage();
    let idCounter = 1;
    const idFactory = () => `save_${idCounter++}`;
    const clock = () => "2026-10-01T23:30:00Z";
    const service = new ProjectSaveService(storage, undefined, idFactory, clock);
    return { service, storage };
  };

  const createDummyState = () => {
    return {
      mesh: new MeshGeometry(
        [new Vector3D(0, 0, 0), new Vector3D(1, 0, 0), new Vector3D(0, 1, 0)],
        [new Face3D([0, 1, 2], null)],
        []
      ),
      materials: [],
      selectedMaterialId: null,
      decals: [],
    };
  };

  it("should initially need save name and have no active save name", () => {
    const { service } = createService();
    expect(service.needsSaveName()).toBe(true);
    expect(service.getActiveSaveName()).toBeNull();
    expect(service.listSaves()).toEqual([]);
  });

  it("should throw error if saving with empty name when no active save exists", () => {
    const { service } = createService();
    expect(() => service.save(createDummyState(), "   ")).toThrow(
      "A save name is required"
    );
  });

  it("should save new project and update active save name and id", () => {
    const { service } = createService();
    const record = service.save(createDummyState(), "My Spaceship");
    expect(record.id).toBe("save_1");
    expect(record.name).toBe("My Spaceship");
    expect(service.needsSaveName()).toBe(false);
    expect(service.getActiveSaveName()).toBe("My Spaceship");

    const saves = service.listSaves();
    expect(saves.length).toBe(1);
    expect(saves[0].name).toBe("My Spaceship");
  });

  it("should overwrite existing project when saving again without passing new name", () => {
    const { service } = createService();
    service.save(createDummyState(), "Initial Name");
    expect(service.getActiveSaveName()).toBe("Initial Name");

    // Next save uses the active name and keeps the same id
    const updated = service.save(createDummyState());
    expect(updated.id).toBe("save_1");
    expect(updated.name).toBe("Initial Name");
    expect(service.listSaves().length).toBe(1);
  });

  it("should load project by id and set active save name and id", () => {
    const { service } = createService();
    const record = service.save(createDummyState(), "Saved Scene");

    service.clearActiveSave();
    expect(service.needsSaveName()).toBe(true);

    const loaded = service.loadById(record.id);
    expect(loaded.mesh.vertices.length).toBe(3);
    expect(service.needsSaveName()).toBe(false);
    expect(service.getActiveSaveName()).toBe("Saved Scene");
  });

  it("should throw error if loadById is called for non-existent save", () => {
    const { service } = createService();
    expect(() => service.loadById("unknown_id")).toThrow(
      "Saved project was not found"
    );
  });

  it("should export and import JSON correctly", () => {
    const { service } = createService();
    const state = createDummyState();
    const json = service.exportJson(state, "Exported Robot");
    expect(typeof json).toBe("string");

    const imported = service.importJson(json);
    expect(imported.name).toBe("Exported Robot");
    expect(imported.state.mesh.vertices.length).toBe(3);
    expect(service.getActiveSaveName()).toBe("Exported Robot");
  });
});
