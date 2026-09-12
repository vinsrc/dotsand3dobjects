import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageUiCustomizationStorage } from "../../../../src/Application/Services/UiCustomizationService/LocalStorageUiCustomizationStorage";

describe("LocalStorageUiCustomizationStorage", () => {
  const TEST_KEY = "test_ui_customization";
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

  it("should return null if no item in localStorage", () => {
    const storage = new LocalStorageUiCustomizationStorage(TEST_KEY);
    expect(storage.load()).toBeNull();
  });

  it("should return null if localStorage item is invalid JSON", () => {
    storageMap[TEST_KEY] = "not-a-json";
    const storage = new LocalStorageUiCustomizationStorage(TEST_KEY);
    expect(storage.load()).toBeNull();
  });

  it("should return null if parsed JSON is not an object", () => {
    storageMap[TEST_KEY] = JSON.stringify("string-only");
    const storage = new LocalStorageUiCustomizationStorage(TEST_KEY);
    expect(storage.load()).toBeNull();
  });

  it("should correctly load valid settings from localStorage", () => {
    storageMap[TEST_KEY] = JSON.stringify({
      sideToolBarDock: "left",
      materialLibraryDock: "left",
      edgeLineWidth: 4,
    });
    const storage = new LocalStorageUiCustomizationStorage(TEST_KEY);
    const loaded = storage.load();
    expect(loaded).toEqual({
      sideToolBarDock: "left",
      materialLibraryDock: "left",
      edgeLineWidth: 4,
    });
  });

  it("should sanitize invalid dock values and out-of-range edgeLineWidth", () => {
    storageMap[TEST_KEY] = JSON.stringify({
      sideToolBarDock: "invalid",
      materialLibraryDock: "top",
      edgeLineWidth: 99,
    });
    const storage = new LocalStorageUiCustomizationStorage(TEST_KEY);
    const loaded = storage.load();
    expect(loaded).toEqual({
      sideToolBarDock: "right",
      materialLibraryDock: "right",
      edgeLineWidth: 2,
    });
  });

  it("should save settings to localStorage", () => {
    const storage = new LocalStorageUiCustomizationStorage(TEST_KEY);
    storage.save({
      sideToolBarDock: "left",
      materialLibraryDock: "right",
      edgeLineWidth: 3,
    });

    expect(storageMap[TEST_KEY]).toBeDefined();
    const parsed = JSON.parse(storageMap[TEST_KEY]);
    expect(parsed).toEqual({
      sideToolBarDock: "left",
      materialLibraryDock: "right",
      edgeLineWidth: 3,
    });
  });

  it("should safely handle environment where localStorage is undefined", () => {
    vi.stubGlobal("localStorage", undefined);
    const storage = new LocalStorageUiCustomizationStorage(TEST_KEY);

    expect(storage.load()).toBeNull();
    expect(() =>
      storage.save({
        sideToolBarDock: "left",
        materialLibraryDock: "left",
        edgeLineWidth: 1,
      })
    ).not.toThrow();
  });

  it("should catch and ignore exceptions thrown by localStorage.setItem", () => {
    const mockFailingStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("QuotaExceeded");
      }),
    };
    vi.stubGlobal("localStorage", mockFailingStorage);

    const storage = new LocalStorageUiCustomizationStorage(TEST_KEY);
    expect(() =>
      storage.save({
        sideToolBarDock: "left",
        materialLibraryDock: "left",
        edgeLineWidth: 1,
      })
    ).not.toThrow();
  });
});
