import { describe, it, expect, vi } from "vitest";
import { unzipSync, zipSync } from "fflate";
import { AppController } from "../../../src/Application/Controllers/AppController";
import { ModelService } from "../../../src/Application/Services/ModelService/ModelService";
import { CameraStateService } from "../../../src/Application/Services/CameraService/CameraStateService";
import { RenderModeService } from "../../../src/Application/Services/RenderModeService/RenderModeService";
import { EditorModeService } from "../../../src/Application/Services/EditorModeService/EditorModeService";
import { SelectionService } from "../../../src/Application/Services/SelectionService/SelectionService";
import { GeometryEditorService } from "../../../src/Application/Services/GeometryEditorService/GeometryEditorService";
import { UndoRedoService } from "../../../src/Application/Services/UndoRedoService/UndoRedoService";
import { ApplicationStateNotifier } from "../../../src/Application/Common/ApplicationStateNotifier";
import { ModelFactory } from "../../../src/Application/Services/ModelService/ModelFactory";
import { ObjParser } from "../../../src/Application/Services/ModelService/ObjParser";
import { ObjExporter } from "../../../src/Application/Services/ModelService/ObjExporter";
import { OrthographicViewStrategyFactory } from "../../../src/Application/Services/CameraService/OrthographicViewStrategy";
import { Vector3D } from "../../../src/Application/Common/Vector3D";
import { MeshGeometry } from "../../../src/Application/Services/ModelService/MeshGeometry";
import { MaterialService } from "../../../src/Application/Services/MaterialService/MaterialService";
import { GeometryTransformService } from "../../../src/Application/Services/GeometryTransformService/GeometryTransformService";
import { UiCustomizationService } from "../../../src/Application/Services/UiCustomizationService/UiCustomizationService";
import { DecalService } from "../../../src/Application/Services/DecalService/DecalService";
import { ZipExportService } from "../../../src/Application/Services/ZipExportService/ZipExportService";
import { ZipImportService } from "../../../src/Application/Services/ZipExportService/ZipImportService";
import { DataUrlConverter } from "../../../src/Application/Common/DataUrlConverter";

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
    const materialService = new MaterialService(stateNotifier);
    const uiCustomizationService = new UiCustomizationService(stateNotifier);
    const decalService = new DecalService(stateNotifier);
    const zipExportService = new ZipExportService();
    const dataUrlConverter = new DataUrlConverter();
    const zipImportService = new ZipImportService(dataUrlConverter);

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
      zipImportService
    );

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
      dataUrlConverter,
      zipImportService,
      stateNotifier,
    };
  };

  it("should provide access to underlying services", () => {
    const {
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
      stateNotifier,
    } = createController();

    expect(appController.getModelService()).toBe(modelService);
    expect(appController.getCameraStateService()).toBe(cameraStateService);
    expect(appController.getRenderModeService()).toBe(renderModeService);
    expect(appController.getEditorModeService()).toBe(editorModeService);
    expect(appController.getSelectionService()).toBe(selectionService);
    expect(appController.getGeometryEditorService()).toBe(geometryEditorService);
    expect(appController.getGeometryTransformService()).toBe(geometryTransformService);
    expect(appController.getUndoRedoService()).toBe(undoRedoService);
    expect(appController.getMaterialService()).toBe(materialService);
    expect(appController.getZipImportService()).toBeDefined();
    expect(appController.getStateNotifier()).toBe(stateNotifier);
  });

  it("should load valid model, adjust camera framing, and clear selection", () => {
    const { appController, cameraStateService, selectionService } =
      createController();
    selectionService.selectSingle(2);
    expect(selectionService.getSelectedIndices()).toEqual([2]);

    const objData = `
      v -10 -10 -10
      v 10 10 10
      v 0 10 0
      f 1 2 3
    `;

    appController.loadModelFromFile("large_model.obj", objData);
    expect(cameraStateService.getCameraDistance()).toBeCloseTo(4.33, 1);
    expect(cameraStateService.getTargetPoint().coordinateX).toBeCloseTo(0, 5);
    expect(selectionService.getSelectedIndices()).toEqual([]);
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

  it("should export the model as a zip archive containing the OBJ file", () => {
    const { appController } = createController();

    const archive = appController.exportModelAsZip("custom_model");
    expect(archive[0]).toBe(0x50);
    expect(archive[1]).toBe(0x4b);

    const unzipped = unzipSync(archive);
    expect(Object.keys(unzipped)).toEqual(["custom_model.obj"]);
    const objContent = new TextDecoder().decode(unzipped["custom_model.obj"]);
    expect(objContent).toContain("v ");
    expect(objContent).toContain("f ");
  });

  it("should export a zip archive containing OBJ, MTL, and texture image files", () => {
    const { appController } = createController();
    const material = appController.createMaterial();
    const matWithImage = material.withImage(
      "data:image/png;base64,iVBORw0KGgo=",
      "texture_decal.png"
    );
    appController.updateMaterial(matWithImage);
    appController.selectFace(0);
    appController.assignMaterialToSelectedFaces(material.id);

    const archive = appController.exportModelAsZip();
    const unzipped = unzipSync(archive);

    const fileNames = Object.keys(unzipped).sort();
    expect(fileNames).toEqual(["model.mtl", "model.obj", "texture_decal.png"]);

    const mtlContent = new TextDecoder().decode(unzipped["model.mtl"]);
    expect(mtlContent).toContain("newmtl Material_1");
    expect(mtlContent).toContain("map_Kd texture_decal.png");
    expect(mtlContent).not.toContain("base64");

    const objContent = new TextDecoder().decode(unzipped["model.obj"]);
    expect(objContent).toContain("mtllib model.mtl");

    const imageBytes = unzipped["texture_decal.png"];
    const expectedBytes = atob("iVBORw0KGgo=");
    expect(imageBytes.length).toBe(expectedBytes.length);
    for (let index = 0; index < expectedBytes.length; index += 1) {
      expect(imageBytes[index]).toBe(expectedBytes.charCodeAt(index));
    }
  });

  it("should exclude texture files whose data is not available as a data URL", () => {
    const { appController } = createController();
    const material = appController.createMaterial();
    const matWithRemoteImage = material.withImage(
      "textures/remote_texture.png",
      "remote_texture.png"
    );
    appController.updateMaterial(matWithRemoteImage);

    const archive = appController.exportModelAsZip();
    const unzipped = unzipSync(archive);

    expect(Object.keys(unzipped).sort()).toEqual(["model.mtl", "model.obj"]);
    const mtlContent = new TextDecoder().decode(unzipped["model.mtl"]);
    expect(mtlContent).toContain("map_Kd remote_texture.png");
  });

  it("should skip texture files whose name collides with the reserved OBJ or MTL entry names", () => {
    const { appController } = createController();
    const material = appController.createMaterial();
    const objCollision = material.withImage(
      "data:image/png;base64,iVBORw0KGgo=",
      "model.obj"
    );
    appController.updateMaterial(objCollision);

    const archive = appController.exportModelAsZip();
    const unzipped = unzipSync(archive);

    expect(Object.keys(unzipped).sort()).toEqual(["model.mtl", "model.obj"]);
    const objContent = new TextDecoder().decode(unzipped["model.obj"]);
    expect(objContent).toContain("v ");
    expect(objContent).toContain("f ");
  });

  it("should skip texture files whose name contains unsafe path segments", () => {
    const { appController } = createController();
    const material = appController.createMaterial();
    const unsafeImage = material.withImage(
      "data:image/png;base64,iVBORw0KGgo=",
      "../escape_texture.png"
    );
    appController.updateMaterial(unsafeImage);

    const archive = appController.exportModelAsZip();
    const unzipped = unzipSync(archive);

    expect(Object.keys(unzipped).sort()).toEqual(["model.mtl", "model.obj"]);
  });

  it("should skip texture files whose data URL cannot be decoded", () => {
    const { appController } = createController();
    const material = appController.createMaterial();
    const brokenImage = material.withImage(
      "data:image/png;base64,%%%INVALID%%%",
      "broken_texture.png"
    );
    appController.updateMaterial(brokenImage);

    const archive = appController.exportModelAsZip();
    const unzipped = unzipSync(archive);

    expect(Object.keys(unzipped).sort()).toEqual(["model.mtl", "model.obj"]);
    const mtlContent = new TextDecoder().decode(unzipped["model.mtl"]);
    expect(mtlContent).toContain("map_Kd broken_texture.png");
  });

  it("should export MTL and images associated with materials", () => {
    const { appController } = createController();
    const material = appController.createMaterial();
    const matWithImage = material.withImage(
      "data:image/png;base64,ABC123",
      "custom_badge.png"
    );
    appController.updateMaterial(matWithImage);

    const mtlContent = appController.exportMtlFile("custom_model");
    expect(mtlContent).toContain("newmtl");
    expect(mtlContent).toContain("map_Kd custom_badge.png");
    expect(mtlContent).not.toContain("base64");

    const images = appController.exportImages("custom_model");
    expect(images.length).toBe(1);
    expect(images[0]).toEqual({
      fileName: "custom_badge.png",
      dataUrl: "data:image/png;base64,ABC123",
    });
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

  it("should pan camera and notify VIEW_CHANGED", () => {
    const { appController, cameraStateService, stateNotifier } =
      createController();
    const viewListener = vi.fn();
    stateNotifier.subscribe("VIEW_CHANGED", viewListener);

    appController.panCamera(2, 4);
    expect(viewListener).toHaveBeenCalledTimes(1);
    expect(cameraStateService.getTargetPoint()).toBeDefined();
  });

  it("should center object and notify VIEW_CHANGED", () => {
    const { appController, cameraStateService, stateNotifier } =
      createController();
    cameraStateService.setTargetPoint(new Vector3D(100, 200, 300));

    const viewListener = vi.fn();
    stateNotifier.subscribe("VIEW_CHANGED", viewListener);

    appController.centerObject();
    expect(cameraStateService.getTargetPoint().coordinateX).toBeCloseTo(0, 5);
    expect(cameraStateService.getTargetPoint().coordinateY).toBeCloseTo(0, 5);
    expect(cameraStateService.getTargetPoint().coordinateZ).toBeCloseTo(0, 5);
    expect(viewListener).toHaveBeenCalledTimes(1);
  });

  it("should enter mode and finish mode", () => {
    const { appController, editorModeService } = createController();
    appController.selectOrthographicView("+X");

    const entered = appController.enterMode("INSERT");
    expect(entered).toBe(true);
    expect(editorModeService.getMode()).toBe("INSERT");

    appController.finishMode();
    expect(editorModeService.getMode()).toBe("DEFAULT");
  });

  it("should switch to default perspective view and finish mode", () => {
    const { appController, editorModeService, cameraStateService } = createController();
    appController.selectOrthographicView("+X");
    expect(cameraStateService.isOrthographic()).toBe(true);

    const entered = appController.enterMode("TRANSFORM");
    expect(entered).toBe(true);
    expect(editorModeService.getMode()).toBe("TRANSFORM");

    appController.switchToDefaultPerspectiveView();
    expect(editorModeService.getMode()).toBe("DEFAULT");
    expect(cameraStateService.isOrthographic()).toBe(false);
    expect(cameraStateService.getActiveStrategy().getAxisLabel()).toBe("Perspective");
    expect(cameraStateService.getAzimuth()).toBeCloseTo(Math.PI / 4);
    expect(cameraStateService.getElevation()).toBeCloseTo(Math.PI / 6);
  });

  it("should deselect decal when switching to default perspective view", () => {
    const { appController } = createController();
    appController.selectFace(0);
    appController.addDecalPlaneToSelectedFace();
    expect(appController.isDecalSelected()).toBe(true);

    appController.switchToDefaultPerspectiveView();
    expect(appController.isDecalSelected()).toBe(false);
    expect(appController.getCameraStateService().isOrthographic()).toBe(false);
  });

  it("should toggle auto connect", () => {
    const { appController, editorModeService } = createController();
    expect(editorModeService.isAutoConnectEnabled()).toBe(false);
    appController.toggleAutoConnect();
    expect(editorModeService.isAutoConnectEnabled()).toBe(true);
  });

  it("should toggle grid snap", () => {
    const { appController, editorModeService } = createController();
    expect(appController.isGridSnapEnabled()).toBe(true);
    expect(editorModeService.isGridSnapEnabled()).toBe(true);

    appController.toggleGridSnap();
    expect(appController.isGridSnapEnabled()).toBe(false);
    expect(editorModeService.isGridSnapEnabled()).toBe(false);

    appController.toggleGridSnap();
    expect(appController.isGridSnapEnabled()).toBe(true);
  });

  it("should manage vertex selection", () => {
    const { appController, selectionService } = createController();
    appController.selectSingleVertex(3);
    expect(selectionService.getSelectedIndices()).toEqual([3]);

    appController.toggleVertexSelection(4);
    expect(selectionService.getSelectedIndices()).toEqual([3, 4]);

    appController.clearSelection();
    expect(selectionService.getSelectedIndices()).toEqual([]);
  });

  it("should add vertex at position in orthographic view but reject in perspective", () => {
    const { appController, modelService, stateNotifier } = createController();
    const initialCount = modelService.getCurrentModel().getVertexCount();
    const errorListener = vi.fn();
    stateNotifier.subscribe("ERROR_OCCURRED", errorListener);

    // Currently perspective view:
    appController.addVertexAtPosition(new Vector3D(1.1, 2.2, 3.3));
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialCount);
    expect(errorListener).toHaveBeenCalledWith("Switch to an Orthographic view");

    // Switch to orthographic:
    appController.selectOrthographicView("+Z");
    appController.addVertexAtPosition(new Vector3D(1.1, 2.2, 3.3));
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialCount + 1);
  });

  it("should provide placement plane anchor based on selection or fallback to target point", () => {
    const { appController, modelService, selectionService } = createController();
    // Default model is a unit cube centered at origin
    const targetPoint = appController.getCameraStateService().getTargetPoint();

    // No selection: anchor should equal target point
    const defaultAnchor = appController.getPlacementPlaneAnchor();
    expect(defaultAnchor.coordinateX).toBe(targetPoint.coordinateX);
    expect(defaultAnchor.coordinateY).toBe(targetPoint.coordinateY);
    expect(defaultAnchor.coordinateZ).toBe(targetPoint.coordinateZ);

    // Select vertex index 0
    appController.selectSingleVertex(0);
    const selectedVertex = modelService.getCurrentModel().vertices[0] as Vector3D;
    const vertexAnchor = appController.getPlacementPlaneAnchor();
    expect(vertexAnchor.coordinateX).toBe(selectedVertex.coordinateX);
    expect(vertexAnchor.coordinateY).toBe(selectedVertex.coordinateY);
    expect(vertexAnchor.coordinateZ).toBe(selectedVertex.coordinateZ);

    // Out of bounds selection falls back to target point
    selectionService.restoreSelection([999], 999);
    const fallbackAnchor = appController.getPlacementPlaneAnchor();
    expect(fallbackAnchor.coordinateX).toBe(targetPoint.coordinateX);
  });

  it("should preserve view axis coordinate when adding vertex in orthographic view", () => {
    const { appController, modelService } = createController();

    // In +Z view (gridPlane = XY): view axis is Z, Z is preserved while X and Y snap to 0.25
    appController.selectOrthographicView("+Z");
    appController.addVertexAtPosition(new Vector3D(2.1, 3.8, 5.432));
    const addedZVertex = modelService.getCurrentModel().vertices.slice(-1)[0] as Vector3D;
    expect(addedZVertex.coordinateX).toBe(2);
    expect(addedZVertex.coordinateY).toBe(3.75);
    expect(addedZVertex.coordinateZ).toBe(5.432);

    // In +Y view (gridPlane = XZ): view axis is Y, Y is preserved while X and Z snap to 0.25
    appController.selectOrthographicView("+Y");
    appController.addVertexAtPosition(new Vector3D(4.2, 7.891, 1.9));
    const addedYVertex = modelService.getCurrentModel().vertices.slice(-1)[0] as Vector3D;
    expect(addedYVertex.coordinateX).toBe(4.25);
    expect(addedYVertex.coordinateY).toBe(7.891);
    expect(addedYVertex.coordinateZ).toBe(2);

    // In +X view (gridPlane = YZ): view axis is X, X is preserved while Y and Z snap to 0.25
    appController.selectOrthographicView("+X");
    appController.addVertexAtPosition(new Vector3D(9.123, 2.2, 8.7));
    const addedXVertex = modelService.getCurrentModel().vertices.slice(-1)[0] as Vector3D;
    expect(addedXVertex.coordinateX).toBe(9.123);
    expect(addedXVertex.coordinateY).toBe(2.25);
    expect(addedXVertex.coordinateZ).toBe(8.75);
  });

  it("should translate selected vertices in orthographic view but reject in perspective", () => {
    const { appController, modelService, selectionService, stateNotifier } =
      createController();
    selectionService.selectSingle(0);
    const errorListener = vi.fn();
    stateNotifier.subscribe("ERROR_OCCURRED", errorListener);

    // Perspective view:
    appController.translateSelectedVertices(new Vector3D(0, 5, 0));
    expect(errorListener).toHaveBeenCalledWith("Switch to an Orthographic view");

    // Switch to orthographic:
    appController.selectOrthographicView("+X");
    appController.beginTranslation();
    const beforeY = modelService.getCurrentModel().vertices[0].coordinateY;
    appController.translateSelectedVertices(new Vector3D(0, 5, 0));
    const afterY = modelService.getCurrentModel().vertices[0].coordinateY;
    expect(afterY).toBeCloseTo(beforeY + 5, 5);
  });

  it("should add vertex at exact position when grid snap is disabled", () => {
    const { appController, modelService } = createController();
    appController.selectOrthographicView("+Z");
    appController.toggleGridSnap();
    expect(appController.isGridSnapEnabled()).toBe(false);

    appController.addVertexAtPosition(new Vector3D(1.234, 5.678, 9.101));
    const latestVertex = modelService
      .getCurrentModel()
      .vertices.slice(-1)[0] as Vector3D;
    expect(latestVertex.coordinateX).toBe(1.234);
    expect(latestVertex.coordinateY).toBe(5.678);
    expect(latestVertex.coordinateZ).toBe(9.101);
  });

  it("should translate selected vertices continuously when grid snap is disabled", () => {
    const { appController, modelService, selectionService } = createController();
    selectionService.selectSingle(0);
    appController.selectOrthographicView("+X");
    appController.toggleGridSnap();
    expect(appController.isGridSnapEnabled()).toBe(false);

    const initialY = modelService.getCurrentModel().vertices[0].coordinateY;
    appController.translateSelectedVertices(new Vector3D(0, 0.456, 0));
    const updatedY = modelService.getCurrentModel().vertices[0].coordinateY;
    expect(updatedY).toBeCloseTo(initialY + 0.456, 5);
  });

  it("should handle applyDragTranslation in orthographic and reject in perspective", () => {
    const { appController, modelService, selectionService, stateNotifier } =
      createController();
    selectionService.selectSingle(0);
    const errorListener = vi.fn();
    stateNotifier.subscribe("ERROR_OCCURRED", errorListener);

    // Rejects in perspective view
    appController.applyDragTranslation(new Vector3D(1, 2, 0));
    expect(errorListener).toHaveBeenCalledWith("Switch to an Orthographic view");

    // Switch to orthographic with snap enabled
    appController.selectOrthographicView("+Z");
    appController.beginTranslation();
    const initialPos = modelService.getCurrentModel().vertices[0] as Vector3D;

    // Drag by small offset (0.05, 0.05, 0) -> candidate stays at position on 0.25 sub-grid
    appController.applyDragTranslation(new Vector3D(0.05, 0.05, 0));
    expect(modelService.getCurrentModel().vertices[0]?.coordinateX).toBe(
      initialPos.coordinateX
    );

    // Drag past 0.25 threshold (0.26, 0.51, 0) -> candidate snaps to +0.25 on X, +0.50 on Y
    appController.applyDragTranslation(new Vector3D(0.26, 0.51, 0));
    expect(modelService.getCurrentModel().vertices[0]?.coordinateX).toBe(
      initialPos.coordinateX + 0.25
    );
    expect(modelService.getCurrentModel().vertices[0]?.coordinateY).toBe(
      initialPos.coordinateY + 0.5
    );

    appController.endTranslation();

    // Now test applyDragTranslation with grid snap disabled
    appController.toggleGridSnap();
    appController.beginTranslation();
    appController.applyDragTranslation(new Vector3D(0.35, -0.45, 0));
    const continuousVertex = modelService.getCurrentModel().vertices[0] as Vector3D;
    expect(continuousVertex.coordinateX).toBeCloseTo(
      initialPos.coordinateX + 0.25 + 0.35,
      5
    );
    expect(continuousVertex.coordinateY).toBeCloseTo(
      initialPos.coordinateY + 0.5 - 0.45,
      5
    );
    appController.endTranslation();
  });

  it("should handle beginRotation, applyDragRotation, and endRotation in orthographic and reject in perspective", () => {
    const { appController, modelService, stateNotifier } = createController();
    const errorListener = vi.fn();
    stateNotifier.subscribe("ERROR_OCCURRED", errorListener);

    // Rejects in perspective view
    appController.applyDragRotation(Math.PI / 2);
    expect(errorListener).toHaveBeenCalledWith("Switch to an Orthographic view");

    // Switch to orthographic
    appController.selectOrthographicView("+Z");
    appController.beginRotation();

    const initialPos = modelService.getCurrentModel().vertices[0] as Vector3D;

    // Apply rotation of 90 degrees with snap enabled
    appController.applyDragRotation(Math.PI / 2);

    const rotatedVertex = modelService.getCurrentModel().vertices[0] as Vector3D;
    expect(rotatedVertex.coordinateX).not.toBe(initialPos.coordinateX);

    appController.endRotation();

    // Test undo
    expect(appController.canUndo()).toBe(true);
    appController.undo();
    const undoneVertex = modelService.getCurrentModel().vertices[0] as Vector3D;
    expect(undoneVertex.coordinateX).toBeCloseTo(initialPos.coordinateX, 5);
    expect(undoneVertex.coordinateY).toBeCloseTo(initialPos.coordinateY, 5);

    // Test redo
    expect(appController.canRedo()).toBe(true);
    appController.redo();
    const redoneVertex = modelService.getCurrentModel().vertices[0] as Vector3D;
    expect(redoneVertex.coordinateX).toBeCloseTo(rotatedVertex.coordinateX, 5);
    expect(redoneVertex.coordinateY).toBeCloseTo(rotatedVertex.coordinateY, 5);
  });

  it("should handle beginScaling, applyDragScaling, and endScaling in orthographic and reject in perspective", () => {
    const { appController, modelService, stateNotifier } = createController();
    const errorListener = vi.fn();
    stateNotifier.subscribe("ERROR_OCCURRED", errorListener);

    // Rejects in perspective view
    appController.applyDragScaling(1.5);
    expect(errorListener).toHaveBeenCalledWith("Switch to an Orthographic view");

    // Switch to orthographic
    appController.selectOrthographicView("+Z");
    appController.beginScaling();

    const initialPos = modelService.getCurrentModel().vertices[0] as Vector3D;

    // Apply scale of 2.0 with snap enabled
    appController.applyDragScaling(2.0);

    const scaledVertex = modelService.getCurrentModel().vertices[0] as Vector3D;
    expect(Math.abs(scaledVertex.coordinateX)).toBeGreaterThan(Math.abs(initialPos.coordinateX));

    appController.endScaling();

    // Test undo
    expect(appController.canUndo()).toBe(true);
    appController.undo();
    const undoneVertex = modelService.getCurrentModel().vertices[0] as Vector3D;
    expect(undoneVertex.coordinateX).toBeCloseTo(initialPos.coordinateX, 5);

    // Test redo
    expect(appController.canRedo()).toBe(true);
    appController.redo();
    const redoneVertex = modelService.getCurrentModel().vertices[0] as Vector3D;
    expect(redoneVertex.coordinateX).toBeCloseTo(scaledVertex.coordinateX, 5);
  });

  it("should insert vertex on edge and connect vertices", () => {
    const { appController, modelService } = createController();
    const initialCount = modelService.getCurrentModel().getVertexCount();

    appController.insertVertexOnEdge(0, 1);
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialCount + 1);

    const edgeCountBefore = modelService.getCurrentModel().getWireframeEdges().length;
    appController.connectVertices(0, 2);
    expect(modelService.getCurrentModel().getWireframeEdges().length).toBeGreaterThanOrEqual(edgeCountBefore);
  });

  it("should delete selected vertices and support undo/redo", () => {
    const { appController, modelService, selectionService } = createController();
    const initialCount = modelService.getCurrentModel().getVertexCount();

    // Select vertex 0 and delete
    appController.selectSingleVertex(0);
    expect(selectionService.getSelectedIndices()).toEqual([0]);

    appController.deleteSelectedVertices();
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialCount - 1);
    expect(selectionService.getSelectedIndices()).toEqual([]);
    expect(appController.canUndo()).toBe(true);
    expect(appController.canRedo()).toBe(false);

    // Undo deletion
    appController.undo();
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialCount);
    expect(selectionService.getSelectedIndices()).toEqual([0]);
    expect(appController.canRedo()).toBe(true);

    // Redo deletion
    appController.redo();
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialCount - 1);
    expect(selectionService.getSelectedIndices()).toEqual([]);
  });

  it("should undo and redo vertex addition and translation", () => {
    const { appController, modelService, selectionService } = createController();
    appController.selectOrthographicView("+Z");
    const initialCount = modelService.getCurrentModel().getVertexCount();

    appController.addVertexAtPosition(new Vector3D(5, 5, 5));
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialCount + 1);

    // Undo addition
    appController.undo();
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialCount);

    // Redo addition
    appController.redo();
    expect(modelService.getCurrentModel().getVertexCount()).toBe(initialCount + 1);

    // Translate added vertex
    appController.beginTranslation();
    const originalPos = modelService.getCurrentModel().vertices[initialCount];
    appController.translateSelectedVertices(new Vector3D(2, 0, 0));
    expect(modelService.getCurrentModel().vertices[initialCount].coordinateX).toBe(originalPos.coordinateX + 2);

    // Undo translation
    appController.undo();
    expect(modelService.getCurrentModel().vertices[initialCount].coordinateX).toBe(originalPos.coordinateX);

    // Redo translation
    appController.redo();
    expect(modelService.getCurrentModel().vertices[initialCount].coordinateX).toBe(originalPos.coordinateX + 2);
  });

  it("should do nothing when deleting vertices with no selection", () => {
    const { appController, modelService } = createController();
    const beforeCount = modelService.getCurrentModel().getVertexCount();
    appController.deleteSelectedVertices();
    expect(modelService.getCurrentModel().getVertexCount()).toBe(beforeCount);
  });

  it("should safely handle undo and redo when stacks are empty", () => {
    const { appController, modelService } = createController();
    const beforeModel = modelService.getCurrentModel();

    appController.undo();
    expect(modelService.getCurrentModel()).toBe(beforeModel);

    appController.redo();
    expect(modelService.getCurrentModel()).toBe(beforeModel);
  });

  it("should safely handle clearSelection when no vertices are selected", () => {
    const { appController, selectionService, undoRedoService } = createController();
    expect(selectionService.getSelectedIndices().length).toBe(0);

    appController.clearSelection();
    expect(undoRedoService.canUndo()).toBe(false);
  });

  it("should create face when 3 vertices are selected and support undo/redo", () => {
    const { appController, modelService, selectionService, undoRedoService } =
      createController();
    const initialFaceCount = modelService.getCurrentModel().getFaceCount();

    // Select 3 vertices (e.g. vertices 0, 1, 2 from cube)
    selectionService.restoreSelection([0, 1, 2], 2);
    expect(appController.createFaceFromSelectedVertices()).toBe(true);

    expect(modelService.getCurrentModel().getFaceCount()).toBe(
      initialFaceCount + 1
    );
    expect(selectionService.getSelectedIndices()).toEqual([]);
    expect(undoRedoService.canUndo()).toBe(true);

    // Undo face creation
    appController.undo();
    expect(modelService.getCurrentModel().getFaceCount()).toBe(initialFaceCount);
    expect(selectionService.getSelectedIndices()).toEqual([0, 1, 2]);

    // Redo face creation
    appController.redo();
    expect(modelService.getCurrentModel().getFaceCount()).toBe(
      initialFaceCount + 1
    );
    expect(selectionService.getSelectedIndices()).toEqual([]);
  });

  it("should return false when createFaceFromSelectedVertices called with less than 3 vertices", () => {
    const { appController, modelService, selectionService } =
      createController();
    const initialFaceCount = modelService.getCurrentModel().getFaceCount();

    selectionService.restoreSelection([0, 1], 1);
    expect(appController.createFaceFromSelectedVertices()).toBe(false);
    expect(modelService.getCurrentModel().getFaceCount()).toBe(initialFaceCount);

    selectionService.clearSelection();
    expect(appController.createFaceFromSelectedVertices()).toBe(false);
    expect(modelService.getCurrentModel().getFaceCount()).toBe(initialFaceCount);
  });

  it("should create face when 5 vertices are selected", () => {
    const { appController, modelService, selectionService } =
      createController();
    const initialFaceCount = modelService.getCurrentModel().getFaceCount();

    selectionService.restoreSelection([0, 1, 2, 3, 4], 4);
    expect(appController.createFaceFromSelectedVertices()).toBe(true);
    expect(modelService.getCurrentModel().getFaceCount()).toBe(
      initialFaceCount + 1
    );
  });

  it("should switch to closest orthographic view and notify VIEW_CHANGED", () => {
    const { appController, stateNotifier } = createController();
    const viewListener = vi.fn();
    stateNotifier.subscribe("VIEW_CHANGED", viewListener);

    appController.rotateCamera(0.5, 0.2);
    expect(viewListener).toHaveBeenCalledTimes(1);

    const closestAxis = appController.switchToClosestOrthographicView();
    expect(viewListener).toHaveBeenCalledTimes(2);
    expect(appController.getCameraStateService().isOrthographic()).toBe(true);
    expect(
      appController.getCameraStateService().getActiveStrategy().getAxisLabel()
    ).toBe(closestAxis);
  });

  it("should orient to nearest orthographic view with no selection, face selection, or decal selection", () => {
    const { appController } = createController();

    // 1. With no selection, orients to closest orthographic view
    appController.rotateCamera(0.4, 0.2);
    expect(appController.getCameraStateService().isOrthographic()).toBe(false);
    appController.orientToNearestOrthographicView();
    expect(appController.getCameraStateService().isOrthographic()).toBe(true);

    // 2. With face selected, orients to face orthographic view
    appController.selectFace(0);
    appController.orientToNearestOrthographicView();
    expect(appController.getCameraStateService().isFaceOrthographicView()).toBe(true);
    expect(appController.getCameraStateService().getActiveFaceIndex()).toBe(0);

    // 3. With decal selected, orients to decal view
    appController.addDecalPlaneToSelectedFace();
    const decalId = appController.getSelectedDecalId();
    expect(decalId).not.toBeNull();
    appController.orientToNearestOrthographicView();
    expect(appController.isDecalSelected()).toBe(true);
  });

  it("should select face and vertices, and support getSelectedFaceIndex", () => {
    const { appController, modelService, selectionService } = createController();
    expect(appController.getSelectedFaceIndex()).toBeNull();

    // Select first face of default cube
    const cube = modelService.getCurrentModel();
    const face0 = cube.faces[0];
    appController.selectFace(0);

    expect(appController.getSelectedFaceIndex()).toBe(0);
    expect(selectionService.getSelectedIndices()).toEqual(face0.vertexIndices);

    // Invalid face index is safely ignored
    appController.selectFace(999);
    expect(appController.getSelectedFaceIndex()).toBe(0);
  });

  it("should set face orthographic view and notify VIEW_CHANGED", () => {
    const { appController, stateNotifier } = createController();
    const viewListener = vi.fn();
    stateNotifier.subscribe("VIEW_CHANGED", viewListener);

    appController.setFaceOrthographicView(0);
    expect(viewListener).toHaveBeenCalledTimes(1);
    expect(appController.getCameraStateService().isOrthographic()).toBe(true);
    expect(
      appController.getCameraStateService().getActiveStrategy().getAxisLabel()
    ).toBe("Face 0");

    // Invalid face index is safely ignored
    appController.setFaceOrthographicView(999);
    expect(viewListener).toHaveBeenCalledTimes(1);
  });

  it("should manage material library operations and assignment to faces", () => {
    const { appController, materialService, modelService, selectionService } =
      createController();

    expect(appController.isMaterialLibraryPanelOpen()).toBe(false);
    appController.toggleMaterialLibraryPanel();
    expect(appController.isMaterialLibraryPanelOpen()).toBe(true);

    const createdMat = appController.createMaterial();
    expect(createdMat.name).toBe("Material 1");
    expect(materialService.getMaterials().length).toBe(1);
    expect(materialService.getSelectedMaterialId()).toBe(createdMat.id);

    // Update material
    const updatedMat = createdMat.withBaseColor("#ff0000");
    appController.updateMaterial(updatedMat);
    expect(materialService.getSelectedMaterial()?.baseColor).toBe("#ff0000");

    // Select material
    appController.selectMaterial(null);
    expect(materialService.getSelectedMaterialId()).toBeNull();
    appController.selectMaterial(createdMat.id);
    expect(materialService.getSelectedMaterialId()).toBe(createdMat.id);

    // Select face auto-opens panel and assigns material
    materialService.setPanelOpen(false);
    appController.selectFace(0);
    expect(appController.isMaterialLibraryPanelOpen()).toBe(true);

    appController.assignMaterialToSelectedFaces(createdMat.id);
    const updatedCube = modelService.getCurrentModel();
    expect(updatedCube.faces[0].materialId).toBe(createdMat.id);

    // Export MTL file
    const mtlOutput = appController.exportMtlFile();
    expect(mtlOutput).toContain("newmtl Material_1");
    expect(mtlOutput).toContain("Kd 1.000000 0.000000 0.000000");

    // Multi-select mode toggles face selection
    appController.enterMode("MULTI_SELECT");
    appController.selectFace(1);
    expect(appController.getSelectedFaceIndices()).toContain(0);
    expect(appController.getSelectedFaceIndices()).toContain(1);

    // Assign to both selected faces
    const secondMat = appController.createMaterial();
    appController.assignMaterialToSelectedFaces(secondMat.id);
    const multiMatCube = modelService.getCurrentModel();
    expect(multiMatCube.faces[0].materialId).toBe(secondMat.id);
    expect(multiMatCube.faces[1].materialId).toBe(secondMat.id);

    // Delete material
    const deleteResult = appController.deleteMaterial(createdMat.id);
    expect(deleteResult).toBe(true);
    expect(materialService.getMaterials().length).toBe(1);

    // Assigning with no face selected safely returns
    appController.clearSelection();
    appController.assignMaterialToSelectedFaces(secondMat.id);
  });

  it("should clear material on selected faces and support undo/redo", () => {
    const { appController, modelService, materialService } = createController();
    const createdMat = appController.createMaterial();

    // Select single face and assign material
    appController.selectFace(0);
    appController.assignMaterialToSelectedFaces(createdMat.id);
    expect(modelService.getCurrentModel().faces[0].materialId).toBe(createdMat.id);

    // Clear material on selected face
    appController.clearMaterialOnSelectedFaces();
    expect(modelService.getCurrentModel().faces[0].materialId).toBeNull();

    // Undo should restore material
    expect(appController.canUndo()).toBe(true);
    appController.undo();
    expect(modelService.getCurrentModel().faces[0].materialId).toBe(createdMat.id);

    // Redo should re-clear material
    expect(appController.canRedo()).toBe(true);
    appController.redo();
    expect(modelService.getCurrentModel().faces[0].materialId).toBeNull();

    // Multi-selection material clearing
    appController.selectFace(0);
    appController.assignMaterialToSelectedFaces(createdMat.id);
    appController.enterMode("MULTI_SELECT");
    appController.selectFace(1);
    appController.assignMaterialToSelectedFaces(createdMat.id);
    expect(modelService.getCurrentModel().faces[0].materialId).toBe(createdMat.id);
    expect(modelService.getCurrentModel().faces[1].materialId).toBe(createdMat.id);

    appController.clearMaterialOnSelectedFaces();
    expect(modelService.getCurrentModel().faces[0].materialId).toBeNull();
    expect(modelService.getCurrentModel().faces[1].materialId).toBeNull();

    // Safe no-op when no face is selected
    appController.clearSelection();
    appController.clearMaterialOnSelectedFaces();
  });

  it("should support loadModelFromFile with both OBJ and MTL content", () => {
    const { appController, modelService, materialService } = createController();

    const mtlContent = `
      newmtl GlossyBlue
      Kd 0.0 0.0 1.0
      Pr 0.1
      Pm 0.2
      map_Bump normal.png
    `;

    const objContent = `
      v 0 0 0
      v 1 0 0
      v 1 1 0
      v 0 1 0
      usemtl GlossyBlue
      f 1 2 3
      usemtl UnlistedMat
      f 1 3 4
    `;

    appController.loadModelFromFile("mesh.obj", objContent, mtlContent);

    const materials = materialService.getMaterials();
    expect(materials.length).toBeGreaterThanOrEqual(2);

    const glossyMat = materials.find((m) => m.name === "GlossyBlue");
    expect(glossyMat).toBeDefined();
    expect(glossyMat?.extraProperties).toContain("map_Bump normal.png");

    const currentModel = modelService.getCurrentModel();
    expect(currentModel.faces[0]?.materialId).toBe(glossyMat?.id);

    const unlistedMat = materials.find((m) => m.name === "UnlistedMat");
    expect(unlistedMat).toBeDefined();
    expect(currentModel.faces[1]?.materialId).toBe(unlistedMat?.id);
  });

  it("should support standalone loadMaterialsFromFile", () => {
    const { appController, materialService, modelService, stateNotifier } = createController();

    const mtlContent = `
      newmtl StandaloneMaterial
      Kd 0.5 0.5 0.5
      Pr 0.7
      norm normal.png
    `;

    appController.loadMaterialsFromFile("materials.mtl", mtlContent);

    const materials = materialService.getMaterials();
    const loadedMat = materials.find((m) => m.name === "StandaloneMaterial");
    expect(loadedMat).toBeDefined();
    expect(loadedMat?.roughness).toBeCloseTo(0.7);
    expect(loadedMat?.extraProperties).toContain("norm normal.png");

    // Test updating existing material
    const updateMtl = `
      newmtl StandaloneMaterial
      Kd 1.0 0.0 0.0
      Pr 0.2
    `;
    appController.loadMaterialsFromFile("materials.mtl", updateMtl);
    const updatedMat = materialService.getMaterials().find((m) => m.name === "StandaloneMaterial");
    expect(updatedMat?.roughness).toBeCloseTo(0.2);

    // Test error handling in loadMaterialsFromFile
    const errorListener = vi.fn();
    stateNotifier.subscribe("ERROR_OCCURRED", errorListener);
    vi.spyOn(modelService, "parseMtl").mockImplementationOnce(() => {
      throw new Error("Parse error");
    });
    appController.loadMaterialsFromFile("bad.mtl", "invalid");
    expect(errorListener).toHaveBeenCalledWith("Failed to load materials");
  });

  it("should initialize translationInitialModel if not already set during translateSelectedVertices", () => {
    const { appController, modelService, selectionService } = createController();
    appController.selectOrthographicView("+Z");
    appController.enterMode("TRANSLATE");
    selectionService.selectSingle(0);

    const initX = modelService.getCurrentModel().vertices[0]?.coordinateX ?? 0;
    appController.translateSelectedVertices(new Vector3D(1, 0, 0));
    expect(modelService.getCurrentModel().vertices[0]?.coordinateX).toBeCloseTo(initX + 1);
  });

  it("should manage UI customization and synchronize material library docking", () => {
    const { appController, materialService } = createController();
    const customizationService = appController.getUiCustomizationService();

    expect(customizationService.getSideToolBarDock()).toBe("right");
    expect(customizationService.getMaterialLibraryDock()).toBe("right");

    appController.saveUiCustomization("left", "left");
    expect(customizationService.getSideToolBarDock()).toBe("left");
    expect(customizationService.getMaterialLibraryDock()).toBe("left");
    expect(materialService.getDockSide()).toBe("left");

    appController.setMaterialLibraryDockSide("right");
    expect(materialService.getDockSide()).toBe("right");
    expect(customizationService.getMaterialLibraryDock()).toBe("right");
  });

  it("should re-order face vertices using flipFace in face orthographic view and support undo/redo", () => {
    const { appController, modelService } = createController();

    // Enter face orthographic view on Face 1 (Front: [4, 5, 6, 7])
    appController.setFaceOrthographicView(1);
    expect(appController.isFaceOrthographicView()).toBe(true);
    expect(appController.getSelectedFaceIndex()).toBe(1);
    expect(appController.getSelectedFaceIndices()).toEqual([1]);

    const initialFace1 = modelService.getCurrentModel().faces[1];
    expect(initialFace1?.vertexIndices).toEqual([4, 5, 6, 7]);

    // Flip face in face orthographic view
    const result = appController.flipFace();
    expect(result).toBe(true);

    const updatedFace1 = modelService.getCurrentModel().faces[1];
    expect(updatedFace1?.vertexIndices).toEqual([7, 6, 5, 4]);

    // Undo reverts back to [4, 5, 6, 7]
    appController.undo();
    expect(modelService.getCurrentModel().faces[1]?.vertexIndices).toEqual([4, 5, 6, 7]);

    // Redo re-applies [7, 6, 5, 4]
    appController.redo();
    expect(modelService.getCurrentModel().faces[1]?.vertexIndices).toEqual([7, 6, 5, 4]);
  });

  it("should flip selected face vertices, invert normal, and support undo/redo and multi-select", () => {
    const { appController, modelService, selectionService, cameraStateService } =
      createController();

    // No face selected -> flipFace returns false
    expect(appController.flipFace()).toBe(false);
    expect(appController.flipSelectedFace()).toBe(false);

    // Select Face 1 (Front: vertices [4, 5, 6, 7])
    appController.selectFace(1);
    expect(selectionService.getSelectedFaceIndices()).toEqual([1]);

    const initialModel = modelService.getCurrentModel();
    const initialFace1 = initialModel.faces[1];
    expect(initialFace1?.vertexIndices).toEqual([4, 5, 6, 7]);
    const initialNormal = initialFace1!.calculateNormal(initialModel.vertices);
    expect(initialNormal.coordinateZ).toBeCloseTo(1, 4);

    // Flip face
    const flipSuccess = appController.flipFace();
    expect(flipSuccess).toBe(true);

    const flippedModel = modelService.getCurrentModel();
    const flippedFace1 = flippedModel.faces[1];
    expect(flippedFace1?.vertexIndices).toEqual([7, 6, 5, 4]);
    const flippedNormal = flippedFace1!.calculateNormal(flippedModel.vertices);
    expect(flippedNormal.coordinateZ).toBeCloseTo(-1, 4);

    // Undo reverts back to [4, 5, 6, 7]
    appController.undo();
    const undoneModel = modelService.getCurrentModel();
    expect(undoneModel.faces[1]?.vertexIndices).toEqual([4, 5, 6, 7]);
    expect(
      undoneModel.faces[1]!.calculateNormal(undoneModel.vertices).coordinateZ
    ).toBeCloseTo(1, 4);

    // Redo re-applies [7, 6, 5, 4]
    appController.redo();
    const redoneModel = modelService.getCurrentModel();
    expect(redoneModel.faces[1]?.vertexIndices).toEqual([7, 6, 5, 4]);
    expect(
      redoneModel.faces[1]!.calculateNormal(redoneModel.vertices).coordinateZ
    ).toBeCloseTo(-1, 4);

    // Test in Face Orthographic View
    appController.setFaceOrthographicView(1);
    expect(appController.isFaceOrthographicView()).toBe(true);

    // Flip face while in face orthographic view updates the view normal
    expect(appController.flipFace()).toBe(true);
    expect(modelService.getCurrentModel().faces[1]?.vertexIndices).toEqual([
      4, 5, 6, 7,
    ]);

    // Test multi-select flipping
    appController.clearSelection();
    appController.enterMode("MULTI_SELECT");
    appController.selectFace(0);
    appController.selectFace(1);
    expect(selectionService.getSelectedFaceIndices()).toHaveLength(2);

    const beforeMulti = modelService.getCurrentModel();
    const f0Before = beforeMulti.faces[0]?.vertexIndices;
    const f1Before = beforeMulti.faces[1]?.vertexIndices;

    expect(appController.flipFace()).toBe(true);

    const afterMulti = modelService.getCurrentModel();
    expect(afterMulti.faces[0]?.vertexIndices).toEqual([...f0Before!].reverse());
    expect(afterMulti.faces[1]?.vertexIndices).toEqual([...f1Before!].reverse());
  });

  it("should return isAutoConnectEnabled status correctly", () => {
    const { appController } = createController();
    expect(appController.isAutoConnectEnabled()).toBe(false);
    appController.toggleAutoConnect();
    expect(appController.isAutoConnectEnabled()).toBe(true);
    appController.toggleAutoConnect();
    expect(appController.isAutoConnectEnabled()).toBe(false);
  });

  it("should auto-connect two selected vertices when entering FILL mode and support undo/redo", () => {
    const { appController, modelService, selectionService } = createController();

    // Select two vertices (0 and 6) which do not share an edge in the starter cube
    selectionService.restoreSelection([0, 6], 6);
    expect(selectionService.getSelectedIndices()).toEqual([0, 6]);

    const initialEdges = modelService.getCurrentModel().explicitEdges;
    expect(initialEdges).toHaveLength(0);

    // Enter FILL mode -> should automatically connect vertex 0 and 6
    const success = appController.enterMode("FILL");
    expect(success).toBe(true);

    const updatedModel = modelService.getCurrentModel();
    const hasEdge = updatedModel.explicitEdges.some(
      ([a, b]) => (a === 0 && b === 6) || (a === 6 && b === 0)
    );
    expect(hasEdge).toBe(true);
    expect(selectionService.getActiveVertex()).toBe(6);

    // Undo should remove the edge
    appController.undo();
    expect(modelService.getCurrentModel().explicitEdges).toHaveLength(0);

    // Redo should restore the edge
    appController.redo();
    expect(modelService.getCurrentModel().explicitEdges).toHaveLength(1);
  });

  it("should auto-connect two selected vertices when active vertex is first in array", () => {
    const { appController, modelService, selectionService } = createController();

    // Select two vertices (0 and 6) with 0 as active
    selectionService.restoreSelection([0, 6], 0);
    expect(selectionService.getSelectedIndices()).toEqual([0, 6]);

    const success = appController.enterMode("FILL");
    expect(success).toBe(true);

    const hasEdge = modelService.getCurrentModel().explicitEdges.some(
      ([a, b]) => (a === 0 && b === 6) || (a === 6 && b === 0)
    );
    expect(hasEdge).toBe(true);
    expect(selectionService.getActiveVertex()).toBe(0);
  });

  it("should not create edges when entering other modes or entering FILL with other selection counts", () => {
    const { appController, modelService, selectionService } = createController();

    // Enter INSERT with 2 vertices selected
    selectionService.restoreSelection([0, 6], 6);
    appController.enterMode("INSERT");
    expect(modelService.getCurrentModel().explicitEdges).toHaveLength(0);

    // Enter FILL with 1 vertex selected
    selectionService.restoreSelection([0], 0);
    appController.enterMode("FILL");
    expect(modelService.getCurrentModel().explicitEdges).toHaveLength(0);

    // Enter FILL with 3 vertices selected
    selectionService.restoreSelection([0, 1, 2], 2);
    appController.enterMode("FILL");
    expect(modelService.getCurrentModel().explicitEdges).toHaveLength(0);
  });

  describe("Decal Plane Feature", () => {
    it("should add decal plane to selected face and select it", () => {
      const { appController } = createController();
      appController.selectFace(0);
      expect(appController.isDecalSelected()).toBe(false);

      const added = appController.addDecalPlaneToSelectedFace();
      expect(added).toBe(true);
      expect(appController.getDecals().length).toBe(1);
      expect(appController.isDecalSelected()).toBe(true);
      expect(appController.getSelectedDecal()).toBeDefined();
      expect(appController.getSelectedDecal()?.parentFaceIndex).toBe(0);
    });

    it("should fail to add decal plane when no face is selected", () => {
      const { appController } = createController();
      appController.clearSelection();
      const added = appController.addDecalPlaneToSelectedFace();
      expect(added).toBe(false);
      expect(appController.getDecals().length).toBe(0);
    });

    it("should disable INSERT and FILL modes when decal is selected", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();
      expect(appController.isDecalSelected()).toBe(true);

      // INSERT should be rejected
      const insertResult = appController.enterMode("INSERT");
      expect(insertResult).toBe(false);
      expect(appController.getEditorModeService().getMode()).toBe("DEFAULT");

      // FILL should be rejected
      const fillResult = appController.enterMode("FILL");
      expect(fillResult).toBe(false);
      expect(appController.getEditorModeService().getMode()).toBe("DEFAULT");

      // TRANSLATE (Move Vertex) should be rejected when decal is selected
      const translateResult = appController.enterMode("TRANSLATE");
      expect(translateResult).toBe(false);
      expect(appController.getEditorModeService().getMode()).toBe("DEFAULT");

      const transformResult = appController.enterMode("TRANSFORM");
      expect(transformResult).toBe(true);
      expect(appController.getEditorModeService().getMode()).toBe("TRANSFORM");
    });

    it("should prevent deleteSelectedVertices and centerObject when decal is selected", () => {
      const { appController, modelService, cameraStateService } = createController();
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();

      const vertexCount = modelService.getCurrentModel().getVertexCount();
      appController.deleteSelectedVertices();
      expect(modelService.getCurrentModel().getVertexCount()).toBe(vertexCount);

      const targetBefore = cameraStateService.getTargetPoint();
      cameraStateService.pan(5, 5);
      appController.centerObject();
      // centerObject should be a no-op when decal is selected
      expect(cameraStateService.getTargetPoint().coordinateX).not.toBe(targetBefore.coordinateX);
    });

    it("should switch to decal orthographic view", () => {
      const { appController, cameraStateService } = createController();
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();
      const decal = appController.getSelectedDecal()!;

      const success = appController.setDecalOrthographicView(decal.id);
      expect(success).toBe(true);
      expect(cameraStateService.isOrthographic()).toBe(true);
      expect(cameraStateService.isFaceOrthographicView()).toBe(true);
    });

    it("should assign and clear material on selected decal plane", () => {
      const { appController } = createController();
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();

      const material = appController.createMaterial();
      appController.assignMaterialToSelectedFaces(material.id);

      expect(appController.getSelectedDecal()?.materialId).toBe(material.id);

      // Clear material on decal
      appController.clearMaterialOnSelectedFaces();
      expect(appController.getSelectedDecal()?.materialId).toBeNull();
    });

    it("should translate and rotate decal plane in orthographic view", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();
      const initialCenter = appController.getSelectedDecal()!.center;

      // Translate decal via transform translation
      appController.beginTransformTranslation();
      appController.applyTransformTranslation(new Vector3D(1, 2, 0));
      appController.endTransformTranslation();

      const translatedCenter = appController.getSelectedDecal()!.center;
      expect(translatedCenter.coordinateX).toBeCloseTo(initialCenter.coordinateX + 1, 4);
      expect(translatedCenter.coordinateY).toBeCloseTo(initialCenter.coordinateY + 2, 4);

      // Rotate decal
      appController.beginRotation();
      appController.applyDragRotation(Math.PI / 4);
      appController.endRotation();

      expect(appController.getSelectedDecal()!.rotationAngle).toBeCloseTo(Math.PI / 4, 4);

      // Scale decal
      const sizeBefore = appController.getSelectedDecal()!.size;
      appController.beginScaling();
      appController.applyDragScaling(1.5);
      appController.endScaling();

      expect(appController.getSelectedDecal()!.size).toBeGreaterThan(sizeBefore);

      // Undo decal scaling
      expect(appController.canUndo()).toBe(true);
      appController.undo();
      expect(appController.getSelectedDecal()!.size).toBeCloseTo(sizeBefore, 4);
    });

    it("should support undo and redo for decal creation and manipulation", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.selectFace(0);

      // Add decal
      appController.addDecalPlaneToSelectedFace();
      expect(appController.getDecals().length).toBe(1);

      // Undo creation
      appController.undo();
      expect(appController.getDecals().length).toBe(0);

      // Redo creation
      appController.redo();
      expect(appController.getDecals().length).toBe(1);

      // Assign material
      const mat = appController.createMaterial();
      appController.selectDecal("decal_1");
      appController.assignMaterialToSelectedFaces(mat.id);
      expect(appController.getSelectedDecal()?.materialId).toBe(mat.id);

      // Undo material assignment
      appController.undo();
      expect(appController.getSelectedDecal()?.materialId).toBeNull();

      // Redo material assignment
      appController.redo();
      expect(appController.getSelectedDecal()?.materialId).toBe(mat.id);
    });

    it("should delete selected decal and support undo and redo", () => {
      const { appController } = createController();
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();
      expect(appController.getDecals().length).toBe(1);
      expect(appController.isDecalSelected()).toBe(true);

      const deleted = appController.deleteSelectedDecal();
      expect(deleted).toBe(true);
      expect(appController.getDecals().length).toBe(0);
      expect(appController.isDecalSelected()).toBe(false);

      // Undo deletion
      appController.undo();
      expect(appController.getDecals().length).toBe(1);

      // Redo deletion
      appController.redo();
      expect(appController.getDecals().length).toBe(0);
    });

    it("should allow decal selection in all views and retain selection when orbiting or switching views", () => {
      const { appController, cameraStateService } = createController();
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();
      const decal = appController.getSelectedDecal()!;

      expect(appController.isFaceOrthographicViewOf(0)).toBe(true);
      expect(appController.canSelectDecal(decal.id)).toBe(true);
      expect(appController.isDecalSelected()).toBe(true);

      // Switch to a different view (e.g. +X orthographic)
      appController.selectOrthographicView("+X");
      expect(appController.canSelectDecal(decal.id)).toBe(true);
      expect(appController.isDecalSelected()).toBe(true);

      // Deselect decal and re-select it in +X orthographic view
      appController.selectDecal(null);
      expect(appController.isDecalSelected()).toBe(false);
      const selectResult = appController.selectDecal(decal.id);
      expect(selectResult).toBe(true);
      expect(appController.isDecalSelected()).toBe(true);

      // Orbiting camera to perspective view should retain decal selection
      appController.rotateCamera(0.2, 0.3);
      expect(cameraStateService.isOrthographic()).toBe(false);
      expect(appController.isDecalSelected()).toBe(true);

      // In perspective view, selecting decal should still succeed
      appController.selectDecal(null);
      expect(appController.selectDecal(decal.id)).toBe(true);
      expect(appController.isDecalSelected()).toBe(true);
    });

    it("should support selectParentFace to switch selection from decal to parent face", () => {
      const { appController } = createController();
      expect(appController.selectParentFace()).toBe(false);

      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();
      expect(appController.isDecalSelected()).toBe(true);

      const success = appController.selectParentFace();
      expect(success).toBe(true);
      expect(appController.isDecalSelected()).toBe(false);
      expect(appController.getSelectedFaceIndex()).toBe(0);
    });

    it("should allow switching selection between decal and faces in TRANSFORM mode", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("TRANSFORM");

      appController.selectFace(0);
      expect(appController.getSelectedFaceIndex()).toBe(0);
      expect(appController.isDecalSelected()).toBe(false);

      appController.addDecalPlaneToSelectedFace();
      const decal = appController.getSelectedDecal()!;
      expect(appController.isDecalSelected()).toBe(true);

      // In TRANSFORM mode, selecting a face directly deselects decal and selects the face
      appController.selectFace(0);
      expect(appController.getSelectedFaceIndex()).toBe(0);
      expect(appController.isDecalSelected()).toBe(false);

      // In TRANSFORM mode, selecting decal deselects face and selects decal
      appController.selectDecal(decal.id);
      expect(appController.isDecalSelected()).toBe(true);
      expect(appController.getSelectionService().getSelectedFaceIndices().length).toBe(0);
    });
  });

  describe("ZIP Import", () => {
    it("should import zip archive containing obj, mtl, and images and restore materials, model, and decals", () => {
      const { appController, materialService, modelService } = createController();

      const encodeText = (t: string) => new TextEncoder().encode(t);
      const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);

      const objContent = `
        o MainModel
        g MainModel
        v 0 0 0
        v 1 0 0
        v 1 1 0
        v 0 1 0
        f 1 2 3 4

        o Decal_test_decal
        g Decal_test_decal
        usemtl DecalMat
        v 0.2 0.2 0.01
        v 0.8 0.2 0.01
        v 0.8 0.8 0.01
        v 0.2 0.8 0.01
        f 5/1 6/2 7/3 8/4
      `;

      const mtlContent = `
        newmtl DecalMat
        map_Kd logo.png
      `;

      const zipBytes = zipSync({
        "model.obj": encodeText(objContent),
        "model.mtl": encodeText(mtlContent),
        "logo.png": pngBytes,
      });

      appController.importZip(zipBytes, "test_model.zip");

      // Verify model was loaded
      const model = modelService.getCurrentModel();
      expect(model.getVertexCount()).toBe(4);
      expect(model.getFaceCount()).toBe(1);

      // Verify materials were loaded and linked to image data URL
      const materials = materialService.getMaterials();
      const decalMat = materials.find((m) => m.name === "DecalMat");
      expect(decalMat).toBeDefined();
      expect(decalMat?.imageUrl).toContain("data:image/png;base64,");

      // Verify decals were restored
      const decals = appController.getDecals();
      expect(decals.length).toBe(1);
      expect(decals[0]?.id).toBe("Decal_test_decal");
      expect(decals[0]?.materialId).toBe(decalMat?.id);
    });

    it("should emit error notification when importing invalid zip", () => {
      const { appController, stateNotifier } = createController();
      const errorListener = vi.fn();
      stateNotifier.subscribe("ERROR_OCCURRED", errorListener);

      appController.importZip(new Uint8Array([0, 0, 0, 0]), "corrupt.zip");
      expect(errorListener).toHaveBeenCalledWith(
        expect.stringContaining("Failed to extract ZIP archive")
      );
    });
  });

  describe("getVisibleVertexIndices", () => {
    it("should return null when camera is in perspective mode", () => {
      const { appController, cameraStateService } = createController();
      expect(cameraStateService.isOrthographic()).toBe(false);
      appController.selectSingleVertex(0);

      expect(appController.getVisibleVertexIndices()).toBeNull();
    });

    it("should return null when camera is in orthographic mode but no vertex is selected", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.clearSelection();

      expect(appController.getVisibleVertexIndices()).toBeNull();
    });

    it("should return coplanar vertex indices when camera is in orthographic mode and a vertex is selected", () => {
      const { appController, modelService } = createController();
      // Default cube has vertices at Z = -1 and Z = 1
      appController.selectOrthographicView("+Z"); // Grid plane is XY, depth axis is Z

      // Select vertex 0 (cube front face, Z = 1)
      appController.selectSingleVertex(0);

      const visible = appController.getVisibleVertexIndices();
      expect(visible).not.toBeNull();
      // Only vertices with Z matching vertex 0 should be returned (4 vertices of that face)
      const currentModel = modelService.getCurrentModel();
      const selectedZ = currentModel.vertices[0]?.coordinateZ;
      for (const idx of visible!) {
        expect(currentModel.vertices[idx]?.coordinateZ).toBeCloseTo(selectedZ!, 4);
      }
    });

    it("should use selectedIndices if activeVertex is null but vertices are selected", () => {
      const { appController, selectionService } = createController();
      appController.selectOrthographicView("+Y"); // Grid plane is XZ, depth axis is Y

      // Restore selection without active vertex index
      selectionService.restoreSelection([0], null);

      const visible = appController.getVisibleVertexIndices();
      expect(visible).not.toBeNull();
    });
  });

  describe("UI Customization", () => {
    it("should get and set edge line width", () => {
      const { appController } = createController();

      expect(appController.getEdgeLineWidth()).toBe(2);

      appController.setEdgeLineWidth(6);
      expect(appController.getEdgeLineWidth()).toBe(6);
    });

    it("should save UI customization with edge line width", () => {
      const { appController, uiCustomizationService, materialService } =
        createController();

      appController.saveUiCustomization("left", "left", 4);

      expect(appController.getEdgeLineWidth()).toBe(4);
      expect(uiCustomizationService.getSideToolBarDock()).toBe("left");
      expect(uiCustomizationService.getMaterialLibraryDock()).toBe("left");
      expect(materialService.getDockSide()).toBe("left");
    });

    it("should save UI customization preserving edge line width when omitted", () => {
      const { appController, uiCustomizationService } = createController();

      appController.setEdgeLineWidth(5);
      appController.saveUiCustomization("left", "left");

      expect(appController.getEdgeLineWidth()).toBe(5);
      expect(uiCustomizationService.getSideToolBarDock()).toBe("left");
      expect(uiCustomizationService.getMaterialLibraryDock()).toBe("left");
    });
  });

  describe("Transform & Move Vertex", () => {
    it("should disallow enterMode('TRANSLATE') when decal is selected", () => {
      const { appController, decalService } = createController();
      appController.selectOrthographicView("+Z");
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();

      expect(decalService.isDecalSelected()).toBe(true);

      const canEnter = appController.enterMode("TRANSLATE");
      expect(canEnter).toBe(false);
      expect(appController.getEditorModeService().getMode()).not.toBe("TRANSLATE");
    });

    it("should allow enterMode('TRANSFORM') in orthographic view and disallow in perspective view", () => {
      const { appController } = createController();

      // Perspective view -> fails
      const inPerspective = appController.enterMode("TRANSFORM");
      expect(inPerspective).toBe(false);

      // Orthographic view -> succeeds
      appController.selectOrthographicView("+Z");
      const inOrtho = appController.enterMode("TRANSFORM");
      expect(inOrtho).toBe(true);
      expect(appController.getEditorModeService().getMode()).toBe("TRANSFORM");
    });

    it("should translate entire model in orthographic view via transform translation", () => {
      const { appController, modelService } = createController();
      appController.selectOrthographicView("+Z");
      if (appController.isGridSnapEnabled()) {
        appController.toggleGridSnap();
      }

      const initialCenter = modelService.getCurrentModel().calculateCenter();

      appController.beginTransformTranslation();
      appController.applyTransformTranslation(new Vector3D(1, 2, 0));
      appController.endTransformTranslation();

      const newCenter = modelService.getCurrentModel().calculateCenter();
      expect(newCenter.coordinateX).toBeCloseTo(initialCenter.coordinateX + 1, 5);
      expect(newCenter.coordinateY).toBeCloseTo(initialCenter.coordinateY + 2, 5);
    });

    it("should translate selected decal via transform translation", () => {
      const { appController, decalService } = createController();
      appController.selectOrthographicView("+Z");
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();

      const selectedDecal = decalService.getSelectedDecal()!;
      const initialCenter = selectedDecal.center;

      appController.beginTransformTranslation();
      appController.applyTransformTranslation(new Vector3D(0.5, 0.5, 0));
      appController.endTransformTranslation();

      const updatedDecal = decalService.getSelectedDecal()!;
      expect(updatedDecal.center.coordinateX).toBeCloseTo(initialCenter.coordinateX + 0.5, 5);
      expect(updatedDecal.center.coordinateY).toBeCloseTo(initialCenter.coordinateY + 0.5, 5);
    });

    it("should emit error when applying transform translation in perspective view", () => {
      const { appController, stateNotifier } = createController();
      const errorListener = vi.fn();
      stateNotifier.subscribe("ERROR_OCCURRED", errorListener);

      appController.applyTransformTranslation(new Vector3D(1, 0, 0));
      expect(errorListener).toHaveBeenCalledWith("Switch to an Orthographic view");
    });
  });

  describe("deleteSelectedFace", () => {
    it("should return false if a decal is currently selected", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();
      expect(appController.isDecalSelected()).toBe(true);

      const result = appController.deleteSelectedFace();
      expect(result).toBe(false);
    });

    it("should return false if no face is selected", () => {
      const { appController } = createController();
      appController.clearSelection();

      const result = appController.deleteSelectedFace();
      expect(result).toBe(false);
    });

    it("should notify ERROR_OCCURRED and return false if child decal plane exists on the face", () => {
      const { appController, modelService, stateNotifier } = createController();
      appController.selectOrthographicView("+Z");
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();

      // Deselect decal and select face 0 again
      appController.selectDecal(null);
      appController.selectFace(0);
      expect(appController.getSelectedFaceIndex()).toBe(0);
      expect(appController.isDecalSelected()).toBe(false);

      let errorMessage = "";
      stateNotifier.subscribe("ERROR_OCCURRED", (msg) => {
        errorMessage = msg;
      });

      const initialFaceCount = modelService.getCurrentModel().faces.length;
      const result = appController.deleteSelectedFace();

      expect(result).toBe(false);
      expect(errorMessage).toBe(
        "Decal plane should be deleted before deleting Face"
      );
      expect(modelService.getCurrentModel().faces.length).toBe(initialFaceCount);
    });

    it("should delete selected face, preserve edges, clear selection, and support undo/redo", () => {
      const { appController, modelService } = createController();
      // Cube model has 6 faces
      const initialFaces = modelService.getCurrentModel().faces.length;
      expect(initialFaces).toBe(6);

      appController.selectFace(0);
      expect(appController.getSelectedFaceIndex()).toBe(0);

      const result = appController.deleteSelectedFace();
      expect(result).toBe(true);

      const updatedModel = modelService.getCurrentModel();
      expect(updatedModel.faces.length).toBe(initialFaces - 1);
      // Face 0 was quad with 4 edges, they should now be preserved in explicitEdges
      expect(updatedModel.explicitEdges.length).toBeGreaterThanOrEqual(4);
      expect(appController.getSelectedFaceIndex()).toBeNull();

      // Undo deletion
      appController.undo();
      expect(modelService.getCurrentModel().faces.length).toBe(initialFaces);

      // Redo deletion
      appController.redo();
      expect(modelService.getCurrentModel().faces.length).toBe(initialFaces - 1);
    });

    it("should remap decals on higher-indexed faces and reset camera if in face ortho view", () => {
      const { appController, decalService, cameraStateService } = createController();
      appController.selectOrthographicView("+Z");

      // Add decal on face 2
      appController.selectFace(2);
      appController.addDecalPlaneToSelectedFace();
      const decalFace2 = decalService.getSelectedDecal()!;
      expect(decalFace2.parentFaceIndex).toBe(2);

      // Select face 0 and enter face orthographic view
      appController.selectDecal(null);
      appController.selectFace(0);
      appController.setFaceOrthographicView(0);
      expect(cameraStateService.isFaceOrthographicView()).toBe(true);

      const result = appController.deleteSelectedFace();
      expect(result).toBe(true);

      // Decal on old face 2 should now point to face 1
      expect(decalService.getDecal(decalFace2.id)?.parentFaceIndex).toBe(1);

      // Camera should have switched to closest orthographic view
      expect(cameraStateService.isFaceOrthographicView()).toBe(false);
      expect(cameraStateService.isOrthographic()).toBe(true);
    });
  });

  describe("deleteSelectedEdges", () => {
    it("should return false if a decal is selected", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();
      expect(appController.isDecalSelected()).toBe(true);

      const result = appController.deleteSelectedEdges();
      expect(result).toBe(false);
    });

    it("should return false if no edges are selected", () => {
      const { appController } = createController();
      expect(appController.getSelectedEdges().length).toBe(0);

      const result = appController.deleteSelectedEdges();
      expect(result).toBe(false);
    });

    it("should notify ERROR_OCCURRED and return false if an edge is part of a face", () => {
      const { appController, stateNotifier } = createController();
      let errorMessage = "";
      stateNotifier.subscribe("ERROR_OCCURRED", (msg) => {
        errorMessage = msg;
      });

      // Cube face 0 has vertices [0, 1, 2, 3] -> edge [0, 1] is part of face 0
      appController.selectEdge([0, 1]);
      expect(appController.getSelectedEdges()).toEqual([[0, 1]]);

      const result = appController.deleteSelectedEdges();
      expect(result).toBe(false);
      expect(errorMessage).toBe("Face should be deleted before deleting Edge");
    });

    it("should delete standalone explicit edge, leave vertices intact, clear selection, and support undo/redo", () => {
      const { appController, modelService } = createController();

      // First delete face 0 so its edges become explicit edges not owned by any face
      // Note: Face 0 has edges [0,1], [1,2], [2,3], [3,0].
      // Wait, in a cube, adjacent faces also share some edges.
      // Let's create a standalone explicit edge by drawing edge between two unlinked vertices or setting explicitEdges directly.
      const currentModel = modelService.getCurrentModel();
      // Let's add an explicit edge [0, 6] (cross diagonal, not part of any cube face)
      modelService.setCurrentModel({
        ...currentModel,
        explicitEdges: [[0, 6]],
      });

      appController.selectEdge([0, 6]);
      expect(appController.getSelectedEdges()).toEqual([[0, 6]]);

      const initialVertexCount = modelService.getCurrentModel().vertices.length;
      const result = appController.deleteSelectedEdges();
      expect(result).toBe(true);

      // Explicit edge [0, 6] should be removed
      const updatedModel = modelService.getCurrentModel();
      expect(updatedModel.explicitEdges.some(([a, b]) => (a === 0 && b === 6) || (a === 6 && b === 0))).toBe(false);
      // Vertices must remain intact
      expect(updatedModel.vertices.length).toBe(initialVertexCount);
      // Selection cleared
      expect(appController.getSelectedEdges().length).toBe(0);

      // Undo
      appController.undo();
      const undoneModel = modelService.getCurrentModel();
      expect(undoneModel.explicitEdges.some(([a, b]) => (a === 0 && b === 6) || (a === 6 && b === 0))).toBe(true);

      // Redo
      appController.redo();
      const redoneModel = modelService.getCurrentModel();
      expect(redoneModel.explicitEdges.some(([a, b]) => (a === 0 && b === 6) || (a === 6 && b === 0))).toBe(false);
    });

    it("should support toggleEdgeSelection", () => {
      const { appController } = createController();
      appController.toggleEdgeSelection([1, 2]);
      expect(appController.getSelectedEdges()).toEqual([[1, 2]]);

      appController.toggleEdgeSelection([1, 2]);
      expect(appController.getSelectedEdges()).toEqual([]);
    });
  });

  describe("Vertex Merging on Move", () => {
    it("should merge moved vertex into existing vertex when dragging ends", () => {
      const { appController, modelService, selectionService } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("TRANSLATE");

      // Starter cube: vertices 0 is (-1, -1, -1), vertex 1 is (1, -1, -1)
      const initialVertices = modelService.getCurrentModel().vertices;
      const vertex0 = initialVertices[0]!;
      const vertex1 = initialVertices[1]!;
      const deltaToVertex1 = vertex1.subtract(vertex0);

      // Select vertex 0
      selectionService.selectSingle(0);
      appController.beginTranslation();

      // Drag vertex 0 to vertex 1's position
      appController.applyDragTranslation(deltaToVertex1);
      expect(modelService.getCurrentModel().getVertexCount()).toBe(8); // during drag, still 8

      // Finish drag
      appController.endTranslation();

      // Now merged! Vertex count decreased from 8 to 7
      const mergedModel = modelService.getCurrentModel();
      expect(mergedModel.getVertexCount()).toBe(7);

      // The merged vertex at that position remains selected
      const selectedIndices = selectionService.getSelectedIndices();
      expect(selectedIndices.length).toBe(1);
      const selectedCoord = mergedModel.vertices[selectedIndices[0]!]!;
      expect(selectedCoord.equals(vertex1, 0.001)).toBe(true);
    });

    it("should merge moved vertex via translateSelectedVertices and support undo/redo", () => {
      const { appController, modelService, selectionService } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("TRANSLATE");

      const vertex0 = modelService.getCurrentModel().vertices[0]!;
      const vertex1 = modelService.getCurrentModel().vertices[1]!;
      const delta = vertex1.subtract(vertex0);

      selectionService.selectSingle(0);
      appController.beginTranslation(); // Record snapshot for undo
      appController.translateSelectedVertices(delta);

      expect(modelService.getCurrentModel().getVertexCount()).toBe(7);

      // Undo restores original 8 vertices
      appController.undo();
      expect(modelService.getCurrentModel().getVertexCount()).toBe(8);

      // Redo restores 7 merged vertices
      appController.redo();
      expect(modelService.getCurrentModel().getVertexCount()).toBe(7);
    });

    it("should collapse quad face into triangle when adjacent vertex merges", () => {
      const { appController, modelService, selectionService } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("TRANSLATE");

      const vertex0 = modelService.getCurrentModel().vertices[0]!;
      const vertex1 = modelService.getCurrentModel().vertices[1]!;
      const delta = vertex1.subtract(vertex0);

      selectionService.selectSingle(0);
      appController.beginTranslation();
      appController.applyDragTranslation(delta);
      appController.endTranslation();

      const faces = modelService.getCurrentModel().faces;
      // The faces that had edge (0, 1) now become triangles (< 4 vertices)
      const triangleFaces = faces.filter((f) => f.vertexIndices.length === 3);
      expect(triangleFaces.length).toBeGreaterThan(0);
    });

    it("should not merge if vertex was moved to an empty coordinate", () => {
      const { appController, modelService, selectionService } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("TRANSLATE");

      selectionService.selectSingle(0);
      appController.beginTranslation();
      appController.applyDragTranslation(new Vector3D(0, 10, 0));
      appController.endTranslation();

      expect(modelService.getCurrentModel().getVertexCount()).toBe(8);
    });

    it("should not merge if translation ended without moving", () => {
      const { appController, modelService, selectionService } = createController();
      selectionService.selectSingle(0);
      appController.beginTranslation();
      appController.endTranslation();

      expect(modelService.getCurrentModel().getVertexCount()).toBe(8);
    });
  });

  describe("exact dimensions in transform mode", () => {
    it("should return model dimensions matching bounding box", () => {
      const { appController } = createController();
      // Default cube is 2x2x2
      const dims = appController.getModelDimensions();
      expect(dims.x).toBeCloseTo(2, 5);
      expect(dims.y).toBeCloseTo(2, 5);
      expect(dims.z).toBeCloseTo(2, 5);
    });

    it("should return zero dimensions if model is empty", () => {
      const { appController, modelService } = createController();
      modelService.setCurrentModel(new MeshGeometry([], []));
      const dims = appController.getModelDimensions();
      expect(dims).toEqual({ x: 0, y: 0, z: 0 });
    });

    it("should reject setExactDimensions if any dimension is <= 0", () => {
      const { appController } = createController();
      expect(appController.setExactDimensions(0, 2, 2)).toBe(false);
      expect(appController.setExactDimensions(2, -1, 2)).toBe(false);
      expect(appController.setExactDimensions(2, 2, 0)).toBe(false);
    });

    it("should reject setExactDimensions if model is empty", () => {
      const { appController, modelService } = createController();
      modelService.setCurrentModel(new MeshGeometry([], []));
      expect(appController.setExactDimensions(5, 5, 5)).toBe(false);
    });

    it("should scale model to exact dimensions and support undo/redo", () => {
      const { appController, modelService } = createController();
      const initialCenter = modelService.getCurrentModel().calculateCenter();

      const success = appController.setExactDimensions(4, 6, 8);
      expect(success).toBe(true);

      const dims = appController.getModelDimensions();
      expect(dims.x).toBeCloseTo(4, 5);
      expect(dims.y).toBeCloseTo(6, 5);
      expect(dims.z).toBeCloseTo(8, 5);

      // Geometric center should be preserved
      const newCenter = modelService.getCurrentModel().calculateCenter();
      expect(newCenter.coordinateX).toBeCloseTo(initialCenter.coordinateX, 5);
      expect(newCenter.coordinateY).toBeCloseTo(initialCenter.coordinateY, 5);
      expect(newCenter.coordinateZ).toBeCloseTo(initialCenter.coordinateZ, 5);

      // Undo restores 2x2x2
      appController.undo();
      const undoneDims = appController.getModelDimensions();
      expect(undoneDims.x).toBeCloseTo(2, 5);
      expect(undoneDims.y).toBeCloseTo(2, 5);
      expect(undoneDims.z).toBeCloseTo(2, 5);

      // Redo restores 4x6x8
      appController.redo();
      const redoneDims = appController.getModelDimensions();
      expect(redoneDims.x).toBeCloseTo(4, 5);
      expect(redoneDims.y).toBeCloseTo(6, 5);
      expect(redoneDims.z).toBeCloseTo(8, 5);
    });

    it("should scale decals proportionally when exact dimensions are set on model", () => {
      const { appController, decalService } = createController();
      appController.selectOrthographicView("+Z");
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();

      const initialDecals = decalService.getDecals();
      expect(initialDecals.length).toBe(1);
      const initialDecalSize = initialDecals[0]!.size;

      // Double the dimensions from 2 to 4 in all axes
      appController.setExactDimensions(4, 4, 4);

      const updatedDecals = decalService.getDecals();
      expect(updatedDecals.length).toBe(1);
      expect(updatedDecals[0]!.size).toBeCloseTo(initialDecalSize * 2, 5);
    });

    it("should handle getSelectedDecalSize and setExactDecalSize", () => {
      const { appController, decalService } = createController();
      expect(appController.getSelectedDecalSize()).toBeNull();

      appController.selectOrthographicView("+Z");
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();

      const initialSize = appController.getSelectedDecalSize();
      expect(initialSize).not.toBeNull();
      expect(initialSize!).toBeGreaterThan(0);

      // Invalid size rejected
      expect(appController.setExactDecalSize(0)).toBe(false);
      expect(appController.setExactDecalSize(-1)).toBe(false);

      // Valid size updated
      const newSize = initialSize! * 1.5;
      const success = appController.setExactDecalSize(newSize);
      expect(success).toBe(true);
      expect(appController.getSelectedDecalSize()).toBeCloseTo(newSize, 5);

      // Undo
      appController.undo();
      expect(appController.getSelectedDecalSize()).toBeCloseTo(initialSize!, 5);
    });
  });

  describe("exiting orthographic modes on camera rotation", () => {
    it("should exit TRANSFORM mode when camera rotates into perspective view", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("TRANSFORM");
      expect(appController.getEditorModeService().getMode()).toBe("TRANSFORM");

      appController.rotateCamera(0.1, 0.2);

      expect(appController.getCameraStateService().isOrthographic()).toBe(false);
      expect(appController.getEditorModeService().getMode()).toBe("DEFAULT");
    });

    it("should exit TRANSLATE (Move Vertex) mode when camera rotates into perspective view", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("TRANSLATE");
      expect(appController.getEditorModeService().getMode()).toBe("TRANSLATE");

      appController.rotateCamera(0.1, 0.2);

      expect(appController.getCameraStateService().isOrthographic()).toBe(false);
      expect(appController.getEditorModeService().getMode()).toBe("DEFAULT");
    });

    it("should exit ROTATE and SCALE modes when camera rotates into perspective view", () => {
      const { appController } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("ROTATE");
      expect(appController.getEditorModeService().getMode()).toBe("ROTATE");
      appController.rotateCamera(0.1, 0.2);
      expect(appController.getEditorModeService().getMode()).toBe("DEFAULT");

      appController.selectOrthographicView("+Z");
      appController.enterMode("SCALE");
      expect(appController.getEditorModeService().getMode()).toBe("SCALE");
      appController.rotateCamera(0.1, 0.2);
      expect(appController.getEditorModeService().getMode()).toBe("DEFAULT");
    });

    it("should preserve MULTI_SELECT mode when camera rotates", () => {
      const { appController } = createController();
      appController.enterMode("MULTI_SELECT");
      expect(appController.getEditorModeService().getMode()).toBe("MULTI_SELECT");

      appController.rotateCamera(0.1, 0.2);
      expect(appController.getEditorModeService().getMode()).toBe("MULTI_SELECT");
    });
  });

  describe("Decal & Face Orthographic Operations", () => {
    it("should add decal plane to selected face and switch to face orthographic view", () => {
      const { appController, decalService } = createController();

      // Select face 1
      appController.selectFace(1);
      expect(appController.getSelectedFaceIndex()).toBe(1);

      // Add decal plane
      const added = appController.addDecalPlaneToSelectedFace();
      expect(added).toBe(true);
      expect(appController.isFaceOrthographicView()).toBe(true);
      expect(decalService.isDecalSelected()).toBe(true);
      expect(decalService.getDecals().length).toBe(1);

      // In face orthographic view, getSelectedFaceIndex returns active face
      expect(appController.getSelectedFaceIndex()).toBe(1);
      expect(appController.getSelectedFaceIndices()).toEqual([1]);

      // Delete selected decal
      const deleted = appController.deleteSelectedDecal();
      expect(deleted).toBe(true);
      expect(decalService.getDecals().length).toBe(0);
    });

    it("should add decal plane directly while in face orthographic view without explicit face selection", () => {
      const { appController, decalService } = createController();

      appController.setFaceOrthographicView(1);
      expect(appController.isFaceOrthographicView()).toBe(true);

      const added = appController.addDecalPlaneToSelectedFace();
      expect(added).toBe(true);
      expect(decalService.getDecals().length).toBe(1);
      expect(decalService.getDecals()[0]?.parentFaceIndex).toBe(1);
    });

    it("should allow selecting decal in orthographic view", () => {
      const { appController, decalService } = createController();

      appController.selectFace(1);
      appController.addDecalPlaneToSelectedFace();
      const decalId = decalService.getSelectedDecalId()!;

      // Deselect decal
      appController.selectDecal(null);
      expect(decalService.isDecalSelected()).toBe(false);

      // Select decal in orthographic view
      appController.selectOrthographicView("+Z");
      expect(appController.canSelectDecal(decalId)).toBe(true);
      expect(appController.selectDecal(decalId)).toBe(true);
      expect(decalService.isDecalSelected()).toBe(true);
    });

    it("should flip face and also flip existing decals on that face", () => {
      const { appController, decalService, modelService } = createController();

      // Face 1 on starter cube has normal (0, 0, 1)
      appController.selectFace(1);
      appController.addDecalPlaneToSelectedFace();
      const decal = decalService.getSelectedDecal()!;
      expect(decal.normal.coordinateZ).toBeCloseTo(1, 4);
      expect(decal.center.coordinateZ).toBeCloseTo(1.02, 4);

      // Flip face 1
      const flipped = appController.flipFace();
      expect(flipped).toBe(true);

      // Face 1 normal should now be (0, 0, -1)
      const currentModel = modelService.getCurrentModel();
      const face1 = currentModel.faces[1]!;
      const faceNormal = face1.calculateNormal(currentModel.vertices);
      expect(faceNormal.coordinateZ).toBeCloseTo(-1, 4);

      // The decal on face 1 should also have flipped normal and center
      const flippedDecal = decalService.getDecal(decal.id)!;
      expect(flippedDecal.normal.coordinateZ).toBeCloseTo(-1, 4);
      expect(flippedDecal.center.coordinateZ).toBeCloseTo(0.98, 4);
    });

    it("should allow selecting face after decal plane is added, deselecting the decal", () => {
      const { appController, decalService } = createController();

      appController.selectFace(1);
      appController.addDecalPlaneToSelectedFace();
      expect(decalService.isDecalSelected()).toBe(true);

      // Select face 1 again
      appController.selectFace(1);
      expect(decalService.isDecalSelected()).toBe(false);
      expect(appController.getSelectedFaceIndices()).toEqual([1]);
    });
  });

  describe("Move vertex with Clone and Edge Selection", () => {
    it("should toggle cloneEnabled via appController", () => {
      const { appController } = createController();
      expect(appController.isCloneEnabled()).toBe(false);

      appController.toggleClone();
      expect(appController.isCloneEnabled()).toBe(true);

      appController.toggleClone();
      expect(appController.isCloneEnabled()).toBe(false);
    });

    it("should clone and move vertex without connecting edge when clone is ON and auto-connect is OFF", () => {
      const { appController, modelService, selectionService } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("TRANSLATE");

      // Select vertex 0
      selectionService.selectSingle(0);
      const originalVertex = modelService.getCurrentModel().vertices[0]!;
      const originalCount = modelService.getCurrentModel().vertices.length;

      // Enable clone, ensure auto-connect is OFF
      appController.toggleClone();
      expect(appController.isCloneEnabled()).toBe(true);
      if (appController.isAutoConnectEnabled()) {
        appController.toggleAutoConnect();
      }

      appController.beginTranslation();
      appController.applyDragTranslation(new Vector3D(1, 0, 0));

      const updatedModel = modelService.getCurrentModel();
      // Should have created one new vertex
      expect(updatedModel.vertices.length).toBe(originalCount + 1);
      // Original vertex 0 remains unchanged
      expect(updatedModel.vertices[0]!.equals(originalVertex)).toBe(true);
      // Cloned vertex (index originalCount) was translated
      const clonedVertex = updatedModel.vertices[originalCount]!;
      expect(clonedVertex.coordinateX).toBeCloseTo(originalVertex.coordinateX + 1, 4);
      // Selection should now be the cloned vertex
      expect(selectionService.getSelectedIndices()).toEqual([originalCount]);
      // No new explicit edge was created
      expect(updatedModel.explicitEdges.length).toBe(0);

      // Subsequent drag in same session moves the clone, does not create another clone
      appController.applyDragTranslation(new Vector3D(2, 0, 0));
      expect(modelService.getCurrentModel().vertices.length).toBe(originalCount + 1);

      appController.endTranslation();

      // Undo should revert the clone and move
      appController.undo();
      expect(modelService.getCurrentModel().vertices.length).toBe(originalCount);
      expect(selectionService.getSelectedIndices()).toEqual([0]);
    });

    it("should clone and move vertex with connecting edge when clone is ON and auto-connect is ON", () => {
      const { appController, modelService, selectionService } = createController();
      appController.selectOrthographicView("+Z");
      appController.enterMode("TRANSLATE");

      // Select vertex 0
      selectionService.selectSingle(0);
      const originalVertex = modelService.getCurrentModel().vertices[0]!;
      const originalCount = modelService.getCurrentModel().vertices.length;

      // Enable clone and enable auto-connect
      appController.toggleClone();
      if (!appController.isAutoConnectEnabled()) {
        appController.toggleAutoConnect();
      }
      expect(appController.isCloneEnabled()).toBe(true);
      expect(appController.isAutoConnectEnabled()).toBe(true);

      appController.beginTranslation();
      appController.applyDragTranslation(new Vector3D(1, 1, 0));

      const updatedModel = modelService.getCurrentModel();
      expect(updatedModel.vertices.length).toBe(originalCount + 1);
      // Original vertex 0 intact
      expect(updatedModel.vertices[0]!.equals(originalVertex)).toBe(true);
      // Cloned vertex translated
      const clonedVertex = updatedModel.vertices[originalCount]!;
      expect(clonedVertex.coordinateX).toBeCloseTo(originalVertex.coordinateX + 1, 4);
      expect(clonedVertex.coordinateY).toBeCloseTo(originalVertex.coordinateY + 1, 4);

      // Connecting edge between original (0) and clone (originalCount)
      expect(updatedModel.explicitEdges).toContainEqual([0, originalCount]);

      appController.endTranslation();

      // Undo reverts both vertex and edge
      appController.undo();
      expect(modelService.getCurrentModel().vertices.length).toBe(originalCount);
      expect(modelService.getCurrentModel().explicitEdges.length).toBe(0);
    });

    it("should ensure deleteSelectedEdges only deletes the edge and leaves selected vertices intact", () => {
      const { appController, modelService, selectionService } = createController();
      const currentModel = modelService.getCurrentModel();

      // Add a standalone explicit edge [0, 6]
      modelService.setCurrentModel(
        new MeshGeometry(currentModel.vertices, currentModel.faces, [[0, 6]])
      );

      // Selecting the edge also selects its vertices [0, 6]
      appController.selectEdge([0, 6]);
      expect(appController.getSelectedEdges()).toEqual([[0, 6]]);
      expect(selectionService.getSelectedIndices()).toEqual([0, 6]);

      const vertexCountBefore = modelService.getCurrentModel().vertices.length;
      const success = appController.deleteSelectedEdges();
      expect(success).toBe(true);

      const modelAfter = modelService.getCurrentModel();
      // Edge is deleted
      expect(modelAfter.explicitEdges.length).toBe(0);
      // All vertices remain intact!
      expect(modelAfter.vertices.length).toBe(vertexCountBefore);
      // Selection cleared
      expect(selectionService.getSelectedIndices()).toEqual([]);
      expect(appController.getSelectedEdges()).toEqual([]);
    });
  });
});


