import { describe, it, expect, vi } from "vitest";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";
import { MaterialService } from "../../../../src/Application/Services/MaterialService/MaterialService";
import { Material3D } from "../../../../src/Application/Services/MaterialService/Material3D";

describe("MaterialService", () => {
  it("should initialize with empty materials, closed panel, and left dock", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new MaterialService(stateNotifier);

    expect(service.getMaterials()).toEqual([]);
    expect(service.getSelectedMaterialId()).toBeNull();
    expect(service.getSelectedMaterial()).toBeNull();
    expect(service.isPanelOpen()).toBe(false);
    expect(service.getDockSide()).toBe("left");
  });

  it("should create material with autoincrementing name and select it", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const materialListener = vi.fn();
    stateNotifier.subscribe("MATERIALS_CHANGED", materialListener);

    const service = new MaterialService(stateNotifier);
    const firstMaterial = service.createMaterial();

    expect(firstMaterial.name).toBe("Material 1");
    expect(service.getMaterials()).toHaveLength(1);
    expect(service.getSelectedMaterialId()).toBe(firstMaterial.id);
    expect(service.getSelectedMaterial()).toBe(firstMaterial);
    expect(materialListener).toHaveBeenCalledTimes(1);

    const secondMaterial = service.createMaterial();
    expect(secondMaterial.name).toBe("Material 2");
    expect(service.getMaterials()).toHaveLength(2);
    expect(service.getSelectedMaterialId()).toBe(secondMaterial.id);
  });

  it("should select material and ignore redundant selection", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new MaterialService(stateNotifier);
    const materialListener = vi.fn();

    const mat1 = service.createMaterial();
    const mat2 = service.createMaterial();

    stateNotifier.subscribe("MATERIALS_CHANGED", materialListener);

    service.selectMaterial(mat1.id);
    expect(service.getSelectedMaterialId()).toBe(mat1.id);
    expect(materialListener).toHaveBeenCalledTimes(1);

    // Redundant select
    service.selectMaterial(mat1.id);
    expect(materialListener).toHaveBeenCalledTimes(1);

    // Select null
    service.selectMaterial(null);
    expect(service.getSelectedMaterialId()).toBeNull();
    expect(service.getSelectedMaterial()).toBeNull();
  });

  it("should delete material and adjust selection if deleted was active", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new MaterialService(stateNotifier);

    const mat1 = service.createMaterial();
    const mat2 = service.createMaterial();
    expect(service.getSelectedMaterialId()).toBe(mat2.id);

    // Delete unknown material returns false
    const deleteUnknown = service.deleteMaterial("unknown_id");
    expect(deleteUnknown).toBe(false);

    // Delete active material switches selection to mat1
    const deleteMat2 = service.deleteMaterial(mat2.id);
    expect(deleteMat2).toBe(true);
    expect(service.getMaterials()).toHaveLength(1);
    expect(service.getSelectedMaterialId()).toBe(mat1.id);

    // Delete last material sets selected to null
    const deleteMat1 = service.deleteMaterial(mat1.id);
    expect(deleteMat1).toBe(true);
    expect(service.getMaterials()).toHaveLength(0);
    expect(service.getSelectedMaterialId()).toBeNull();
  });

  it("should update existing material and notify", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new MaterialService(stateNotifier);

    const created = service.createMaterial();
    const materialListener = vi.fn();
    stateNotifier.subscribe("MATERIALS_CHANGED", materialListener);

    const updated = created.withBaseColor("#123456").withName("Wood Texture");
    service.updateMaterial(updated);

    expect(service.getSelectedMaterial()?.name).toBe("Wood Texture");
    expect(service.getSelectedMaterial()?.baseColor).toBe("#123456");
    expect(materialListener).toHaveBeenCalledTimes(1);

    // Update non-existent material is safely ignored
    const nonExistent = new Material3D({ id: "missing", name: "Missing" });
    service.updateMaterial(nonExistent);
    expect(materialListener).toHaveBeenCalledTimes(1);
  });

  it("should manage panel open/closed state and notify", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const panelListener = vi.fn();
    stateNotifier.subscribe("MATERIAL_PANEL_CHANGED", panelListener);

    const service = new MaterialService(stateNotifier);
    service.togglePanel();
    expect(service.isPanelOpen()).toBe(true);
    expect(panelListener).toHaveBeenCalledWith({
      isOpen: true,
      dockSide: "left",
    });

    service.setPanelOpen(true); // Redundant
    expect(panelListener).toHaveBeenCalledTimes(1);

    service.setPanelOpen(false);
    expect(service.isPanelOpen()).toBe(false);
    expect(panelListener).toHaveBeenCalledTimes(2);
  });

  it("should manage dock side and notify", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const panelListener = vi.fn();
    stateNotifier.subscribe("MATERIAL_PANEL_CHANGED", panelListener);

    const service = new MaterialService(stateNotifier);
    service.setDockSide("right");
    expect(service.getDockSide()).toBe("right");
    expect(panelListener).toHaveBeenCalledWith({
      isOpen: false,
      dockSide: "right",
    });

    service.setDockSide("right"); // Redundant
    expect(panelListener).toHaveBeenCalledTimes(1);

    service.setDockSide("left");
    expect(service.getDockSide()).toBe("left");
    expect(panelListener).toHaveBeenCalledTimes(2);
  });

  it("should restore materials for undo/redo", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new MaterialService(stateNotifier);

    const restoredMats = [
      new Material3D({ id: "mat_1", name: "Restored 1" }),
      new Material3D({ id: "mat_2", name: "Restored 2" }),
    ];
    service.restoreMaterials(restoredMats, "mat_2");

    expect(service.getMaterials()).toHaveLength(2);
    expect(service.getSelectedMaterialId()).toBe("mat_2");
  });
});
