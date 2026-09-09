import { ModelFactory } from "./Services/ModelService/ModelFactory";
import { ObjParser } from "./Services/ModelService/ObjParser";
import { ObjExporter } from "./Services/ModelService/ObjExporter";
import { ApplicationStateNotifier } from "./Common/ApplicationStateNotifier";
import { ModelService } from "./Services/ModelService/ModelService";
import { OrthographicViewStrategyFactory } from "./Services/CameraService/OrthographicViewStrategy";
import { CameraStateService } from "./Services/CameraService/CameraStateService";
import { RenderModeService } from "./Services/RenderModeService/RenderModeService";
import { AppController } from "./Controllers/AppController";

export class AppBootstrapper {
  public static createApplication(): {
    appController: AppController;
    modelService: ModelService;
    cameraStateService: CameraStateService;
    renderModeService: RenderModeService;
    stateNotifier: ApplicationStateNotifier;
  } {
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
  }
}
