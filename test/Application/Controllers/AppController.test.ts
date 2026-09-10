import { describe, it, expect, vi } from "vitest";
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
    const undoRedoService = new UndoRedoService(stateNotifier);

    const appController = new AppController(
      modelService,
      cameraStateService,
      renderModeService,
      editorModeService,
      selectionService,
      geometryEditorService,
      undoRedoService,
      stateNotifier
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
      undoRedoService,
      stateNotifier,
    } = createController();

    expect(appController.getModelService()).toBe(modelService);
    expect(appController.getCameraStateService()).toBe(cameraStateService);
    expect(appController.getRenderModeService()).toBe(renderModeService);
    expect(appController.getEditorModeService()).toBe(editorModeService);
    expect(appController.getSelectionService()).toBe(selectionService);
    expect(appController.getGeometryEditorService()).toBe(geometryEditorService);
    expect(appController.getUndoRedoService()).toBe(undoRedoService);
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

  it("should return false when createFaceFromSelectedVertices called with invalid selection count", () => {
    const { appController, modelService, selectionService } =
      createController();
    const initialFaceCount = modelService.getCurrentModel().getFaceCount();

    selectionService.restoreSelection([0, 1], 1);
    expect(appController.createFaceFromSelectedVertices()).toBe(false);
    expect(modelService.getCurrentModel().getFaceCount()).toBe(initialFaceCount);

    selectionService.restoreSelection([0, 1, 2, 3, 4], 4);
    expect(appController.createFaceFromSelectedVertices()).toBe(false);
    expect(modelService.getCurrentModel().getFaceCount()).toBe(initialFaceCount);
  });
});
