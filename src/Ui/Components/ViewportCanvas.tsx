import React, { useRef, useEffect } from "react";
import { useAppController } from "../Common/AppContext";
import { ViewportRenderer } from "../Common/ViewportRenderer";
import { ViewportRaycaster } from "../Common/ViewportRaycaster";
import { MeshGeometry } from "../../Application/Services/ModelService/MeshGeometry";
import { Vector3D } from "../../Application/Common/Vector3D";
import { ThemeColors } from "../Common/Theme";

export const ViewportCanvas: React.FC = () => {
  const controller = useAppController();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ViewportRenderer | null>(null);
  const raycasterRef = useRef<ViewportRaycaster>(new ViewportRaycaster());

  const touchDistanceRef = useRef<number | null>(null);
  const touchMidpointRef = useRef<{ x: number; y: number } | null>(null);

  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const lastDragWorldPosRef = useRef<Vector3D | null>(null);
  const dragStartWorldPosRef = useRef<Vector3D | null>(null);
  const clickedVertexOnDownRef = useRef<{
    index: number;
    wasSelected: boolean;
  } | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastDoubleActionTimeRef = useRef<number>(0);
  const pendingErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchDoubleTapRef = useRef<boolean>(false);

  const triggerDoubleActionOrthographicView = (
    clientX?: number,
    clientY?: number
  ) => {
    const currentTime = Date.now();
    if (currentTime - lastDoubleActionTimeRef.current < 250) {
      return;
    }
    lastDoubleActionTimeRef.current = currentTime;

    if (pendingErrorTimerRef.current !== null) {
      clearTimeout(pendingErrorTimerRef.current);
      pendingErrorTimerRef.current = null;
    }

    if (
      clientX !== undefined &&
      clientY !== undefined &&
      rendererRef.current &&
      canvasRef.current
    ) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;
      const camera = rendererRef.current.getActiveCamera();
      const currentModel = controller.getModelService().getCurrentModel();
      const nearestFace = raycasterRef.current.findNearestFace(
        clickX,
        clickY,
        currentModel,
        camera,
        rect.width,
        rect.height
      );

      if (nearestFace !== null) {
        controller.setFaceOrthographicView(nearestFace);
        return;
      }
    }

    controller.switchToClosestOrthographicView();
  };

  // Manage ViewportRenderer lifecycle and domain event subscriptions
  useEffect(() => {
    const targetCanvas = canvasRef.current;
    const targetContainer = containerRef.current;

    if (!targetCanvas || !targetContainer) {
      return;
    }

    const initialWidth = targetContainer.clientWidth || 800;
    const initialHeight = targetContainer.clientHeight || 600;

    const viewportRenderer = new ViewportRenderer(targetCanvas);
    rendererRef.current = viewportRenderer;

    viewportRenderer.resize(initialWidth, initialHeight);
    viewportRenderer.updateMaterials(
      controller.getMaterialService().getMaterials()
    );
    viewportRenderer.updateModel(
      controller.getModelService().getCurrentModel(),
      controller.getMaterialService().getMaterials()
    );
    viewportRenderer.updateRenderMode(
      controller.getRenderModeService().getRenderMode()
    );
    viewportRenderer.updateCamera(
      controller.getCameraStateService(),
      initialWidth,
      initialHeight
    );
    viewportRenderer.updateSelection(
      controller.getSelectionService().getSelectedIndices(),
      controller.getSelectionService().getActiveVertex(),
      controller.getSelectionService().getSelectedFaceIndices()
    );

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const measuredWidth = Math.floor(entry.contentRect.width);
        const measuredHeight = Math.floor(entry.contentRect.height);

        if (measuredWidth > 0 && measuredHeight > 0) {
          viewportRenderer.resize(measuredWidth, measuredHeight);
          viewportRenderer.updateCamera(
            controller.getCameraStateService(),
            measuredWidth,
            measuredHeight
          );
        }
      }
    });
    resizeObserver.observe(targetContainer);

    const unsubscribeModel = controller.getStateNotifier().subscribe(
      "MODEL_CHANGED",
      (payload) => {
        const currentModel =
          payload instanceof MeshGeometry
            ? payload
            : controller.getModelService().getCurrentModel();
        viewportRenderer.updateModel(
          currentModel,
          controller.getMaterialService().getMaterials()
        );
      }
    );

    const unsubscribeMaterials = controller.getStateNotifier().subscribe(
      "MATERIALS_CHANGED",
      () => {
        viewportRenderer.updateMaterials(
          controller.getMaterialService().getMaterials()
        );
      }
    );

    const unsubscribeRenderMode = controller.getStateNotifier().subscribe(
      "RENDER_MODE_CHANGED",
      () => {
        viewportRenderer.updateRenderMode(
          controller.getRenderModeService().getRenderMode()
        );
      }
    );

    const unsubscribeView = controller.getStateNotifier().subscribe(
      "VIEW_CHANGED",
      () => {
        const currentWidth = targetContainer.clientWidth || 800;
        const currentHeight = targetContainer.clientHeight || 600;
        viewportRenderer.updateCamera(
          controller.getCameraStateService(),
          currentWidth,
          currentHeight
        );
      }
    );

    const unsubscribeSelection = controller.getStateNotifier().subscribe(
      "SELECTION_CHANGED",
      (payload) => {
        const selectedFaceIndices =
          payload &&
          typeof payload === "object" &&
          "selectedFaceIndices" in payload
            ? (payload as { selectedFaceIndices: readonly number[] })
                .selectedFaceIndices
            : controller.getSelectionService().getSelectedFaceIndices();
        viewportRenderer.updateSelection(
          controller.getSelectionService().getSelectedIndices(),
          controller.getSelectionService().getActiveVertex(),
          selectedFaceIndices
        );
      }
    );

    return () => {
      if (pendingErrorTimerRef.current !== null) {
        clearTimeout(pendingErrorTimerRef.current);
        pendingErrorTimerRef.current = null;
      }
      unsubscribeModel();
      unsubscribeMaterials();
      unsubscribeRenderMode();
      unsubscribeView();
      unsubscribeSelection();
      resizeObserver.disconnect();
      viewportRenderer.dispose();
      rendererRef.current = null;
    };
  }, [controller]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      controller.zoomIn();
    } else if (event.deltaY > 0) {
      controller.zoomOut();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      if (touch1 && touch2) {
        touchDistanceRef.current = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        touchMidpointRef.current = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
      }
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (
      event.touches.length === 2 &&
      touchDistanceRef.current !== null &&
      touchMidpointRef.current !== null
    ) {
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      if (touch1 && touch2) {
        const currentDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        const currentMidpoint = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        const distanceDifference = currentDistance - touchDistanceRef.current;
        const deltaMidpointX = currentMidpoint.x - touchMidpointRef.current.x;
        const deltaMidpointY = currentMidpoint.y - touchMidpointRef.current.y;

        // Check pinch zoom threshold
        if (Math.abs(distanceDifference) > 15) {
          if (distanceDifference > 0) {
            controller.zoomIn();
          } else {
            controller.zoomOut();
          }
          touchDistanceRef.current = currentDistance;
        } else if (Math.hypot(deltaMidpointX, deltaMidpointY) > 3) {
          // Double finger drag pan
          const container = containerRef.current;
          const containerHeight = container ? container.clientHeight : 600;
          const cameraDistance = controller.getCameraStateService().getCameraDistance();
          const panFactor = cameraDistance / containerHeight;

          controller.panCamera(-deltaMidpointX * panFactor, deltaMidpointY * panFactor);
          touchMidpointRef.current = currentMidpoint;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
    touchMidpointRef.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.isPrimary === false) {
      return;
    }

    try {
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Ignored if capture unsupported
    }

    if (event.pointerType === "touch") {
      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - lastTapTimeRef.current;
      const distanceFromLastTap = Math.hypot(
        event.clientX - lastTapPosRef.current.x,
        event.clientY - lastTapPosRef.current.y
      );

      if (
        timeSinceLastTap > 0 &&
        timeSinceLastTap < 300 &&
        distanceFromLastTap < 25
      ) {
        lastTapTimeRef.current = 0;
        isTouchDoubleTapRef.current = true;
        triggerDoubleActionOrthographicView(event.clientX, event.clientY);
      } else {
        isTouchDoubleTapRef.current = false;
        lastTapTimeRef.current = currentTime;
        lastTapPosRef.current = { x: event.clientX, y: event.clientY };
      }
    }

    pointerDownPosRef.current = { x: event.clientX, y: event.clientY };
    lastPointerPosRef.current = { x: event.clientX, y: event.clientY };
    isDraggingRef.current = false;
    clickedVertexOnDownRef.current = null;
    lastDragWorldPosRef.current = null;

    if (!rendererRef.current || !canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const camera = rendererRef.current.getActiveCamera();
    const currentModel = controller.getModelService().getCurrentModel();
    const currentMode = controller.getEditorModeService().getMode();

    const nearestVertex = raycasterRef.current.findNearestVertex(
      clickX,
      clickY,
      currentModel.vertices,
      camera,
      rect.width,
      rect.height
    );

    if (nearestVertex !== null) {
      const wasSelected = controller
        .getSelectionService()
        .isSelected(nearestVertex);
      clickedVertexOnDownRef.current = { index: nearestVertex, wasSelected };

      if (currentMode === "TRANSLATE") {
        if (!wasSelected) {
          controller.selectSingleVertex(nearestVertex);
        }
        controller.beginTranslation();
        const gridPlane = controller
          .getCameraStateService()
          .getActiveStrategy()
          .getGridPlane();
        const targetPoint = controller.getCameraStateService().getTargetPoint();
        const startWorldPos = raycasterRef.current.unprojectToGridPlane(
          clickX,
          clickY,
          camera,
          gridPlane,
          rect.width,
          rect.height,
          targetPoint
        );
        lastDragWorldPosRef.current = startWorldPos;
        dragStartWorldPosRef.current = startWorldPos;
      }
    } else if (currentMode === "TRANSLATE") {
      if (controller.getSelectionService().getSelectedIndices().length > 0) {
        controller.beginTranslation();
        const gridPlane = controller
          .getCameraStateService()
          .getActiveStrategy()
          .getGridPlane();
        const targetPoint = controller.getCameraStateService().getTargetPoint();
        const startWorldPos = raycasterRef.current.unprojectToGridPlane(
          clickX,
          clickY,
          camera,
          gridPlane,
          rect.width,
          rect.height,
          targetPoint
        );
        lastDragWorldPosRef.current = startWorldPos;
        dragStartWorldPosRef.current = startWorldPos;
      }
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerDownPosRef.current) {
      return;
    }

    const totalDeltaX = event.clientX - pointerDownPosRef.current.x;
    const totalDeltaY = event.clientY - pointerDownPosRef.current.y;
    if (Math.hypot(totalDeltaX, totalDeltaY) > 5) {
      isDraggingRef.current = true;
    }

    const currentMode = controller.getEditorModeService().getMode();
    if (currentMode === "TRANSLATE" && dragStartWorldPosRef.current) {
      if (
        isDraggingRef.current &&
        rendererRef.current &&
        canvasRef.current
      ) {
        const rect = canvasRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        const camera = rendererRef.current.getActiveCamera();
        const gridPlane = controller
          .getCameraStateService()
          .getActiveStrategy()
          .getGridPlane();
        const targetPoint = controller.getCameraStateService().getTargetPoint();

        const currentWorldPos = raycasterRef.current.unprojectToGridPlane(
          clickX,
          clickY,
          camera,
          gridPlane,
          rect.width,
          rect.height,
          targetPoint
        );

        if (currentWorldPos) {
          const totalDragDelta = currentWorldPos.subtract(
            dragStartWorldPosRef.current
          );
          controller.applyDragTranslation(totalDragDelta);
          lastDragWorldPosRef.current = currentWorldPos;
        }
      }
    } else if (isDraggingRef.current) {
      const deltaPixelX = event.clientX - lastPointerPosRef.current.x;
      const deltaPixelY = event.clientY - lastPointerPosRef.current.y;

      const orbitSensitivity = 0.008;
      controller.rotateCamera(
        -deltaPixelX * orbitSensitivity,
        deltaPixelY * orbitSensitivity
      );
    }

    lastPointerPosRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignored
    }

    if (isTouchDoubleTapRef.current) {
      isTouchDoubleTapRef.current = false;
      pointerDownPosRef.current = null;
      isDraggingRef.current = false;
      return;
    }

    const wasDragging = isDraggingRef.current;
    const clickedVertexInfo = clickedVertexOnDownRef.current;

    const currentMode = controller.getEditorModeService().getMode();
    if (currentMode === "TRANSLATE") {
      controller.endTranslation();
    }

    pointerDownPosRef.current = null;
    isDraggingRef.current = false;
    lastDragWorldPosRef.current = null;
    dragStartWorldPosRef.current = null;
    clickedVertexOnDownRef.current = null;

    if (wasDragging) {
      return;
    }

    // Tap / Click handling based on active UI Mode
    if (!rendererRef.current || !canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    const camera = rendererRef.current.getActiveCamera();
    const currentModel = controller.getModelService().getCurrentModel();
    const mode = controller.getEditorModeService().getMode();

    if (mode === "TRANSLATE") {
      if (clickedVertexInfo && clickedVertexInfo.wasSelected) {
        controller.selectSingleVertex(clickedVertexInfo.index);
      } else if (!clickedVertexInfo) {
        const nearestFace = raycasterRef.current.findNearestFace(
          clickX,
          clickY,
          currentModel,
          camera,
          width,
          height
        );
        if (nearestFace !== null) {
          controller.selectFace(nearestFace);
        }
      }
      return;
    }

    if (mode === "DEFAULT") {
      const nearestVertex = raycasterRef.current.findNearestVertex(
        clickX,
        clickY,
        currentModel.vertices,
        camera,
        width,
        height
      );
      if (nearestVertex !== null) {
        controller.selectSingleVertex(nearestVertex);
      } else {
        const nearestFace = raycasterRef.current.findNearestFace(
          clickX,
          clickY,
          currentModel,
          camera,
          width,
          height
        );
        if (nearestFace !== null) {
          controller.selectFace(nearestFace);
        } else {
          controller.clearSelection();
        }
      }
    } else if (mode === "MULTI_SELECT") {
      const nearestVertex = raycasterRef.current.findNearestVertex(
        clickX,
        clickY,
        currentModel.vertices,
        camera,
        width,
        height
      );
      if (nearestVertex !== null) {
        controller.toggleVertexSelection(nearestVertex);
      } else {
        const nearestFace = raycasterRef.current.findNearestFace(
          clickX,
          clickY,
          currentModel,
          camera,
          width,
          height
        );
        if (nearestFace !== null) {
          controller.selectFace(nearestFace);
        }
      }
    } else if (mode === "INSERT") {
      const nearestVertex = raycasterRef.current.findNearestVertex(
        clickX,
        clickY,
        currentModel.vertices,
        camera,
        width,
        height
      );
      if (nearestVertex !== null) {
        const activeVertex = controller
          .getSelectionService()
          .getActiveVertex();
        const isAutoConnect = controller.isAutoConnectEnabled();

        if (
          isAutoConnect &&
          activeVertex !== null &&
          activeVertex !== nearestVertex
        ) {
          controller.connectVertices(activeVertex, nearestVertex);
        } else {
          controller.selectSingleVertex(nearestVertex);
        }
      } else {
        const nearestEdge = raycasterRef.current.findNearestEdge(
          clickX,
          clickY,
          currentModel.getWireframeEdges(),
          currentModel.vertices,
          camera,
          width,
          height
        );
        if (nearestEdge) {
          controller.insertVertexOnEdge(nearestEdge[0], nearestEdge[1]);
        } else {
          const isOrthographic = controller.getCameraStateService().isOrthographic();
          if (!isOrthographic) {
            if (pendingErrorTimerRef.current !== null) {
              clearTimeout(pendingErrorTimerRef.current);
            }
            pendingErrorTimerRef.current = setTimeout(() => {
              pendingErrorTimerRef.current = null;
              controller.getStateNotifier().notify(
                "ERROR_OCCURRED",
                "Switch to an Orthographic view"
              );
            }, 300);
          } else {
            const gridPlane = controller
              .getCameraStateService()
              .getActiveStrategy()
              .getGridPlane();
            const planeAnchor = controller.getPlacementPlaneAnchor();
            const worldPos = raycasterRef.current.unprojectToGridPlane(
              clickX,
              clickY,
              camera,
              gridPlane,
              width,
              height,
              planeAnchor
            );
            if (worldPos) {
              controller.addVertexAtPosition(worldPos);
            }
          }
        }
      }
    } else if (mode === "FILL") {
      const nearestVertex = raycasterRef.current.findNearestVertex(
        clickX,
        clickY,
        currentModel.vertices,
        camera,
        width,
        height
      );
      if (nearestVertex !== null) {
        const activeVertex = controller
          .getSelectionService()
          .getActiveVertex();
        if (activeVertex !== null && activeVertex !== nearestVertex) {
          controller.connectVertices(activeVertex, nearestVertex);
        } else {
          controller.selectSingleVertex(nearestVertex);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="viewport-canvas-container"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        flex: 1,
        width: "100%",
        height: "calc(100vh - 48px)",
        position: "relative",
        backgroundColor: ThemeColors.viewportBackground,
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid="viewport-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={(event) =>
          triggerDoubleActionOrthographicView(event.clientX, event.clientY)
        }
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor:
            controller.getEditorModeService().getMode() === "TRANSLATE"
              ? "grab"
              : "crosshair",
        }}
      />
    </div>
  );
};
