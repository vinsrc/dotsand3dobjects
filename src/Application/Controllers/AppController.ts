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
import { DecalService } from "../Services/DecalService/DecalService";
import { DecalPlane } from "../Services/DecalService/DecalPlane";
import { ExportedImageFile } from "../Services/ModelService/ObjExporter";
import { ZipExportService } from "../Services/ZipExportService/ZipExportService";
import { ZipImportService } from "../Services/ZipExportService/ZipImportService";
import { ZipFileEntry } from "../Services/ZipExportService/ZipFileEntry";
import { DataUrlConverter } from "../Common/DataUrlConverter";
import { GeometryTransformService } from "../Services/GeometryTransformService/GeometryTransformService";

export class AppController {
  private readonly modelService: ModelService;
  private readonly cameraStateService: CameraStateService;
  private readonly renderModeService: RenderModeService;
  private readonly editorModeService: EditorModeService;
  private readonly selectionService: SelectionService;
  private readonly geometryEditorService: GeometryEditorService;
  private readonly geometryTransformService: GeometryTransformService;
  private readonly undoRedoService: UndoRedoService;
  private readonly stateNotifier: ApplicationStateNotifier;
  private readonly materialService: MaterialService;
  private readonly uiCustomizationService: UiCustomizationService;
  private readonly decalService: DecalService;
  private readonly zipExportService: ZipExportService;
  private readonly zipImportService: ZipImportService;
  private readonly dataUrlConverter: DataUrlConverter;
  private translationInitialModel: MeshGeometry | null = null;
  private rotationInitialModel: MeshGeometry | null = null;
  private scalingInitialModel: MeshGeometry | null = null;
  private rotationInitialDecal: DecalPlane | null = null;
  private scalingInitialDecal: DecalPlane | null = null;
  private scalingInitialDecals: readonly DecalPlane[] | null = null;
  private transformInitialModel: MeshGeometry | null = null;
  private transformInitialDecal: DecalPlane | null = null;
  private transformInitialDecals: readonly DecalPlane[] | null = null;

  public constructor(
    modelService: ModelService,
    cameraStateService: CameraStateService,
    renderModeService: RenderModeService,
    editorModeService: EditorModeService,
    selectionService: SelectionService,
    geometryEditorService: GeometryEditorService,
    geometryTransformService: GeometryTransformService,
    undoRedoService: UndoRedoService,
    stateNotifier: ApplicationStateNotifier,
    materialService: MaterialService,
    uiCustomizationService: UiCustomizationService,
    decalService: DecalService,
    zipExportService: ZipExportService,
    dataUrlConverter: DataUrlConverter,
    zipImportService: ZipImportService
  ) {
    this.modelService = modelService;
    this.cameraStateService = cameraStateService;
    this.renderModeService = renderModeService;
    this.editorModeService = editorModeService;
    this.selectionService = selectionService;
    this.geometryEditorService = geometryEditorService;
    this.geometryTransformService = geometryTransformService;
    this.undoRedoService = undoRedoService;
    this.stateNotifier = stateNotifier;
    this.materialService = materialService;
    this.uiCustomizationService = uiCustomizationService;
    this.decalService = decalService;
    this.zipExportService = zipExportService;
    this.dataUrlConverter = dataUrlConverter;
    this.zipImportService = zipImportService;
  }

  public getModelService(): ModelService {
    return this.modelService;
  }

