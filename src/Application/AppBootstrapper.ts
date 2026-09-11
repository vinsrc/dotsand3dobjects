import { ModelFactory } from "./Services/ModelService/ModelFactory";
import { ObjParser } from "./Services/ModelService/ObjParser";
import { ObjExporter } from "./Services/ModelService/ObjExporter";
import { MtlParser } from "./Services/ModelService/MtlParser";
import { ApplicationStateNotifier } from "./Common/ApplicationStateNotifier";
import { ModelService } from "./Services/ModelService/ModelService";
import { OrthographicViewStrategyFactory } from "./Services/CameraService/OrthographicViewStrategy";
import { OrthographicViewSelector } from "./Services/CameraService/OrthographicViewSelector";
import { CameraStateService } from "./Services/CameraService/CameraStateService";
import { RenderModeService } from "./Services/RenderModeService/RenderModeService";
import { EditorModeService } from "./Services/EditorModeService/EditorModeService";
import { SelectionService } from "./Services/SelectionService/SelectionService";
import { GeometryEditorService } from "./Services/GeometryEditorService/GeometryEditorService";
import { UndoRedoService } from "./Services/UndoRedoService/UndoRedoService";
import { AppController } from "./Controllers/AppController";

import { MaterialService } from "./Services/MaterialService/MaterialService";
import { UiCustomizationService } from "./Services/UiCustomizationService/UiCustomizationService";

export class AppBootstrapper {
  public static createApplication(): {
    appController: AppController;
    modelService: ModelService;
    cameraStateService: CameraStateService;
    renderModeService: RenderModeService;
    editorModeService: EditorModeService;
    selectionService: SelectionService;
    geometryEditorService: GeometryEditorService;
    undoRedoService: UndoRedoService;
    materialService: MaterialService;
    uiCustomizationService: UiCustomizationService;
    stateNotifier: ApplicationStateNotifier;
  } {
    const modelFactory = new ModelFactory();
    const objParser = new ObjParser(modelFactory);
    const objExporter = new ObjExporter();
    const mtlParser = new MtlParser();
    const stateNotifier = new ApplicationStateNotifier();

    const modelService = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      stateNotifier,
      mtlParser
    );

    const orthographicViewFactory = new OrthographicViewStrategyFactory();
    const orthographicViewSelector = new OrthographicViewSelector();
    const cameraStateService = new CameraStateService(
      orthographicViewFactory,
      orthographicViewSelector
    );
    const renderModeService = new RenderModeService("FLAT_SHADED");

    const editorModeService = new EditorModeService(stateNotifier);
    const selectionService = new SelectionService(stateNotifier);
    const geometryEditorService = new GeometryEditorService(
      modelService,
      selectionService
    );
    const undoRedoService = new UndoRedoService(stateNotifier);
    const materialService = new MaterialService(stateNotifier);
    const uiCustomizationService = new UiCustomizationService(stateNotifier);

    const appController = new AppController(
      modelService,
      cameraStateService,
      renderModeService,
      editorModeService,
      selectionService,
      geometryEditorService,
      undoRedoService,
      stateNotifier,
      materialService,
      uiCustomizationService
    );

    return {
      appController,
      modelService,
      cameraStateService,
      renderModeService,
      editorModeService,
      selectionService,
      geometryEditorService,
      undoRedoService,
      materialService,
      uiCustomizationService,
      stateNotifier,
    };
  }
}
