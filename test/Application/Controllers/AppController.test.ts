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

    // In +Z view (gridPlane = XY): view axis is Z, Z is preserved while X and Y snap
    appController.selectOrthographicView("+Z");
    appController.addVertexAtPosition(new Vector3D(2.1, 3.8, 5.432));
    const addedZVertex = modelService.getCurrentModel().vertices.slice(-1)[0] as Vector3D;
    expect(addedZVertex.coordinateX).toBe(2);
    expect(addedZVertex.coordinateY).toBe(4);
    expect(addedZVertex.coordinateZ).toBe(5.432);

    // In +Y view (gridPlane = XZ): view axis is Y, Y is preserved while X and Z snap
    appController.selectOrthographicView("+Y");
    appController.addVertexAtPosition(new Vector3D(4.2, 7.891, 1.9));
    const addedYVertex = modelService.getCurrentModel().vertices.slice(-1)[0] as Vector3D;
    expect(addedYVertex.coordinateX).toBe(4);
    expect(addedYVertex.coordinateY).toBe(7.891);
    expect(addedYVertex.coordinateZ).toBe(2);

    // In +X view (gridPlane = YZ): view axis is X, X is preserved while Y and Z snap
    appController.selectOrthographicView("+X");
    appController.addVertexAtPosition(new Vector3D(9.123, 2.2, 8.7));
    const addedXVertex = modelService.getCurrentModel().vertices.slice(-1)[0] as Vector3D;
    expect(addedXVertex.coordinateX).toBe(9.123);
    expect(addedXVertex.coordinateY).toBe(2);
    expect(addedXVertex.coordinateZ).toBe(9);
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

    // Drag by small offset (0.2, 0.1, 0) -> candidate stays at integer, effective delta is 0
    appController.applyDragTranslation(new Vector3D(0.2, 0.1, 0));
    expect(modelService.getCurrentModel().vertices[0]?.coordinateX).toBe(
      initialPos.coordinateX
    );

    // Drag past 0.5 threshold (0.8, 1.1, 0) -> candidate snaps to +1 on X, +1 on Y
    appController.applyDragTranslation(new Vector3D(0.8, 1.1, 0));
    expect(modelService.getCurrentModel().vertices[0]?.coordinateX).toBe(
      initialPos.coordinateX + 1
    );
    expect(modelService.getCurrentModel().vertices[0]?.coordinateY).toBe(
      initialPos.coordinateY + 1
    );

    appController.endTranslation();

    // Now test applyDragTranslation with grid snap disabled
    appController.toggleGridSnap();
    appController.beginTranslation();
    appController.applyDragTranslation(new Vector3D(0.35, -0.45, 0));
    const continuousVertex = modelService.getCurrentModel().vertices[0] as Vector3D;
    expect(continuousVertex.coordinateX).toBeCloseTo(
      initialPos.coordinateX + 1 + 0.35,
      5
    );
    expect(continuousVertex.coordinateY).toBeCloseTo(
      initialPos.coordinateY + 1 - 0.45,
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

  it("should re-order face vertices using setFaceFront in face orthographic view and support undo/redo", () => {
    const { appController, modelService, cameraStateService } = createController();

    // Not in face orthographic view returns false
    expect(appController.isFaceOrthographicView()).toBe(false);
    expect(appController.setFaceFront()).toBe(false);

    // Enter face orthographic view on Face 1 (Front: [4, 5, 6, 7])
    appController.setFaceOrthographicView(1);
    expect(appController.isFaceOrthographicView()).toBe(true);

    const initialFace1 = modelService.getCurrentModel().faces[1];
    expect(initialFace1?.vertexIndices).toEqual([4, 5, 6, 7]);

    // Set face front re-orders vertices
    const result = appController.setFaceFront();
    expect(result).toBe(true);

    const updatedFace1 = modelService.getCurrentModel().faces[1];
    expect(updatedFace1?.vertexIndices).toEqual([7, 6, 5, 4]);

    // Undo reverts back to [4, 5, 6, 7]
    appController.undo();
    expect(modelService.getCurrentModel().faces[1]?.vertexIndices).toEqual([4, 5, 6, 7]);

    // Redo re-applies [7, 6, 5, 4]
    appController.redo();
    expect(modelService.getCurrentModel().faces[1]?.vertexIndices).toEqual([7, 6, 5, 4]);

    // When face index becomes invalid or target face is absent
    vi.spyOn(cameraStateService, "getActiveFaceIndex").mockReturnValueOnce(999);
    expect(appController.setFaceFront()).toBe(false);

    vi.spyOn(cameraStateService, "getActiveFaceIndex").mockReturnValueOnce(null);
    expect(appController.setFaceFront()).toBe(false);
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

      // TRANSLATE and ROTATE should succeed
      const translateResult = appController.enterMode("TRANSLATE");
      expect(translateResult).toBe(true);
      expect(appController.getEditorModeService().getMode()).toBe("TRANSLATE");

      const rotateResult = appController.enterMode("ROTATE");
      expect(rotateResult).toBe(true);
      expect(appController.getEditorModeService().getMode()).toBe("ROTATE");
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
      const material = appController.createMaterial();

      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();

      // Assign material to decal
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

      // Translate decal
      appController.beginTranslation();
      appController.applyDragTranslation(new Vector3D(1, 2, 0));
      appController.endTranslation();

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

    it("should allow decal selection only in face orthographic view of its parent face", () => {
      const { appController, cameraStateService } = createController();
      appController.selectFace(0);
      appController.addDecalPlaneToSelectedFace();
      const decal = appController.getSelectedDecal()!;

      expect(appController.isFaceOrthographicViewOf(0)).toBe(true);
      expect(appController.canSelectDecal(decal.id)).toBe(true);

      // Switch to a different view (e.g. +X orthographic)
      appController.selectOrthographicView("+X");
      expect(appController.isDecalSelected()).toBe(false);
      expect(appController.canSelectDecal(decal.id)).toBe(false);

      // Selecting decal while outside parent face orthographic view should fail
      const selectResult = appController.selectDecal(decal.id);
      expect(selectResult).toBe(false);
      expect(appController.isDecalSelected()).toBe(false);

      // Switch back to parent face orthographic view
      appController.setFaceOrthographicView(0);
      expect(appController.canSelectDecal(decal.id)).toBe(true);
      const selectResult2 = appController.selectDecal(decal.id);
      expect(selectResult2).toBe(true);
      expect(appController.isDecalSelected()).toBe(true);

      // Orbiting camera should auto-deselect decal
      appController.rotateCamera(0.2, 0.3);
      expect(cameraStateService.isOrthographic()).toBe(false);
      expect(appController.isDecalSelected()).toBe(false);
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
});

