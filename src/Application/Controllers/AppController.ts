import { ModelService } from "../Services/ModelService/ModelService";
import { CameraStateService } from "../Services/CameraService/CameraStateService";
import { RenderModeService } from "../Services/RenderModeService/RenderModeService";
import { EditorModeService, UiMode } from "../Services/EditorModeService/EditorModeService";
import { SelectionService } from "../Services/SelectionService/SelectionService";
import { GeometryEditorService } from "../Services/GeometryEditorService/GeometryEditorService";
import { ApplicationStateNotifier } from "../Common/ApplicationStateNotifier";
import { OrthographicAxis } from "../Services/CameraService/OrthographicViewStrategy";
import { Vector3D } from "../Common/Vector3D";
import {
  UndoRedoService,
  EditorStateSnapshot,
} from "../Services/UndoRedoService/UndoRedoService";

export class AppController {
  private readonly modelService: ModelService;
  private readonly cameraStateService: CameraStateService;
  private readonly renderModeService: RenderModeService;
  private readonly editorModeService: EditorModeService;
  private readonly selectionService: SelectionService;
  private readonly geometryEditorService: GeometryEditorService;
  private readonly undoRedoService: UndoRedoService;
  private readonly stateNotifier: ApplicationStateNotifier;

  public constructor(
    modelService: ModelService,
    cameraStateService: CameraStateService,
    renderModeService: RenderModeService,
    editorModeService: EditorModeService,
    selectionService: SelectionService,
    geometryEditorService: GeometryEditorService,
    undoRedoService: UndoRedoService,
    stateNotifier: ApplicationStateNotifier
  ) {
    this.modelService = modelService;
    this.cameraStateService = cameraStateService;
    this.renderModeService = renderModeService;
    this.editorModeService = editorModeService;
    this.selectionService = selectionService;
    this.geometryEditorService = geometryEditorService;
    this.undoRedoService = undoRedoService;
    this.stateNotifier = stateNotifier;
  }

  public getModelService(): ModelService {
    return this.modelService;
  }

  public getCameraStateService(): CameraStateService {
    return this.cameraStateService;
  }

  public getRenderModeService(): RenderModeService {
    return this.renderModeService;
  }

  public getEditorModeService(): EditorModeService {
    return this.editorModeService;
  }

  public getSelectionService(): SelectionService {
    return this.selectionService;
  }

  public getGeometryEditorService(): GeometryEditorService {
    return this.geometryEditorService;
  }

  public getUndoRedoService(): UndoRedoService {
    return this.undoRedoService;
  }

  public getStateNotifier(): ApplicationStateNotifier {
    return this.stateNotifier;
  }

  public loadModelFromFile(fileName: string, fileContent: string): void {
    try {
      this.modelService.loadFromObj(fileContent, fileName);
      const boundingRadius = this.modelService
        .getCurrentModel()
        .calculateBoundingRadius();
      this.cameraStateService.fitToRadius(boundingRadius);
      this.cameraStateService.setTargetPoint(
        this.modelService.getCurrentModel().calculateCenter()
      );
      this.selectionService.clearSelection();
      this.undoRedoService.clear();
      this.stateNotifier.notify("VIEW_CHANGED");
    } catch (caughtError) {
      // Notification is already dispatched by ModelService
    }
  }

  public exportModelToFile(): string {
    return this.modelService.exportToObj();
  }

  public toggleRenderMode(): void {
    this.renderModeService.toggleRenderMode();
    this.stateNotifier.notify("RENDER_MODE_CHANGED");
  }

