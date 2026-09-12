import { describe, it, expect, vi } from "vitest";
import { DecalService } from "../../../../src/Application/Services/DecalService/DecalService";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("DecalService", () => {
  const quadVertices: Vector3D[] = [
    new Vector3D(-1, -1, 1),
    new Vector3D(1, -1, 1),
    new Vector3D(1, 1, 1),
    new Vector3D(-1, 1, 1),
  ];

  it("should initialize with empty decals and no selection", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new DecalService(stateNotifier);

    expect(service.getDecals()).toEqual([]);
    expect(service.getSelectedDecalId()).toBeNull();
    expect(service.getSelectedDecal()).toBeNull();
    expect(service.isDecalSelected()).toBe(false);
  });

  it("should create a decal on face, select it, and notify DECALS_CHANGED", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new DecalService(stateNotifier);
    const listener = vi.fn();
    stateNotifier.subscribe("DECALS_CHANGED", listener);

    const decal = service.createDecalOnFace(0, quadVertices);

    expect(decal).toBeDefined();
    expect(decal.id).toBe("decal_1");
    expect(service.getDecals().length).toBe(1);
    expect(service.getSelectedDecalId()).toBe("decal_1");
    expect(service.getSelectedDecal()?.id).toBe("decal_1");
    expect(service.isDecalSelected()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should select and deselect decal and notify", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new DecalService(stateNotifier);
    const decal = service.createDecalOnFace(0, quadVertices);

    const listener = vi.fn();
    stateNotifier.subscribe("DECALS_CHANGED", listener);

    service.selectDecal(null);
    expect(service.isDecalSelected()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);

    service.selectDecal(decal.id);
    expect(service.isDecalSelected()).toBe(true);
    expect(service.getSelectedDecalId()).toBe(decal.id);

    // Re-selecting same id does not re-notify
    service.selectDecal(decal.id);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("should assign material to selected decal and notify", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new DecalService(stateNotifier);
    const decal = service.createDecalOnFace(0, quadVertices);

    service.assignMaterialToSelectedDecal("mat_gold");
    expect(service.getDecal(decal.id)?.materialId).toBe("mat_gold");

    service.assignMaterialToSelectedDecal(null);
    expect(service.getDecal(decal.id)?.materialId).toBeNull();
  });

  it("should apply translation and rotation transforms to selected decal", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new DecalService(stateNotifier);
    const decal = service.createDecalOnFace(0, quadVertices);
    const initialX = decal.center.coordinateX;

    service.applyDecalTransform(new Vector3D(1, 0, 0), Math.PI / 4);
    const updated = service.getSelectedDecal();

    expect(updated?.center.coordinateX).toBeCloseTo(initialX + 1, 4);
    expect(updated?.rotationAngle).toBeCloseTo(Math.PI / 4, 4);
  });

  it("should restore state for undo/redo", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new DecalService(stateNotifier);
    const decal = service.createDecalOnFace(0, quadVertices);

    const savedDecals = service.getDecals();
    const savedId = service.getSelectedDecalId();

    service.selectDecal(null);
    expect(service.isDecalSelected()).toBe(false);

    service.restoreState(savedDecals, savedId);
    expect(service.getDecals().length).toBe(1);
    expect(service.getSelectedDecalId()).toBe(decal.id);
  });

  it("should delete decal by id and delete selected decal", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new DecalService(stateNotifier);
    const decal1 = service.createDecalOnFace(0, quadVertices);
    const decal2 = service.createDecalOnFace(1, quadVertices);

    expect(service.getDecals().length).toBe(2);
    expect(service.getSelectedDecalId()).toBe(decal2.id);

    // Delete selected decal (no id argument)
    const deletedSelected = service.deleteDecal();
    expect(deletedSelected).toBe(true);
    expect(service.getDecals().length).toBe(1);
    expect(service.getSelectedDecalId()).toBeNull();

    // Delete by specific id
    const deleted1 = service.deleteDecal(decal1.id);
    expect(deleted1).toBe(true);
    expect(service.getDecals().length).toBe(0);

    // Non-existent id returns false
    expect(service.deleteDecal("nonexistent")).toBe(false);
  });

  it("should get decals for face and delete decals for face", () => {
    const stateNotifier = new ApplicationStateNotifier();
    const service = new DecalService(stateNotifier);
    const decal1 = service.createDecalOnFace(0, quadVertices);
    const decal2 = service.createDecalOnFace(0, quadVertices);
    const decal3 = service.createDecalOnFace(1, quadVertices);

    const face0Decals = service.getDecalsForFace(0);
    expect(face0Decals.length).toBe(2);
    expect(face0Decals.map((d) => d.id)).toEqual([decal1.id, decal2.id]);

    const face1Decals = service.getDecalsForFace(1);
    expect(face1Decals.length).toBe(1);
    expect(face1Decals[0]?.id).toBe(decal3.id);

    // Delete face 0 decals
    service.deleteDecalsForFace(0);
    expect(service.getDecals().length).toBe(1);
    expect(service.getDecalsForFace(0).length).toBe(0);
    expect(service.getDecalsForFace(1).length).toBe(1);
  });
});
