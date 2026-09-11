import { describe, it, expect, vi } from "vitest";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";
import { UiCustomizationService } from "../../../../src/Application/Services/UiCustomizationService/UiCustomizationService";

describe("UiCustomizationService", () => {
  it("should initialize with default right docking for both Side Tool Bar and Material Library", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new UiCustomizationService(notifier);

    expect(service.getSideToolBarDock()).toBe("right");
    expect(service.getMaterialLibraryDock()).toBe("right");
    expect(service.getSettings()).toEqual({
      sideToolBarDock: "right",
      materialLibraryDock: "right",
    });
  });

  it("should accept custom initial docking positions", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new UiCustomizationService(notifier, "left", "left");

    expect(service.getSideToolBarDock()).toBe("left");
    expect(service.getMaterialLibraryDock()).toBe("left");
  });

  it("should update Side Tool Bar dock and notify UI_CUSTOMIZATION_CHANGED", () => {
    const notifier = new ApplicationStateNotifier();
    const listener = vi.fn();
    notifier.subscribe("UI_CUSTOMIZATION_CHANGED", listener);

    const service = new UiCustomizationService(notifier);
    service.setSideToolBarDock("left");

    expect(service.getSideToolBarDock()).toBe("left");
    expect(listener).toHaveBeenCalledWith({
      sideToolBarDock: "left",
      materialLibraryDock: "right",
    });

    // Setting same dock side should not notify
    listener.mockClear();
    service.setSideToolBarDock("left");
    expect(listener).not.toHaveBeenCalled();
  });

  it("should update Material Library dock and notify UI_CUSTOMIZATION_CHANGED", () => {
    const notifier = new ApplicationStateNotifier();
    const listener = vi.fn();
    notifier.subscribe("UI_CUSTOMIZATION_CHANGED", listener);

    const service = new UiCustomizationService(notifier);
    service.setMaterialLibraryDock("left");

    expect(service.getMaterialLibraryDock()).toBe("left");
    expect(listener).toHaveBeenCalledWith({
      sideToolBarDock: "right",
      materialLibraryDock: "left",
    });

    // Setting same dock side should not notify
    listener.mockClear();
    service.setMaterialLibraryDock("left");
    expect(listener).not.toHaveBeenCalled();
  });

  it("should set both docks via setCustomization and notify if changed", () => {
    const notifier = new ApplicationStateNotifier();
    const listener = vi.fn();
    notifier.subscribe("UI_CUSTOMIZATION_CHANGED", listener);

    const service = new UiCustomizationService(notifier);
    service.setCustomization("left", "left");

    expect(service.getSideToolBarDock()).toBe("left");
    expect(service.getMaterialLibraryDock()).toBe("left");
    expect(listener).toHaveBeenCalledWith({
      sideToolBarDock: "left",
      materialLibraryDock: "left",
    });

    // Calling setCustomization with same values should not notify
    listener.mockClear();
    service.setCustomization("left", "left");
    expect(listener).not.toHaveBeenCalled();
  });
});