  public selectOrthographicView(axisIdentifier: OrthographicAxis): void {
    this.cameraStateService.setOrthographicAxis(axisIdentifier);
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public rotateCamera(deltaAzimuth: number, deltaElevation: number): void {
    this.cameraStateService.orbit(deltaAzimuth, deltaElevation);
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public zoomIn(): void {
    this.cameraStateService.zoomIn();
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public zoomOut(): void {
    this.cameraStateService.zoomOut();
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public panCamera(deltaRight: number, deltaUp: number): void {
    this.cameraStateService.pan(deltaRight, deltaUp);
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public centerObject(): void {
    const objectCenter = this.modelService.getCurrentModel().calculateCenter();
    this.cameraStateService.centerOn(objectCenter);
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public enterMode(targetMode: UiMode): boolean {
    const isOrthographic = this.cameraStateService.isOrthographic();
    return this.editorModeService.setMode(targetMode, isOrthographic);
  }

  public finishMode(): void {
    this.editorModeService.finishMode();
  }

  public toggleAutoConnect(): void {
    this.editorModeService.toggleAutoConnect();
  }

  public recordSnapshot(): void {
    this.undoRedoService.recordSnapshot({
      model: this.modelService.getCurrentModel(),
      selectedIndices: this.selectionService.getSelectedIndices(),
      activeVertexIndex: this.selectionService.getActiveVertex(),
    });
  }

  public undo(): void {
    const currentSnapshot: EditorStateSnapshot = {
      model: this.modelService.getCurrentModel(),
      selectedIndices: this.selectionService.getSelectedIndices(),
      activeVertexIndex: this.selectionService.getActiveVertex(),
    };
    const previousSnapshot = this.undoRedoService.undo(currentSnapshot);
    if (previousSnapshot) {
      this.modelService.setCurrentModel(previousSnapshot.model);
      this.selectionService.restoreSelection(
        previousSnapshot.selectedIndices,
        previousSnapshot.activeVertexIndex
      );
    }
  }

  public redo(): void {
    const currentSnapshot: EditorStateSnapshot = {
      model: this.modelService.getCurrentModel(),
      selectedIndices: this.selectionService.getSelectedIndices(),
      activeVertexIndex: this.selectionService.getActiveVertex(),
    };
    const nextSnapshot = this.undoRedoService.redo(currentSnapshot);
    if (nextSnapshot) {
      this.modelService.setCurrentModel(nextSnapshot.model);
      this.selectionService.restoreSelection(
        nextSnapshot.selectedIndices,
        nextSnapshot.activeVertexIndex
      );
    }
  }

  public canUndo(): boolean {
    return this.undoRedoService.canUndo();
  }

  public canRedo(): boolean {
    return this.undoRedoService.canRedo();
  }

  public selectSingleVertex(vertexIndex: number): void {
    this.recordSnapshot();
    this.selectionService.selectSingle(vertexIndex);
  }

  public toggleVertexSelection(vertexIndex: number): void {
    this.recordSnapshot();
    this.selectionService.toggleSelect(vertexIndex);
  }

  public clearSelection(): void {
    if (this.selectionService.getSelectedIndices().length > 0) {
      this.recordSnapshot();
      this.selectionService.clearSelection();
    }
  }

  public deleteSelectedVertices(): void {
    if (this.selectionService.getSelectedIndices().length === 0) {
      return;
    }
    this.recordSnapshot();
    this.geometryEditorService.deleteSelectedVertices();
  }

  public beginTranslation(): void {
    this.recordSnapshot();
  }

  public addVertexAtPosition(worldPosition: Vector3D): void {
    const isOrthographic = this.cameraStateService.isOrthographic();
    if (!isOrthographic) {
      this.stateNotifier.notify(
        "ERROR_OCCURRED",
        "Switch to an Orthographic view"
      );
      return;
    }

    this.recordSnapshot();
    const snappedPosition = this.geometryEditorService.snapToGrid(worldPosition);
    this.geometryEditorService.addVertex(
      snappedPosition,
      this.editorModeService.isAutoConnectEnabled()
    );
  }

  public translateSelectedVertices(offsetVector: Vector3D): void {
    const isOrthographic = this.cameraStateService.isOrthographic();
    if (!isOrthographic) {
      this.stateNotifier.notify(
        "ERROR_OCCURRED",
        "Switch to an Orthographic view"
      );
      return;
    }

    this.geometryEditorService.translateSelected(offsetVector);
  }

  public insertVertexOnEdge(startVertexIndex: number, endVertexIndex: number): void {
    this.recordSnapshot();
    this.geometryEditorService.insertVertexOnEdge(
      startVertexIndex,
      endVertexIndex
    );
  }

  public connectVertices(
    firstVertexIndex: number,
    secondVertexIndex: number
  ): void {
    this.recordSnapshot();
    this.geometryEditorService.connectVertices(
      firstVertexIndex,
      secondVertexIndex
    );
  }
}