  public getGeometryTransformService(): GeometryTransformService {
    return this.geometryTransformService;
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

      const parsedResult = this.modelService.loadFromObj(
        fileContent,
        fileName,
        this.materialService.getMaterials()
      );

      if (parsedResult.decals && parsedResult.decals.length > 0) {
        this.decalService.restoreState(parsedResult.decals, null);
      } else {
        this.decalService.restoreState([], null);
      }

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

  public exportModelToFile(baseModelName: string = "model"): string {
    return this.modelService.exportToObj(
      this.materialService.getMaterials(),
      this.decalService.getDecals(),
      baseModelName
    );
  }

  public exportMtlFile(baseModelName: string = "model"): string {
    return this.modelService.exportMtl(
      this.materialService.getMaterials(),
      baseModelName
    );
  }

  public exportImages(
    baseModelName: string = "model"
  ): readonly ExportedImageFile[] {
    return this.modelService.exportImages(
      this.materialService.getMaterials(),
      baseModelName
    );
  }

  public exportModelAsZip(baseModelName: string = "model"): Uint8Array {
    const materials = this.materialService.getMaterials();
    const objEntry = this.createTextZipEntry(
      `${baseModelName}.obj`,
      this.modelService.exportToObj(
        materials,
        this.decalService.getDecals(),
        baseModelName
      )
    );
    const usedEntryNames = new Set<string>([objEntry.fileName]);
    const zipEntries: ZipFileEntry[] = [objEntry];

    if (materials.length > 0) {
      const mtlFileName = `${baseModelName}.mtl`;
      usedEntryNames.add(mtlFileName);
      zipEntries.push(
        this.createTextZipEntry(
          mtlFileName,
          this.modelService.exportMtl(materials, baseModelName)
        )
      );
    }

    const exportedImages = this.modelService.exportImages(
      materials,
      baseModelName
    );
    for (const imageFile of exportedImages) {
      if (!this.shouldBundleImage(imageFile, usedEntryNames)) {
        continue;
      }
      const imageContent = this.dataUrlConverter.toUint8Array(
        imageFile.dataUrl
      );
      if (imageContent.length === 0) {
        continue;
      }
      usedEntryNames.add(imageFile.fileName);
      zipEntries.push({
        fileName: imageFile.fileName,
        content: imageContent,
      });
    }

    return this.zipExportService.buildZip(zipEntries);
  }

  public importZip(
    zipData: Uint8Array | ArrayBuffer,
    _fileName?: string
  ): void {
    try {
      const buffer =
        zipData instanceof Uint8Array ? zipData : new Uint8Array(zipData);
      const extractedPackage = this.zipImportService.extract(buffer);

      let loadedMaterials: Material3D[] = [];
      if (extractedPackage.mtlContent) {
        const parsed = this.modelService.parseMtl(extractedPackage.mtlContent);
        loadedMaterials = parsed.map((mat) => {
          const imageKey = mat.imageFileName ?? mat.imageUrl;
          if (imageKey) {
            const normalizedKey = imageKey.replace(/\\/g, "/");
            const lastSlash = Math.max(normalizedKey.lastIndexOf("/"), -1);
            const baseName = normalizedKey.substring(lastSlash + 1);
            const foundImage =
              extractedPackage.images.get(imageKey) ??
              extractedPackage.images.get(normalizedKey) ??
              extractedPackage.images.get(baseName) ??
              extractedPackage.images.get(baseName.toLowerCase());
            if (foundImage) {
              return mat.withImage(foundImage.dataUrl, foundImage.fileName);
            }
          }
          return mat;
        });

        if (loadedMaterials.length > 0) {
          const firstId = loadedMaterials[0].id;
          this.materialService.restoreMaterials(loadedMaterials, firstId);
        }
      }

      const parsedResult = this.modelService.loadFromObj(
        extractedPackage.objContent,
        extractedPackage.objFileName,
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

      if (parsedResult.decals && parsedResult.decals.length > 0) {
        this.decalService.restoreState(parsedResult.decals, null);
      } else {
        this.decalService.restoreState([], null);
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
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to import ZIP archive";
      this.stateNotifier.notify("ERROR_OCCURRED", errorMessage);
    }
  }

  public getZipImportService(): ZipImportService {
    return this.zipImportService;
  }

  private shouldBundleImage(
    imageFile: ExportedImageFile,
    usedEntryNames: ReadonlySet<string>
  ): boolean {
    if (!imageFile.dataUrl.startsWith("data:")) {
      return false;
    }
    if (this.containsUnsafePathSegments(imageFile.fileName)) {
      return false;
    }
    return !usedEntryNames.has(imageFile.fileName);
  }

  private containsUnsafePathSegments(fileName: string): boolean {
    return (
      fileName.includes("/") ||
      fileName.includes("\\") ||
      fileName.includes("..")
    );
  }

  private createTextZipEntry(fileName: string, textContent: string): ZipFileEntry {
    return {
      fileName,
      content: new TextEncoder().encode(textContent),
    };
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

  public getEdgeLineWidth(): number {
    return this.uiCustomizationService.getEdgeLineWidth();
  }

  public setEdgeLineWidth(lineWidth: number): void {
    this.uiCustomizationService.setEdgeLineWidth(lineWidth);
  }

  public saveUiCustomization(
    sideToolBarDock: DockSide,
    materialLibraryDock: DockSide,
    edgeLineWidth?: number
  ): void {
    this.uiCustomizationService.setCustomization(
      sideToolBarDock,
      materialLibraryDock,
      edgeLineWidth
    );
    this.materialService.setDockSide(materialLibraryDock);
  }

  public setMaterialLibraryDockSide(dockSide: DockSide): void {
    this.materialService.setDockSide(dockSide);
    this.uiCustomizationService.setMaterialLibraryDock(dockSide);
  }

  public assignMaterialToSelectedFaces(materialId: string | null): void {
    if (this.decalService.isDecalSelected()) {
      this.recordSnapshot();
      this.decalService.assignMaterialToSelectedDecal(materialId);
      return;
    }

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

  public clearMaterialOnSelectedFaces(): void {
    this.assignMaterialToSelectedFaces(null);
  }

  public getDecalService(): DecalService {
    return this.decalService;
  }

  public getDecals(): readonly DecalPlane[] {
    return this.decalService.getDecals();
  }

  public getSelectedDecalId(): string | null {
    return this.decalService.getSelectedDecalId();
  }

  public getSelectedDecal(): DecalPlane | null {
    return this.decalService.getSelectedDecal();
  }

  public isDecalSelected(): boolean {
    return this.decalService.isDecalSelected();
  }

  public isFaceOrthographicViewOf(faceIndex: number): boolean {
    return (
      this.cameraStateService.isFaceOrthographicView() &&
      this.cameraStateService.getActiveFaceIndex() === faceIndex
    );
  }

  public canSelectDecal(decalId: string): boolean {
    const decal = this.decalService.getDecal(decalId);
    if (!decal) {
      return false;
    }
    return this.isFaceOrthographicViewOf(decal.parentFaceIndex);
  }

  public selectDecal(id: string | null): boolean {
    if (id === null) {
      this.decalService.selectDecal(null);
      return true;
    }
    if (!this.canSelectDecal(id)) {
      return false;
    }
    this.selectionService.clearSelection();
    this.decalService.selectDecal(id);
    return true;
  }

  public deleteSelectedDecal(): boolean {
    if (!this.decalService.isDecalSelected()) {
      return false;
    }
    this.recordSnapshot();
    return this.decalService.deleteDecal();
  }

  public addDecalPlaneToSelectedFace(): boolean {
    const selectedFaces = this.selectionService.getSelectedFaceIndices();
    const targetFaceIndex =
      selectedFaces.length > 0
        ? selectedFaces[0]
        : this.selectionService.getSelectedFaceIndex();

    if (targetFaceIndex === null || targetFaceIndex === undefined) {
      return false;
    }

    const currentModel = this.modelService.getCurrentModel();
    const face = currentModel.faces[targetFaceIndex];
    if (!face) {
      return false;
    }

    const faceVertices = face.vertexIndices
      .map((idx) => currentModel.vertices[idx])
      .filter((v): v is Vector3D => v !== undefined);
    if (faceVertices.length < 3) {
      return false;
    }

    this.recordSnapshot();
    const newDecal = this.decalService.createDecalOnFace(
      targetFaceIndex,
      faceVertices
    );
    this.selectionService.clearSelection();

    // Switch to face orthographic view so decal can be selected and manipulated
    const faceNormal = face.calculateNormal(currentModel.vertices);
    const faceCenter = currentModel.calculateFaceCenter(targetFaceIndex);
    this.cameraStateService.setFaceOrthographicView(
      targetFaceIndex,
      faceNormal,
      faceCenter
    );
    this.decalService.selectDecal(newDecal.id);
    this.stateNotifier.notify("VIEW_CHANGED");
    return true;
  }

  public setDecalOrthographicView(decalId: string): boolean {
    const decal = this.decalService.getDecal(decalId);
    if (!decal) {
      return false;
    }
    this.cameraStateService.setFaceOrthographicView(
      decal.parentFaceIndex,
      decal.normal,
      decal.center
    );
    this.selectionService.clearSelection();
    this.decalService.selectDecal(decalId);
    this.stateNotifier.notify("VIEW_CHANGED");
    return true;
  }

  public getSelectedFaceIndices(): readonly number[] {
    return this.selectionService.getSelectedFaceIndices();
  }

  public toggleRenderMode(): void {
    this.renderModeService.toggleRenderMode();
    this.stateNotifier.notify("RENDER_MODE_CHANGED");
  }

  public selectOrthographicView(axisIdentifier: OrthographicAxis): void {
    if (this.decalService.isDecalSelected()) {
      this.decalService.selectDecal(null);
    }
    this.cameraStateService.setOrthographicAxis(axisIdentifier);
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public switchToClosestOrthographicView(): OrthographicAxis {
    if (this.decalService.isDecalSelected()) {
      this.decalService.selectDecal(null);
    }
    const closestAxis =
      this.cameraStateService.switchToClosestOrthographicView();
    this.stateNotifier.notify("VIEW_CHANGED");
    return closestAxis;
  }

  public selectFace(faceIndex: number): void {
    if (this.decalService.isDecalSelected()) {
      this.decalService.selectDecal(null);
    }
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
    const selectedDecal = this.decalService.getSelectedDecal();
    if (selectedDecal && selectedDecal.parentFaceIndex !== faceIndex) {
      this.decalService.selectDecal(null);
    }
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
    if (this.decalService.isDecalSelected()) {
      this.decalService.selectDecal(null);
    }
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
    if (this.decalService.isDecalSelected()) {
      return;
    }
    const objectCenter = this.modelService.getCurrentModel().calculateCenter();
    this.cameraStateService.centerOn(objectCenter);
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public enterMode(targetMode: UiMode): boolean {
    if (this.decalService.isDecalSelected()) {
      if (
        targetMode === "INSERT" ||
        targetMode === "FILL" ||
        targetMode === "TRANSLATE"
      ) {
        return false;
      }
    }
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
      decals: this.decalService.getDecals(),
      selectedDecalId: this.decalService.getSelectedDecalId(),
      selectedEdges: this.selectionService.getSelectedEdges(),
    });
  }

  public undo(): void {
    const currentSnapshot: EditorStateSnapshot = {
      model: this.modelService.getCurrentModel(),
      selectedIndices: this.selectionService.getSelectedIndices(),
      activeVertexIndex: this.selectionService.getActiveVertex(),
      decals: this.decalService.getDecals(),
      selectedDecalId: this.decalService.getSelectedDecalId(),
      selectedEdges: this.selectionService.getSelectedEdges(),
    };
    const previousSnapshot = this.undoRedoService.undo(currentSnapshot);
    if (previousSnapshot) {
      this.modelService.setCurrentModel(previousSnapshot.model);
      this.selectionService.restoreSelection(
        previousSnapshot.selectedIndices,
        previousSnapshot.activeVertexIndex,
        previousSnapshot.selectedEdges
      );
      if (previousSnapshot.decals) {
        this.decalService.restoreState(
          previousSnapshot.decals,
          previousSnapshot.selectedDecalId ?? null
        );
      }
    }
  }

  public redo(): void {
    const currentSnapshot: EditorStateSnapshot = {
      model: this.modelService.getCurrentModel(),
      selectedIndices: this.selectionService.getSelectedIndices(),
      activeVertexIndex: this.selectionService.getActiveVertex(),
      decals: this.decalService.getDecals(),
      selectedDecalId: this.decalService.getSelectedDecalId(),
      selectedEdges: this.selectionService.getSelectedEdges(),
    };
    const nextSnapshot = this.undoRedoService.redo(currentSnapshot);
    if (nextSnapshot) {
      this.modelService.setCurrentModel(nextSnapshot.model);
      this.selectionService.restoreSelection(
        nextSnapshot.selectedIndices,
        nextSnapshot.activeVertexIndex,
        nextSnapshot.selectedEdges
      );
      if (nextSnapshot.decals) {
        this.decalService.restoreState(
          nextSnapshot.decals,
          nextSnapshot.selectedDecalId ?? null
        );
      }
    }
  }

  public canUndo(): boolean {
    return this.undoRedoService.canUndo();
  }

  public canRedo(): boolean {
    return this.undoRedoService.canRedo();
  }

  public selectSingleVertex(vertexIndex: number): void {
    if (this.decalService.isDecalSelected()) {
      this.decalService.selectDecal(null);
    }
    this.recordSnapshot();
    this.selectionService.selectSingle(vertexIndex);
  }

  public toggleVertexSelection(vertexIndex: number): void {
    if (this.decalService.isDecalSelected()) {
      this.decalService.selectDecal(null);
    }
    this.recordSnapshot();
    this.selectionService.toggleSelect(vertexIndex);
  }

  public clearSelection(): void {
    if (this.decalService.isDecalSelected()) {
      this.recordSnapshot();
      this.decalService.selectDecal(null);
    }
    if (
      this.selectionService.getSelectedIndices().length > 0 ||
      this.selectionService.getSelectedFaceIndex() !== null ||
      this.selectionService.getSelectedEdges().length > 0
    ) {
      this.recordSnapshot();
      this.selectionService.clearSelection();
    }
  }

  public deleteSelectedVertices(): void {
    if (this.decalService.isDecalSelected()) {
      return;
    }
    if (this.selectionService.getSelectedIndices().length === 0) {
      return;
    }
    this.recordSnapshot();
    this.geometryEditorService.deleteSelectedVertices();
  }

  public deleteSelectedFace(): boolean {
    if (this.decalService.isDecalSelected()) {
      return false;
    }
    const targetFaceIndex = this.selectionService.getSelectedFaceIndex();
    if (targetFaceIndex === null || targetFaceIndex < 0) {
      return false;
    }

    const currentModel = this.modelService.getCurrentModel();
    if (targetFaceIndex >= currentModel.faces.length) {
      return false;
    }

    const childDecals = this.decalService.getDecalsForFace(targetFaceIndex);
    if (childDecals.length > 0) {
      this.stateNotifier.notify(
        "ERROR_OCCURRED",
        "Decal plane should be deleted before deleting Face"
      );
      return false;
    }

    this.recordSnapshot();
    const success = this.geometryEditorService.deleteFace(targetFaceIndex);
    if (success) {
      this.decalService.remapFaceIndicesAfterFaceDeletion(targetFaceIndex);
      if (
        this.cameraStateService.isFaceOrthographicView() &&
        this.cameraStateService.getActiveFaceIndex() === targetFaceIndex
      ) {
        this.switchToClosestOrthographicView();
      }
      this.selectionService.clearSelection();
    }
    return success;
  }

  public selectEdge(edge: [number, number]): void {
    if (this.decalService.isDecalSelected()) {
      this.decalService.selectDecal(null);
    }
    this.recordSnapshot();
    this.selectionService.selectEdge(edge);
  }

  public toggleEdgeSelection(edge: [number, number]): void {
    if (this.decalService.isDecalSelected()) {
      this.decalService.selectDecal(null);
    }
    this.recordSnapshot();
    this.selectionService.toggleEdgeSelection(edge);
  }

  public getSelectedEdges(): readonly [number, number][] {
    return this.selectionService.getSelectedEdges();
  }

  public deleteSelectedEdges(): boolean {
    if (this.decalService.isDecalSelected()) {
      return false;
    }
    const selectedEdges = this.selectionService.getSelectedEdges();
    if (selectedEdges.length === 0) {
      return false;
    }

    const currentModel = this.modelService.getCurrentModel();
    const isPartOfFace = selectedEdges.some((edge) => {
      const [v1, v2] = edge;
      return currentModel.faces.some((face) => {
        const count = face.vertexIndices.length;
        for (let i = 0; i < count; i += 1) {
          const a = face.vertexIndices[i];
          const b = face.vertexIndices[(i + 1) % count];
          if ((a === v1 && b === v2) || (a === v2 && b === v1)) {
            return true;
          }
        }
        return false;
      });
    });

    if (isPartOfFace) {
      this.stateNotifier.notify(
        "ERROR_OCCURRED",
        "Face should be deleted before deleting Edge"
      );
      return false;
    }

    this.recordSnapshot();
    const success = this.geometryEditorService.deleteEdges(selectedEdges);
    if (success) {
      this.selectionService.clearSelection();
    }
    return success;
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

    this.geometryTransformService.applyTranslationFromInitial(
      this.translationInitialModel,
      totalDragOffset,
      activeGridPlane,
      isSnapEnabled
    );
  }

  public beginTransformTranslation(): void {
    this.recordSnapshot();
    if (this.decalService.isDecalSelected()) {
      this.transformInitialDecal = this.decalService.getSelectedDecal();
      this.transformInitialModel = null;
      this.transformInitialDecals = null;
    } else {
      this.transformInitialModel = this.modelService.getCurrentModel();
      this.transformInitialDecal = null;
      this.transformInitialDecals = [...this.decalService.getDecals()];
    }
  }

  public endTransformTranslation(): void {
    this.transformInitialModel = null;
    this.transformInitialDecal = null;
    this.transformInitialDecals = null;
  }

  public applyTransformTranslation(totalDragOffset: Vector3D): void {
    const isOrthographic = this.cameraStateService.isOrthographic();
    if (!isOrthographic) {
      this.stateNotifier.notify(
        "ERROR_OCCURRED",
        "Switch to an Orthographic view"
      );
      return;
    }

    if (this.decalService.isDecalSelected()) {
      if (!this.transformInitialDecal) {
        this.transformInitialDecal = this.decalService.getSelectedDecal();
      }
      if (this.transformInitialDecal) {
        const translatedDecal = this.transformInitialDecal.translate(totalDragOffset);
        this.decalService.restoreState(
          this.decalService
            .getDecals()
            .map((d) => (d.id === translatedDecal.id ? translatedDecal : d)),
          translatedDecal.id
        );
      }
      return;
    }

    if (!this.transformInitialModel) {
      this.transformInitialModel = this.modelService.getCurrentModel();
    }

    const activeGridPlane = this.cameraStateService
      .getActiveStrategy()
      .getGridPlane();
    const isSnapEnabled = this.editorModeService.isGridSnapEnabled();

    const effectiveOffset =
      this.geometryTransformService.applyModelTranslationFromInitial(
        this.transformInitialModel,
        totalDragOffset,
        activeGridPlane,
        isSnapEnabled
      );

    if (this.transformInitialDecals && this.transformInitialDecals.length > 0) {
      const updatedDecals = this.transformInitialDecals.map((d) =>
        d.translate(effectiveOffset)
      );
      this.decalService.restoreState(updatedDecals, null);
    }
  }

  public beginRotation(): void {
    this.recordSnapshot();
    if (this.decalService.isDecalSelected()) {
      this.rotationInitialDecal = this.decalService.getSelectedDecal();
    } else {
      this.rotationInitialModel = this.modelService.getCurrentModel();
    }
  }

  public endRotation(): void {
    this.rotationInitialModel = null;
    this.rotationInitialDecal = null;
  }

  public applyDragRotation(angleRadians: number): void {
    const isOrthographic = this.cameraStateService.isOrthographic();
    if (!isOrthographic) {
      this.stateNotifier.notify(
        "ERROR_OCCURRED",
        "Switch to an Orthographic view"
      );
      return;
    }

    if (this.decalService.isDecalSelected()) {
      if (!this.rotationInitialDecal) {
        this.rotationInitialDecal = this.decalService.getSelectedDecal();
      }
      if (this.rotationInitialDecal) {
        const viewDirection = this.cameraStateService.getActiveStrategy().getViewDirection();
        const isSnapEnabled = this.editorModeService.isGridSnapEnabled();
        let effectiveAngle = angleRadians;
        if (isSnapEnabled) {
          const step = Math.PI / 12;
          effectiveAngle = Math.round(angleRadians / step) * step;
        }
        const rotatedDecal = this.rotationInitialDecal.rotate(effectiveAngle, viewDirection);
        this.decalService.restoreState(
          this.decalService.getDecals().map((d) => (d.id === rotatedDecal.id ? rotatedDecal : d)),
          rotatedDecal.id
        );
      }
      return;
    }

    if (!this.rotationInitialModel) {
      this.rotationInitialModel = this.modelService.getCurrentModel();
    }

    const activeStrategy = this.cameraStateService.getActiveStrategy();
    const activeGridPlane = activeStrategy.getGridPlane();
    const viewDirection = activeStrategy.getViewDirection();
    const isSnapEnabled = this.editorModeService.isGridSnapEnabled();

    this.geometryTransformService.applyRotationFromInitial(
      this.rotationInitialModel,
      angleRadians,
      activeGridPlane,
      isSnapEnabled,
      viewDirection
    );
  }

  public beginScaling(): void {
    this.recordSnapshot();
    if (this.decalService.isDecalSelected()) {
      this.scalingInitialDecal = this.decalService.getSelectedDecal();
    } else {
      this.scalingInitialModel = this.modelService.getCurrentModel();
      this.scalingInitialDecals = this.decalService.getDecals();
    }
  }

  public endScaling(): void {
    this.scalingInitialModel = null;
    this.scalingInitialDecal = null;
    this.scalingInitialDecals = null;
  }

  public applyDragScaling(scaleFactor: number): void {
    const isOrthographic = this.cameraStateService.isOrthographic();
    if (!isOrthographic) {
      this.stateNotifier.notify(
        "ERROR_OCCURRED",
        "Switch to an Orthographic view"
      );
      return;
    }

    const isSnapEnabled = this.editorModeService.isGridSnapEnabled();
    let effectiveScale = scaleFactor;
    if (isSnapEnabled) {
      const step = 0.1;
      effectiveScale = Math.max(0.1, Math.round(scaleFactor / step) * step);
    } else {
      effectiveScale = Math.max(0.05, scaleFactor);
    }

    if (this.decalService.isDecalSelected()) {
      if (!this.scalingInitialDecal) {
        this.scalingInitialDecal = this.decalService.getSelectedDecal();
      }
      if (this.scalingInitialDecal) {
        const scaledDecal = this.scalingInitialDecal.scale(effectiveScale);
        this.decalService.restoreState(
          this.decalService
            .getDecals()
            .map((d) => (d.id === scaledDecal.id ? scaledDecal : d)),
          scaledDecal.id
        );
      }
      return;
    }

    if (!this.scalingInitialModel) {
      this.scalingInitialModel = this.modelService.getCurrentModel();
      this.scalingInitialDecals = this.decalService.getDecals();
    }

    this.geometryTransformService.applyScaleFromInitial(
      this.scalingInitialModel,
      effectiveScale
    );

    if (this.scalingInitialDecals && this.scalingInitialDecals.length > 0) {
      const meshCenter = this.scalingInitialModel.calculateCenter();
      const updatedDecals = this.scalingInitialDecals.map((d) =>
        d.scale(effectiveScale, meshCenter)
      );
      this.decalService.restoreState(updatedDecals, null);
    }
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

  public getActivePlaneVertexIndices(): readonly number[] | null {
    if (!this.cameraStateService.isOrthographic()) {
      return null;
    }

    let activeVertexIndex = this.selectionService.getActiveVertex();
    if (activeVertexIndex === null) {
      const selectedIndices = this.selectionService.getSelectedIndices();
      if (selectedIndices.length > 0) {
        activeVertexIndex = selectedIndices[0] as number;
      }
    }

    if (activeVertexIndex === null) {
      return null;
    }

    const gridPlane = this.cameraStateService
      .getActiveStrategy()
      .getGridPlane();

    if (gridPlane === "NONE") {
      return null;
    }

    return this.geometryEditorService.getCoplanarVertexIndices(
      activeVertexIndex,
      gridPlane
    );
  }

  public getVisibleVertexIndices(): readonly number[] | null {
    return this.getActivePlaneVertexIndices();
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

    this.geometryTransformService.translateSelected(effectiveOffset);
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
