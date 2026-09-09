import { describe, it, expect, vi } from "vitest";
import { AppController } from "../../../src/Application/Controllers/AppController";
import { ModelService } from "../../../src/Application/Services/ModelService/ModelService";
import { CameraStateService } from "../../../src/Application/Services/CameraService/CameraStateService";
import { RenderModeService } from "../../../src/Application/Services/RenderModeService/RenderModeService";
import { ApplicationStateNotifier } from "../../../src/Application/Common/ApplicationStateNotifier";
import { ModelFactory } from "../../../src/Application/Services/ModelService/ModelFactory";
import { ObjParser } from "../../../src/Application/Services/ModelService/ObjParser";
import { ObjExporter } from "../../../src/Application/Services/ModelService/ObjExporter";
import { OrthographicViewStrategyFactory } from "../../../src/Application/Services/CameraService/OrthographicViewStrategy";

describe("AppController", () => {
  const createController = () => {
    const modelFactory = new ModelFactory();
    const objParser = new ObjParser(modelFactory);
    const objExporter = new ObjExporter();
    const stateNotifier = new ApplicationStateNotifier();

    const modelService = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      stateNotifier
    );

    const orthographicViewFactory = new OrthographicViewStrategyFactory();
    const cameraStateService = new CameraStateService(orthographicViewFactory);
    const renderModeService = new RenderModeService("FLAT_SHADED");

    const appController = new AppController(
      modelService,
      cameraStateService,
      renderModeService,
      stateNotifier
    );

    return {
      appController,
      modelService,
      cameraStateService,
      renderModeService,
      stateNotifier,
    };
  };

  it("should provide access to underlying services", () => {
    const { appController, modelService, cameraStateService, renderModeService, stateNotifier } =
      createController();

    expect(appController.getModelService()).toBe(modelService);
    expect(appController.getCameraStateService()).toBe(cameraStateService);
    expect(appController.getRenderModeService()).toBe(renderModeService);
    expect(appController.getStateNotifier()).toBe(stateNotifier);
  });

  it("should load valid model and adjust camera framing", () => {
    const { appController, cameraStateService } = createController();
    const objData = `
      v -10 -10 -10
      v 10 10 10
      v 0 10 0
      f 1 2 3
    `;

    appController.loadModelFromFile("large_model.obj", objData);
    expect(cameraStateService.getCameraDistance()).toBeGreaterThan(10);
  });

  it("should handle loading error gracefully without crashing", () => {
    const { appController, stateNotifier } = createController();
    const errorListener = vi.fn();
    stateNotifier.subscribe("ERROR_OCCURRED", errorListener);

    appController.loadModelFromFile("bad_file.stl", "unsupported");
    expect(errorListener).toHaveBeenCalledWith("Unsupported error");
  });

  it("should export model to OBJ format", () => {
    const { appController } = createController();
    const exportedText = appController.exportModelToFile();
    expect(exportedText).toContain("v ");
  });

  it("should toggle render mode and notify", () => {
    const { appController, renderModeService, stateNotifier } =
      createController();
    const modeListener = vi.fn();
    stateNotifier.subscribe("RENDER_MODE_CHANGED", modeListener);

    appController.toggleRenderMode();
    expect(renderModeService.isWireframe()).toBe(true);
    expect(modeListener).toHaveBeenCalledTimes(1);
  });

  it("should select orthographic view and notify", () => {
    const { appController, cameraStateService, stateNotifier } =
      createController();
    const viewListener = vi.fn();
    stateNotifier.subscribe("VIEW_CHANGED", viewListener);

    appController.selectOrthographicView("+X");
    expect(cameraStateService.isOrthographic()).toBe(true);
    expect(cameraStateService.getActiveStrategy().getAxisLabel()).toBe("+X");
    expect(viewListener).toHaveBeenCalledTimes(1);
  });

  it("should rotate camera and notify", () => {
    const { appController, cameraStateService, stateNotifier } =
      createController();
    const viewListener = vi.fn();
    stateNotifier.subscribe("VIEW_CHANGED", viewListener);

    appController.rotateCamera(0.2, 0.1);
    expect(cameraStateService.isOrthographic()).toBe(false);
    expect(viewListener).toHaveBeenCalledTimes(1);
  });

  it("should zoom in and out and notify", () => {
    const { appController, stateNotifier } = createController();
    const viewListener = vi.fn();
    stateNotifier.subscribe("VIEW_CHANGED", viewListener);

    appController.zoomIn();
    expect(viewListener).toHaveBeenCalledTimes(1);

    appController.zoomOut();
    expect(viewListener).toHaveBeenCalledTimes(2);
  });
});
