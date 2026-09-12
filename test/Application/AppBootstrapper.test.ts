import { describe, it, expect } from "vitest";
import { AppBootstrapper } from "../../src/Application/AppBootstrapper";

describe("AppBootstrapper", () => {
  it("should assemble and bootstrap application layer cleanly", () => {
    const appComponents = AppBootstrapper.createApplication();

    expect(appComponents.appController).toBeDefined();
    expect(appComponents.modelService).toBeDefined();
    expect(appComponents.cameraStateService).toBeDefined();
    expect(appComponents.renderModeService).toBeDefined();
    expect(appComponents.editorModeService).toBeDefined();
    expect(appComponents.selectionService).toBeDefined();
    expect(appComponents.geometryEditorService).toBeDefined();
    expect(appComponents.materialService).toBeDefined();
    expect(appComponents.uiCustomizationService).toBeDefined();
    expect(appComponents.decalService).toBeDefined();
    expect(appComponents.zipExportService).toBeDefined();
    expect(appComponents.stateNotifier).toBeDefined();

    expect(appComponents.modelService.getCurrentModel().isEmpty()).toBe(false);
  });
});
