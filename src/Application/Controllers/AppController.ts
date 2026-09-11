import { ModelService } from "../Services/ModelService/ModelService";
import { MeshGeometry } from "../Services/ModelService/MeshGeometry";
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

import { MaterialService } from "../Services/MaterialService/MaterialService";
import { Material3D } from "../Services/MaterialService/Material3D";
import {
  UiCustomizationService,
  DockSide,
} from "../Services/UiCustomizationService/UiCustomizationService";

export class AppController {
  private readonly modelService: ModelService;
  private readonly cameraStateService: CameraStateService;
  private readonly renderModeService: RenderModeService;
  private readonly editorModeService: EditorModeService;
  private readonly selectionService: SelectionService;
  private readonly geometryEditorService: GeometryEditorService;
  private readonly undoRedoService: UndoRedoService;
  private readonly stateNotifier: ApplicationStateNotifier;
  private readonly materialService: MaterialService;
  private readonly uiCustomizationService: UiCustomizationService;
  private translationInitialModel: MeshGeometry | null = null;

  public constructor(
    modelService: ModelService,
    cameraStateService: CameraStateService,
    renderModeService: RenderModeService,
    editorModeService: EditorModeService,
    selectionService: SelectionService,
    geometryEditorService: GeometryEditorService,
    undoRedoService: UndoRedoService,
    stateNotifier: ApplicationStateNotifier,
    materialService: MaterialService,
    uiCustomizationService?: UiCustomizationService
  ) {
    this.modelService = modelService;
    this.cameraStateService = cameraStateService;
    this.renderModeService = renderModeService;
    this.editorModeService = editorModeService;
    this.selectionService = selectionService;
    this.geometryEditorService = geometryEditorService;
    this.undoRedoService = undoRedoService;
    this.stateNotifier = stateNotifier;
    this.materialService = materialService;
    this.uiCustomizationService =
      uiCustomizationService ?? new UiCustomizationService(stateNotifier);
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

  public loadModelFromFile(
    fileName: string,
    fileContent: string,
    mtlContent?: string
  ): void {
    try {
      let loadedMaterials: readonly Material3D[] = [];
      if (mtlContent) {
        loadedMaterials = this.modelService.parseMtl(mtlContent);
        if (loadedMaterials.length > 0) {
          const firstId = loadedMaterials[0].id;
          this.materialService.restoreMaterials(loadedMaterials, firstId);
        }
      }

      this.modelService.loadFromObj(
        fileContent,
        fileName,
        this.materialService.getMaterials()
      );

      const currentModel = this.modelService.getCurrentModel();
      const existingMaterials = this.materialService.getMaterials();
      const existingIdSet = new Set(existingMaterials.map((m) => m.id));
      const newlyDiscoveredMaterials: Material3D[] = [];

      for (const face of currentModel.faces) {
        if (face.materialId && !existingIdSet.has(face.materialId)) {
          const placeholder = new Material3D({
            id: face.materialId,
            name: face.materialId,
          });
          existingIdSet.add(face.materialId);
          newlyDiscoveredMaterials.push(placeholder);
        }
      }

      if (newlyDiscoveredMaterials.length > 0) {
        const combined = [...existingMaterials, ...newlyDiscoveredMaterials];
        this.materialService.restoreMaterials(
          combined,
          this.materialService.getSelectedMaterialId() ?? combined[0].id
        );
      }

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

  public loadMaterialsFromFile(
    _fileName: string,
    fileContent: string
  ): void {
    try {
      const parsedMaterials = this.modelService.parseMtl(fileContent);
      if (parsedMaterials.length > 0) {
        const existingMaterials = this.materialService.getMaterials();
        const mergedList: Material3D[] = [...existingMaterials];
        for (const parsedMaterial of parsedMaterials) {
          const existingIndex = mergedList.findIndex(
            (existing) => existing.name === parsedMaterial.name
          );
          if (existingIndex >= 0) {
            mergedList[existingIndex] = parsedMaterial;
          } else {
            mergedList.push(parsedMaterial);
          }
        }
        this.materialService.restoreMaterials(
          mergedList,
          parsedMaterials[0].id
        );
      }
    } catch (caughtError) {
      this.stateNotifier.notify("ERROR_OCCURRED", "Failed to load materials");
    }
  }

  public exportModelToFile(): string {
    return this.modelService.exportToObj(this.materialService.getMaterials());
  }

  public exportMtlFile(): string {
    return this.modelService.exportMtl(this.materialService.getMaterials());
  }

  public getMaterialService(): MaterialService {
    return this.materialService;
  }

  public createMaterial(): Material3D {
    this.recordSnapshot();
    return this.materialService.createMaterial();
  }

  public deleteMaterial(materialId: string): boolean {
    this.recordSnapshot();
    return this.materialService.deleteMaterial(materialId);
  }

  public updateMaterial(material: Material3D): void {
    this.materialService.updateMaterial(material);
  }

  public selectMaterial(materialId: string | null): void {
    this.materialService.selectMaterial(materialId);
  }

  public toggleMaterialLibraryPanel(): void {
    this.materialService.togglePanel();
  }

  public isMaterialLibraryPanelOpen(): boolean {
    return this.materialService.isPanelOpen();
  }

  public getUiCustomizationService(): UiCustomizationService {
    return this.uiCustomizationService;
  }

  public saveUiCustomization(
    sideToolBarDock: DockSide,
    materialLibraryDock: DockSide
  ): void {
    this.uiCustomizationService.setCustomization(
      sideToolBarDock,
      materialLibraryDock
    );
    this.materialService.setDockSide(materialLibraryDock);
  }

  public setMaterialLibraryDockSide(dockSide: DockSide): void {
    this.materialService.setDockSide(dockSide);
    this.uiCustomizationService.setMaterialLibraryDock(dockSide);
  }

  public assignMaterialToSelectedFaces(materialId: string | null): void {
    const selectedFaces = this.selectionService.getSelectedFaceIndices();
    const targetFaces =
      selectedFaces.length > 0
        ? selectedFaces
        : this.selectionService.getSelectedFaceIndex() !== null
        ? [this.selectionService.getSelectedFaceIndex() as number]
        : [];

    if (targetFaces.length === 0) {
      return;
    }

    this.recordSnapshot();
    const updatedModel = this.modelService
      .getCurrentModel()
      .assignMaterialToFaces(targetFaces, materialId);
    this.modelService.setCurrentModel(updatedModel);
  }

  public getSelectedFaceIndices(): readonly number[] {
    return this.selectionService.getSelectedFaceIndices();
  }

  public toggleRenderMode(): void {
    this.renderModeService.toggleRenderMode();
    this.stateNotifier.notify("RENDER_MODE_CHANGED");
  }

  public selectOrthographicView(axisIdentifier: OrthographicAxis): void {
    this.cameraStateService.setOrthographicAxis(axisIdentifier);
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public switchToClosestOrthographicView(): OrthographicAxis {
    const closestAxis =
      this.cameraStateService.switchToClosestOrthographicView();
    this.stateNotifier.notify("VIEW_CHANGED");
    return closestAxis;
  }

  public selectFace(faceIndex: number): void {
    this.recordSnapshot();
    const currentModel = this.modelService.getCurrentModel();
    const targetFace = currentModel.faces[faceIndex];
    if (!targetFace) {
      return;
    }
    const currentMode = this.editorModeService.getMode();
    if (currentMode === "MULTI_SELECT") {
      this.selectionService.toggleFaceSelection(
        faceIndex,
        targetFace.vertexIndices
      );
    } else {
      this.selectionService.selectFace(faceIndex, targetFace.vertexIndices);
    }

    if (!this.materialService.isPanelOpen()) {
      this.materialService.setPanelOpen(true);
    }
  }

  public setFaceOrthographicView(faceIndex: number): void {
    const currentModel = this.modelService.getCurrentModel();
    const targetFace = currentModel.faces[faceIndex];
    if (!targetFace) {
      return;
    }
    const faceNormal = targetFace.calculateNormal(currentModel.vertices);
    const faceCenter = currentModel.calculateFaceCenter(faceIndex);
    this.cameraStateService.setFaceOrthographicView(
      faceIndex,
      faceNormal,
      faceCenter
    );
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public getSelectedFaceIndex(): number | null {
    return this.selectionService.getSelectedFaceIndex();
  }

  public isFaceOrthographicView(): boolean {
    return this.cameraStateService.isFaceOrthographicView();
  }

  public setFaceFront(): boolean {
    if (!this.cameraStateService.isFaceOrthographicView()) {
      return false;
    }

    const activeFaceIndex = this.cameraStateService.getActiveFaceIndex();
    if (activeFaceIndex === null) {
      return false;
    }

    const currentModel = this.modelService.getCurrentModel();
    const targetFace = currentModel.faces[activeFaceIndex];
    if (!targetFace) {
      return false;
    }

    this.recordSnapshot();

    const updatedModel = currentModel.reverseFaceWinding(activeFaceIndex);
    this.modelService.setCurrentModel(updatedModel);

    const updatedFace = updatedModel.faces[activeFaceIndex];
    if (updatedFace) {
      const newNormal = updatedFace.calculateNormal(updatedModel.vertices);
      const faceCenter = updatedModel.calculateFaceCenter(activeFaceIndex);
      this.cameraStateService.setFaceOrthographicView(
        activeFaceIndex,
        newNormal,
        faceCenter
      );
    }

    this.stateNotifier.notify("VIEW_CHANGED");
    return true;
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
    const success = this.editorModeService.setMode(targetMode, isOrthographic);
    if (success && targetMode === "FILL") {
      const selectedIndices = this.selectionService.getSelectedIndices();
      if (selectedIndices.length === 2) {
        const activeVertex = this.selectionService.getActiveVertex();
        const firstVertex = selectedIndices[0] as number;
        const secondVertex = selectedIndices[1] as number;
        if (activeVertex === firstVertex) {
          this.connectVertices(secondVertex, firstVertex);
        } else {
          this.connectVertices(firstVertex, secondVertex);
        }
        this.selectionService.restoreSelection(
          selectedIndices,
          activeVertex ?? secondVertex
        );
      }
    }
    return success;
  }

  public finishMode(): void {
    this.editorModeService.finishMode();
  }

  public isAutoConnectEnabled(): boolean {
    return this.editorModeService.isAutoConnectEnabled();
  }

  public toggleAutoConnect(): void {
    this.editorModeService.toggleAutoConnect();
  }

  public isGridSnapEnabled(): boolean {
    return this.editorModeService.isGridSnapEnabled();
  }

  public toggleGridSnap(): void {
    this.editorModeService.toggleGridSnap();
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
    this.translationInitialModel = this.modelService.getCurrentModel();
  }

  public endTranslation(): void {
    this.translationInitialModel = null;
  }

  public applyDragTranslation(totalDragOffset: Vector3D): void {
    const isOrthographic = this.cameraStateService.isOrthographic();
    if (!isOrthographic) {
      this.stateNotifier.notify(
        "ERROR_OCCURRED",
        "Switch to an Orthographic view"
      );
      return;
    }

    if (!this.translationInitialModel) {
      this.translationInitialModel = this.modelService.getCurrentModel();
    }

    const activeGridPlane = this.cameraStateService
      .getActiveStrategy()
      .getGridPlane();
    const isSnapEnabled = this.editorModeService.isGridSnapEnabled();

    this.geometryEditorService.applyTranslationFromInitial(
      this.translationInitialModel,
      totalDragOffset,
      activeGridPlane,
      isSnapEnabled
    );
  }

  public getPlacementPlaneAnchor(): Vector3D {
    const activeVertexIndex = this.selectionService.getActiveVertex();
    if (activeVertexIndex !== null) {
      const currentModel = this.modelService.getCurrentModel();
      if (
        activeVertexIndex >= 0 &&
        activeVertexIndex < currentModel.vertices.length
      ) {
        return currentModel.vertices[activeVertexIndex] as Vector3D;
      }
    }
    return this.cameraStateService.getTargetPoint();
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
    let targetPosition = worldPosition;
    if (this.editorModeService.isGridSnapEnabled()) {
      const activeGridPlane = this.cameraStateService
        .getActiveStrategy()
        .getGridPlane();
      targetPosition = this.geometryEditorService.snapToGridOnPlane(
        worldPosition,
        activeGridPlane
      );
    }
    this.geometryEditorService.addVertex(
      targetPosition,
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

    let effectiveOffset = offsetVector;
    if (this.editorModeService.isGridSnapEnabled()) {
      const activeGridPlane = this.cameraStateService
        .getActiveStrategy()
        .getGridPlane();
      effectiveOffset = this.geometryEditorService.snapToGridOnPlane(
        offsetVector,
        activeGridPlane
      );
    }

    this.geometryEditorService.translateSelected(effectiveOffset);
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

  public createFaceFromSelectedVertices(): boolean {
    const selectedIndices = this.selectionService.getSelectedIndices();
    if (selectedIndices.length < 3) {
      return false;
    }

    this.recordSnapshot();
    const createdFace =
      this.geometryEditorService.createFaceFromSelection(selectedIndices);
    return createdFace !== null;
  }
}
