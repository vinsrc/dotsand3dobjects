import { describe, it, expect, vi } from "vitest";
import { EditorModeService } from "../../../../src/Application/Services/EditorModeService/EditorModeService";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";

describe("EditorModeService", () => {
  it("should initialize in DEFAULT mode with auto-connect disabled", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new EditorModeService(notifier);

    expect(service.getMode()).toBe("DEFAULT");
    expect(service.isAutoConnectEnabled()).toBe(false);
  });

  it("should allow entering MULTI_SELECT, INSERT, and FILL modes in any view", () => {
    const notifier = new ApplicationStateNotifier();
    const modeListener = vi.fn();
    notifier.subscribe("MODE_CHANGED", modeListener);

    const service = new EditorModeService(notifier);

    // In perspective view (isOrthographic = false)
    const canEnterMulti = service.setMode("MULTI_SELECT", false);
    expect(canEnterMulti).toBe(true);
    expect(service.getMode()).toBe("MULTI_SELECT");
    expect(modeListener).toHaveBeenCalledWith("MULTI_SELECT");

    const canEnterInsert = service.setMode("INSERT", false);
    expect(canEnterInsert).toBe(true);
    expect(service.getMode()).toBe("INSERT");

    const canEnterFill = service.setMode("FILL", false);
    expect(canEnterFill).toBe(true);
    expect(service.getMode()).toBe("FILL");
  });

  it("should prevent entering TRANSLATE, ROTATE, and SCALE modes in perspective view and emit error", () => {
    const notifier = new ApplicationStateNotifier();
    const errorListener = vi.fn();
    notifier.subscribe("ERROR_OCCURRED", errorListener);

    const service = new EditorModeService(notifier);

    // Attempt entering TRANSLATE in perspective
    const canEnterTranslate = service.setMode("TRANSLATE", false);
    expect(canEnterTranslate).toBe(false);
    expect(service.getMode()).toBe("DEFAULT");
    expect(errorListener).toHaveBeenCalledWith("Switch to an Orthographic view");

    // Attempt entering ROTATE in perspective
    const canEnterRotate = service.setMode("ROTATE", false);
    expect(canEnterRotate).toBe(false);
    expect(service.getMode()).toBe("DEFAULT");
    expect(errorListener).toHaveBeenCalledTimes(2);

    // Attempt entering SCALE in perspective
    const canEnterScale = service.setMode("SCALE", false);
    expect(canEnterScale).toBe(false);
    expect(service.getMode()).toBe("DEFAULT");
    expect(errorListener).toHaveBeenCalledTimes(3);
  });

  it("should allow entering TRANSLATE, ROTATE, and SCALE modes in orthographic view", () => {
    const notifier = new ApplicationStateNotifier();
    const modeListener = vi.fn();
    notifier.subscribe("MODE_CHANGED", modeListener);

    const service = new EditorModeService(notifier);

    const canEnterTranslate = service.setMode("TRANSLATE", true);
    expect(canEnterTranslate).toBe(true);
    expect(service.getMode()).toBe("TRANSLATE");
    expect(modeListener).toHaveBeenCalledWith("TRANSLATE");

    const canEnterRotate = service.setMode("ROTATE", true);
    expect(canEnterRotate).toBe(true);
    expect(service.getMode()).toBe("ROTATE");
    expect(modeListener).toHaveBeenCalledWith("ROTATE");

    const canEnterScale = service.setMode("SCALE", true);
    expect(canEnterScale).toBe(true);
    expect(service.getMode()).toBe("SCALE");
    expect(modeListener).toHaveBeenCalledWith("SCALE");
  });

  it("should return to DEFAULT mode on finishMode()", () => {
    const notifier = new ApplicationStateNotifier();
    const modeListener = vi.fn();
    notifier.subscribe("MODE_CHANGED", modeListener);

    const service = new EditorModeService(notifier);
    service.setMode("MULTI_SELECT", true);
    expect(service.getMode()).toBe("MULTI_SELECT");

    service.finishMode();
    expect(service.getMode()).toBe("DEFAULT");
    expect(modeListener).toHaveBeenCalledWith("DEFAULT");
  });

  it("should toggle auto-connect and emit notification", () => {
    const notifier = new ApplicationStateNotifier();
    const autoConnectListener = vi.fn();
    notifier.subscribe("AUTO_CONNECT_CHANGED", autoConnectListener);

    const service = new EditorModeService(notifier);
    expect(service.isAutoConnectEnabled()).toBe(false);

    service.toggleAutoConnect();
    expect(service.isAutoConnectEnabled()).toBe(true);
    expect(autoConnectListener).toHaveBeenCalledWith(true);

    service.toggleAutoConnect();
    expect(service.isAutoConnectEnabled()).toBe(false);
    expect(autoConnectListener).toHaveBeenCalledWith(false);
  });

  it("should initialize with grid snap enabled and support toggling and setting", () => {
    const notifier = new ApplicationStateNotifier();
    const gridSnapListener = vi.fn();
    notifier.subscribe("GRID_SNAP_CHANGED", gridSnapListener);

    const service = new EditorModeService(notifier);
    expect(service.isGridSnapEnabled()).toBe(true);

    service.toggleGridSnap();
    expect(service.isGridSnapEnabled()).toBe(false);
    expect(gridSnapListener).toHaveBeenCalledWith(false);

    service.toggleGridSnap();
    expect(service.isGridSnapEnabled()).toBe(true);
    expect(gridSnapListener).toHaveBeenCalledWith(true);

    service.setGridSnapEnabled(false);
    expect(service.isGridSnapEnabled()).toBe(false);
    expect(gridSnapListener).toHaveBeenCalledWith(false);

    service.setGridSnapEnabled(true);
    expect(service.isGridSnapEnabled()).toBe(true);
    expect(gridSnapListener).toHaveBeenCalledWith(true);
  });
});
