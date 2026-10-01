import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageProjectSaveStorage } from "../../../../src/Application/Services/ProjectSaveService/LocalStorageProjectSaveStorage";
import { ProjectSaveRecord } from "../../../../src/Application/Services/ProjectSaveService/ProjectSaveDocument";

describe("LocalStorageProjectSaveStorage", () => {
  const TEST_KEY = "test_project_saves";
  let storageMap: Record<string, string>;

  beforeEach(() => {
    storageMap = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => storageMap[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storageMap[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storageMap[key];
      }),
      clear: vi.fn(() => {
        storageMap = {};
      }),
    };
    vi.stubGlobal("localStorage", mockLocalStorage);
  });

  const createDummyRecord = (id: string, name: string, savedAt: string): ProjectSaveRecord => ({
    id,
    name,
    savedAt,
    document: {
      version: 1,
      name,
      savedAt,
      mesh: { vertices: [], faces: [], explicitEdges: [] },
      materials: [],
      selectedMaterialId: null,
      decals: [],
    },
  });

  it("should return empty list when no saves exist", () => {
    const storage = new LocalStorageProjectSaveStorage(TEST_KEY);
    expect(storage.list()).toEqual([]);
    expect(storage.getById("none")).toBeNull();
    expect(storage.findByName("none")).toBeNull();
  });

  it("should put and list records sorted by savedAt descending", () => {
    const storage = new LocalStorageProjectSaveStorage(TEST_KEY);
    const rec1 = createDummyRecord("id1", "Alpha", "2026-10-01T10:00:00Z");
    const rec2 = createDummyRecord("id2", "Beta", "2026-10-01T12:00:00Z");

    storage.put(rec1);
    storage.put(rec2);

    const list = storage.list();
    expect(list.length).toBe(2);
    expect(list[0].id).toBe("id2");
    expect(list[1].id).toBe("id1");

    expect(storage.getById("id1")?.name).toBe("Alpha");
    expect(storage.findByName("beta")?.id).toBe("id2");
  });

  it("should update existing record if put with matching id", () => {
    const storage = new LocalStorageProjectSaveStorage(TEST_KEY);
    const rec1 = createDummyRecord("id1", "Original", "2026-10-01T10:00:00Z");
    storage.put(rec1);

    const recUpdated = createDummyRecord("id1", "Updated", "2026-10-01T11:00:00Z");
    storage.put(recUpdated);

    expect(storage.list().length).toBe(1);
    expect(storage.getById("id1")?.name).toBe("Updated");
  });

  it("should handle corrupted json data safely", () => {
    storageMap[TEST_KEY] = "not-json-at-all";
    const storage = new LocalStorageProjectSaveStorage(TEST_KEY);
    expect(storage.list()).toEqual([]);
  });

  it("should handle non-array data safely", () => {
    storageMap[TEST_KEY] = JSON.stringify({ not: "an array" });
    const storage = new LocalStorageProjectSaveStorage(TEST_KEY);
    expect(storage.list()).toEqual([]);
  });

  it("should throw error when localStorage throws", () => {
    const mockLocalStorage = {
      getItem: vi.fn(() => {
        throw new Error("Quota exceeded");
      }),
      setItem: vi.fn(() => {
        throw new Error("Quota exceeded");
      }),
    };
    vi.stubGlobal("localStorage", mockLocalStorage);

    const storage = new LocalStorageProjectSaveStorage(TEST_KEY);
    expect(() => storage.put(createDummyRecord("id1", "Test", "2026-10-01T00:00:00Z"))).toThrow(
      "Could not save the project to browser storage"
    );
  });
});
