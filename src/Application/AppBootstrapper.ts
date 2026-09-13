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
import { GeometryTransformService } from "./Services/GeometryTransformService/GeometryTransformService";
import { UndoRedoService } from "./Services/UndoRedoService/UndoRedoService";
import { AppController } from "./Controllers/AppController";

import { MaterialService } from "./Services/MaterialService/MaterialService";
import { UiCustomizationService } from "./Services/UiCustomizationService/UiCustomizationService";
import { LocalStorageUiCustomizationStorage } from "./Services/UiCustomizationService/LocalStorageUiCustomizationStorage";
import { DecalService } from "./Services/DecalService/DecalService";
import { ZipExportService } from "./Services/ZipExportService/ZipExportService";
import { ZipImportService } from "./Services/ZipExportService/ZipImportService";
import { DataUrlConverter } from "./Common/DataUrlConverter";
import { KeyboardShortcutService } from "./Services/KeyboardShortcutService/KeyboardShortcutService";
import { VertexMergeService } from "./Services/VertexMergeService/VertexMergeService";

export class AppBootstrapper {
  public static createApplication(): {
    appController: AppController;
    modelService: ModelService;
    cameraStateService: CameraStateService;
    renderModeService: RenderModeService;
    editorModeService: EditorModeService;
    selectionService: SelectionService;
    geometryEditorService: GeometryEditorService;
    geometryTransformService: GeometryTransformService;
    undoRedoService: UndoRedoService;
    materialService: MaterialService;
    uiCustomizationService: UiCustomizationService;
    decalService: DecalService;
    zipExportService: ZipExportService;
    zipImportService: ZipImportService;
    vertexMergeService: VertexMergeService;
    stateNotifier: ApplicationStateNotifier;
    keyboardShortcutService: KeyboardShortcutService;
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
    const geometryTransformService = new GeometryTransformService(
      modelService,
      selectionService,
      geometryEditorService
    );
    const undoRedoService = new UndoRedoService(stateNotifier);
    const uiCustomizationStorage = new LocalStorageUiCustomizationStorage();
    const uiCustomizationService = new UiCustomizationService(
      stateNotifier,
      "right",
      "right",
      2,
      uiCustomizationStorage
    );
    const materialService = new MaterialService(
      stateNotifier,
      uiCustomizationService.getMaterialLibraryDock()
    );
    const decalService = new DecalService(stateNotifier);
    const zipExportService = new ZipExportService();
    const dataUrlConverter = new DataUrlConverter();
    const zipImportService = new ZipImportService(dataUrlConverter);
    const vertexMergeService = new VertexMergeService(
      modelService,
      selectionService,
      decalService
    );

    const appController = new AppController(
      modelService,
      cameraStateService,
      renderModeService,
      editorModeService,
      selectionService,
      geometryEditorService,
      geometryTransformService,
      undoRedoService,
      stateNotifier,
      materialService,
      uiCustomizationService,
      decalService,
      zipExportService,
      dataUrlConverter,
      zipImportService,
      vertexMergeService
    );

    const keyboardShortcutService = new KeyboardShortcutService(appController);

    return {
      appController,
      modelService,
      cameraStateService,
      renderModeService,
      editorModeService,
      selectionService,
      geometryEditorService,
      geometryTransformService,
      undoRedoService,
      materialService,
      uiCustomizationService,
      decalService,
      zipExportService,
      zipImportService,
      vertexMergeService,
      stateNotifier,
      keyboardShortcutService,
    };
  }
}
