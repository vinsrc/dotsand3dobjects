import { describe, it, expect, vi } from "vitest";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";
import { UiCustomizationService } from "../../../../src/Application/Services/UiCustomizationService/UiCustomizationService";

describe("UiCustomizationService", () => {
  it("should initialize with default right docking and edge line width of 2", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new UiCustomizationService(notifier);

    expect(service.getSideToolBarDock()).toBe("right");
    expect(service.getMaterialLibraryDock()).toBe("right");
    expect(service.getEdgeLineWidth()).toBe(2);
    expect(service.getSettings()).toEqual({
      sideToolBarDock: "right",
      materialLibraryDock: "right",
      edgeLineWidth: 2,
    });
  });

  it("should accept custom initial docking positions and edge line width", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new UiCustomizationService(notifier, "left", "left", 4);

    expect(service.getSideToolBarDock()).toBe("left");
    expect(service.getMaterialLibraryDock()).toBe("left");
    expect(service.getEdgeLineWidth()).toBe(4);
    expect(service.getSettings()).toEqual({
      sideToolBarDock: "left",
      materialLibraryDock: "left",
      edgeLineWidth: 4,
    });
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
      edgeLineWidth: 2,
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
      edgeLineWidth: 2,
    });

    // Setting same dock side should not notify
    listener.mockClear();
    service.setMaterialLibraryDock("left");
    expect(listener).not.toHaveBeenCalled();
  });

  it("should update edge line width and notify UI_CUSTOMIZATION_CHANGED", () => {
    const notifier = new ApplicationStateNotifier();
    const listener = vi.fn();
    notifier.subscribe("UI_CUSTOMIZATION_CHANGED", listener);

    const service = new UiCustomizationService(notifier);
    service.setEdgeLineWidth(5);

    expect(service.getEdgeLineWidth()).toBe(5);
    expect(listener).toHaveBeenCalledWith({
      sideToolBarDock: "right",
      materialLibraryDock: "right",
      edgeLineWidth: 5,
    });

    // Setting same line width should not notify
    listener.mockClear();
    service.setEdgeLineWidth(5);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should set customization with edgeLineWidth and notify if changed", () => {
    const notifier = new ApplicationStateNotifier();
    const listener = vi.fn();
    notifier.subscribe("UI_CUSTOMIZATION_CHANGED", listener);

    const service = new UiCustomizationService(notifier);
    service.setCustomization("left", "left", 3);

    expect(service.getSideToolBarDock()).toBe("left");
    expect(service.getMaterialLibraryDock()).toBe("left");
    expect(service.getEdgeLineWidth()).toBe(3);
    expect(listener).toHaveBeenCalledWith({
      sideToolBarDock: "left",
      materialLibraryDock: "left",
      edgeLineWidth: 3,
    });

    // Calling setCustomization with same values should not notify
    listener.mockClear();
    service.setCustomization("left", "left", 3);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should preserve existing edge line width if omitted in setCustomization", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new UiCustomizationService(notifier, "right", "right", 4);
    const listener = vi.fn();
    notifier.subscribe("UI_CUSTOMIZATION_CHANGED", listener);

    service.setCustomization("left", "left");

    expect(service.getEdgeLineWidth()).toBe(4);
    expect(listener).toHaveBeenCalledWith({
      sideToolBarDock: "left",
      materialLibraryDock: "left",
      edgeLineWidth: 4,
    });
  });
});
