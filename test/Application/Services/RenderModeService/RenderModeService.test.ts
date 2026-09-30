import { describe, it, expect } from "vitest";
import { RenderModeService } from "../../../../src/Application/Services/RenderModeService/RenderModeService";

describe("RenderModeService", () => {
  it("should initialize to FLAT_SHADED by default", () => {
    const renderModeService = new RenderModeService();
    expect(renderModeService.getRenderMode()).toBe("FLAT_SHADED");
    expect(renderModeService.isFlatShaded()).toBe(true);
    expect(renderModeService.isWireframe()).toBe(false);
  });

  it("should toggle between WIREFRAME and FLAT_SHADED", () => {
    const renderModeService = new RenderModeService("FLAT_SHADED");

    const toggledMode = renderModeService.toggleRenderMode();
    expect(toggledMode).toBe("WIREFRAME");
    expect(renderModeService.isWireframe()).toBe(true);
    expect(renderModeService.isFlatShaded()).toBe(false);

    const revertedMode = renderModeService.toggleRenderMode();
    expect(revertedMode).toBe("FLAT_SHADED");
    expect(renderModeService.isFlatShaded()).toBe(true);
  });

  it("should allow explicit mode setting", () => {
    const renderModeService = new RenderModeService();
    renderModeService.setRenderMode("WIREFRAME");
    expect(renderModeService.getRenderMode()).toBe("WIREFRAME");
  });
});
