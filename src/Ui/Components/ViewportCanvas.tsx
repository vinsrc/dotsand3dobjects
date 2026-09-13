import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { ViewportRenderer } from "../Common/ViewportRenderer";
import { ViewportRaycaster } from "../Common/ViewportRaycaster";
import { Vector3D } from "../../Application/Common/Vector3D";
import { MeshGeometry } from "../../Application/Services/ModelService/MeshGeometry";
import { ThemeColors } from "../Common/Theme";
import { RotateOverlay } from "./RotateOverlay";
import { ScaleOverlay } from "./ScaleOverlay";
import { TransformOverlay } from "./TransformOverlay";
import { TransformDimensionDialog } from "./TransformDimensionDialog";

const calculatePanFactor = (
  cameraDistance: number,
  containerHeight: number,
  isOrthographic: boolean
): number => {
  const safeHeight = containerHeight > 0 ? containerHeight : 600;
  if (isOrthographic) {
    return cameraDistance / safeHeight;
  }
  return (2 * cameraDistance * Math.tan((45 * Math.PI / 180) / 2)) / safeHeight;
};

export const ViewportCanvas: React.FC = () => {
  const controller = useAppController();
  useApplicationState([
    "MODE_CHANGED",
    "VIEW_CHANGED",
    "MODEL_CHANGED",
    "DECALS_CHANGED",
  ]);

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
  const dragCenterScreenPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartAngleRef = useRef<number>(0);
  const dragStartDistanceRef = useRef<number>(1);
  const clickedVertexOnDownRef = useRef<{
    index: number;
    wasSelected: boolean;
  } | null>(null);
  const isRightClickPanningRef = useRef<boolean>(false);
  const lastMultiTouchTimeRef = useRef<number>(0);
  const pendingErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const findHitDecal = (clickX: number, clickY: number): string | null => {
    if (!rendererRef.current || !canvasRef.current) {
      return null;
    }
    const decalMeshes = rendererRef.current.getDecalMeshes();
    if (decalMeshes.length === 0) {
      return null;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    const normalizedX = (clickX / rect.width) * 2 - 1;
    const normalizedY = -(clickY / rect.height) * 2 + 1;
    const camera = rendererRef.current.getActiveCamera();
    const threeRaycaster = new THREE.Raycaster();
    threeRaycaster.setFromCamera(
      new THREE.Vector2(normalizedX, normalizedY),
      camera
    );
    const intersects = threeRaycaster.intersectObjects(
      decalMeshes as THREE.Mesh[],
      false
    );
    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit?.object?.userData?.decalId) {
        return hit.object.userData.decalId as string;
      }
    }
    return null;
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

    const viewportRenderer = new ViewportRenderer(
      targetCanvas,
      controller.getEdgeLineWidth()
    );
    rendererRef.current = viewportRenderer;
    (targetCanvas as unknown as {
      __appController?: typeof controller;
      __viewportRenderer?: ViewportRenderer;
    }).__appController = controller;
    (targetCanvas as unknown as {
      __appController?: typeof controller;
      __viewportRenderer?: ViewportRenderer;
    }).__viewportRenderer = viewportRenderer;

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
    viewportRenderer.updateDecals(
      controller.getDecals(),
      controller.getSelectedDecalId(),
      controller.getMaterialService().getMaterials()
    );
    viewportRenderer.updateSelection(
      controller.getSelectionService().getSelectedIndices(),
      controller.getSelectionService().getActiveVertex(),
      controller.getSelectionService().getSelectedFaceIndices(),
      controller.getVisibleVertexIndices(),
      controller.getSelectedEdges()
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
            measuredHeight,
            controller.getVisibleVertexIndices()
          );
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    const unsubscribeModel = controller.getStateNotifier().subscribe(
      "MODEL_CHANGED",
      (payload) => {
        const currentModel =
          payload instanceof MeshGeometry
            ? payload
            : controller.getModelService().getCurrentModel();
        viewportRenderer.updateModel(
          currentModel,
          controller.getMaterialService().getMaterials(),
          controller.getVisibleVertexIndices()
        );
      }
    );

    const unsubscribeMaterials = controller.getStateNotifier().subscribe(
      "MATERIALS_CHANGED",
      () => {
        viewportRenderer.updateMaterials(
          controller.getMaterialService().getMaterials()
        );
        viewportRenderer.updateDecals(
          controller.getDecals(),
          controller.getSelectedDecalId(),
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
          currentHeight,
          controller.getVisibleVertexIndices()
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
        const selectedEdges =
          payload &&
          typeof payload === "object" &&
          "selectedEdges" in payload
            ? (payload as { selectedEdges: readonly [number, number][] })
                .selectedEdges
            : controller.getSelectedEdges();
        viewportRenderer.updateSelection(
          controller.getSelectionService().getSelectedIndices(),
          controller.getSelectionService().getActiveVertex(),
          selectedFaceIndices,
          controller.getVisibleVertexIndices(),
          selectedEdges
        );
      }
    );

    const unsubscribeDecals = controller.getStateNotifier().subscribe(
      "DECALS_CHANGED",
      () => {
        viewportRenderer.updateDecals(
          controller.getDecals(),
          controller.getSelectedDecalId(),
          controller.getMaterialService().getMaterials()
        );
      }
    );

    const unsubscribeUiCustomization = controller.getStateNotifier().subscribe(
      "UI_CUSTOMIZATION_CHANGED",
      () => {
        viewportRenderer.setEdgeLineWidth(controller.getEdgeLineWidth());
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
      unsubscribeDecals();
      unsubscribeUiCustomization();
      delete (targetCanvas as unknown as { __viewportRenderer?: ViewportRenderer }).__viewportRenderer;
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
      lastMultiTouchTimeRef.current = Date.now();
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
        isDraggingRef.current = false;
        pointerDownPosRef.current = null;
        dragStartWorldPosRef.current = null;
        lastDragWorldPosRef.current = null;
      }
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (
      event.touches.length === 2 &&
      touchDistanceRef.current !== null &&
      touchMidpointRef.current !== null
    ) {
      lastMultiTouchTimeRef.current = Date.now();
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
          touchMidpointRef.current = currentMidpoint;
        } else if (Math.hypot(deltaMidpointX, deltaMidpointY) > 3) {
          // Double finger drag pan
          const container = containerRef.current;
          const containerHeight = container ? container.clientHeight : 600;
          const cameraService = controller.getCameraStateService();
          const panFactor = calculatePanFactor(
            cameraService.getCameraDistance(),
            containerHeight,
            cameraService.isOrthographic()
          );

          controller.panCamera(deltaMidpointX * panFactor, deltaMidpointY * panFactor);
          touchMidpointRef.current = currentMidpoint;
          touchDistanceRef.current = currentDistance;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    lastMultiTouchTimeRef.current = Date.now();
    touchDistanceRef.current = null;
    touchMidpointRef.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.isPrimary === false) {
      return;
    }

    // Right-click drag pan on desktop
    if (event.button === 2) {
      try {
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        // Ignored if capture unsupported
      }
      isRightClickPanningRef.current = true;
      pointerDownPosRef.current = { x: event.clientX, y: event.clientY };
      lastPointerPosRef.current = { x: event.clientX, y: event.clientY };
      return;
    }

    if (event.button !== 0) {
      return;
    }

    try {
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Ignored if capture unsupported
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
    const hitDecalId = findHitDecal(clickX, clickY);

    const nearestVertex = raycasterRef.current.findNearestVertex(
      clickX,
      clickY,
      currentModel.vertices,
      camera,
      rect.width,
      rect.height,
      25,
      controller.getVisibleVertexIndices()
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
      if (
        controller.getSelectionService().getSelectedIndices().length > 0
      ) {
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
    } else if (currentMode === "ROTATE") {
      if (hitDecalId !== null && controller.getSelectedDecalId() !== hitDecalId) {
        controller.selectDecal(hitDecalId);
      }
      controller.beginRotation();
      const center = controller.isDecalSelected()
        ? (controller.getSelectedDecal()?.center ?? currentModel.calculateCenter())
        : currentModel.calculateCenter();
      const proj = new THREE.Vector3(
        center.coordinateX,
        center.coordinateY,
        center.coordinateZ
      );
      proj.project(camera);
      const screenCenterX = (proj.x * 0.5 + 0.5) * rect.width;
      const screenCenterY = (-proj.y * 0.5 + 0.5) * rect.height;
      dragCenterScreenPosRef.current = { x: screenCenterX, y: screenCenterY };
      dragStartAngleRef.current = Math.atan2(
        clickY - screenCenterY,
        clickX - screenCenterX
      );
    } else if (currentMode === "SCALE") {
      if (hitDecalId !== null && controller.getSelectedDecalId() !== hitDecalId) {
        controller.selectDecal(hitDecalId);
      }
      controller.beginScaling();
      const center = controller.isDecalSelected()
        ? (controller.getSelectedDecal()?.center ?? currentModel.calculateCenter())
        : currentModel.calculateCenter();
      const proj = new THREE.Vector3(
        center.coordinateX,
        center.coordinateY,
        center.coordinateZ
      );
      proj.project(camera);
      const screenCenterX = (proj.x * 0.5 + 0.5) * rect.width;
      const screenCenterY = (-proj.y * 0.5 + 0.5) * rect.height;
      dragCenterScreenPosRef.current = { x: screenCenterX, y: screenCenterY };
      const initialDistance = Math.hypot(
        clickX - screenCenterX,
        clickY - screenCenterY
      );
      dragStartDistanceRef.current = Math.max(initialDistance, 10);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    // Desktop right-click drag pan
    if (isRightClickPanningRef.current) {
      if ((event.buttons & 2) === 0) {
        isRightClickPanningRef.current = false;
        pointerDownPosRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      const deltaPixelX = event.clientX - lastPointerPosRef.current.x;
      const deltaPixelY = event.clientY - lastPointerPosRef.current.y;
      lastPointerPosRef.current = {
        x: event.clientX,
        y: event.clientY,
      };

      if (deltaPixelX !== 0 || deltaPixelY !== 0) {
        const container = containerRef.current;
        const containerHeight = container ? container.clientHeight : 600;
        const cameraService = controller.getCameraStateService();
        const panFactor = calculatePanFactor(
          cameraService.getCameraDistance(),
          containerHeight,
          cameraService.isOrthographic()
        );

        controller.panCamera(deltaPixelX * panFactor, deltaPixelY * panFactor);
      }
      return;
    }

    // If two-finger gesture is currently or recently active, ignore single-pointer drag
    if (
      event.pointerType === "touch" &&
      (touchDistanceRef.current !== null || Date.now() - lastMultiTouchTimeRef.current < 350)
    ) {
      return;
    }

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
    } else if (currentMode === "ROTATE" && dragCenterScreenPosRef.current) {
      if (isDraggingRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;
        const currentAngle = Math.atan2(
          currentY - dragCenterScreenPosRef.current.y,
          currentX - dragCenterScreenPosRef.current.x
        );
        const deltaAngle = currentAngle - dragStartAngleRef.current;
        controller.applyDragRotation(-deltaAngle);
      }
    } else if (currentMode === "SCALE" && dragCenterScreenPosRef.current) {
      if (isDraggingRef.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;
        const currentDist = Math.hypot(
          currentX - dragCenterScreenPosRef.current.x,
          currentY - dragCenterScreenPosRef.current.y
        );
        const scaleFactor = currentDist / dragStartDistanceRef.current;
        controller.applyDragScaling(scaleFactor);
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

  const resetDragSession = () => {
    const currentMode = controller.getEditorModeService().getMode();
    if (currentMode === "TRANSLATE") {
      controller.endTranslation();
    } else if (currentMode === "ROTATE") {
      controller.endRotation();
    } else if (currentMode === "SCALE") {
      controller.endScaling();
    }

    pointerDownPosRef.current = null;
    isDraggingRef.current = false;
    lastDragWorldPosRef.current = null;
    dragStartWorldPosRef.current = null;
    dragCenterScreenPosRef.current = null;
    clickedVertexOnDownRef.current = null;
  };

  const handlePointerCancel = () => {
    isRightClickPanningRef.current = false;
    resetDragSession();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignored
    }

    if (isRightClickPanningRef.current || event.button === 2) {
      isRightClickPanningRef.current = false;
      resetDragSession();
      return;
    }

    // Suppress tap/click if pointerDown was cleared (e.g. multi-touch) or recent two-finger gesture (< 350ms)
    const isRecentMultiTouch = Date.now() - lastMultiTouchTimeRef.current < 350;
    if (!pointerDownPosRef.current || isRecentMultiTouch) {
      resetDragSession();
      return;
    }

    const wasDragging = isDraggingRef.current;
    const clickedVertexInfo = clickedVertexOnDownRef.current;
    resetDragSession();

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
    const hitDecalId = findHitDecal(clickX, clickY);

    const handleDecalTap = (decalId: string): boolean => {
      const decal = controller.getDecalService().getDecal(decalId);
      if (!decal) {
        return false;
      }
      if (controller.isFaceOrthographicViewOf(decal.parentFaceIndex)) {
        controller.selectDecal(decalId);
      } else {
        controller.selectFace(decal.parentFaceIndex);
      }
      return true;
    };

    if (hitDecalId !== null) {
      handleDecalTap(hitDecalId);
      return;
    }

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
      const visibleVertexIndices = controller.getVisibleVertexIndices();
      const nearestVertex = raycasterRef.current.findNearestVertex(
        clickX,
        clickY,
        currentModel.vertices,
        camera,
        width,
        height,
        25,
        visibleVertexIndices
      );
      if (nearestVertex !== null) {
        controller.selectSingleVertex(nearestVertex);
      } else {
        const nearestEdge = raycasterRef.current.findNearestEdge(
          clickX,
          clickY,
          currentModel.getWireframeEdges(),
          currentModel.vertices,
          camera,
          width,
          height,
          15
        );
        if (nearestEdge !== null) {
          controller.selectEdge(nearestEdge);
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
      }
    } else if (mode === "MULTI_SELECT") {
      const visibleVertexIndices = controller.getVisibleVertexIndices();
      const nearestVertex = raycasterRef.current.findNearestVertex(
        clickX,
        clickY,
        currentModel.vertices,
        camera,
        width,
        height,
        25,
        visibleVertexIndices
      );
      if (nearestVertex !== null) {
        controller.toggleVertexSelection(nearestVertex);
      } else {
        const nearestEdge = raycasterRef.current.findNearestEdge(
          clickX,
          clickY,
          currentModel.getWireframeEdges(),
          currentModel.vertices,
          camera,
          width,
          height,
          15
        );
        if (nearestEdge !== null) {
          controller.toggleEdgeSelection(nearestEdge);
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
      }
    } else if (mode === "INSERT") {
      const visibleVertexIndices = controller.getVisibleVertexIndices();
      const nearestVertex = raycasterRef.current.findNearestVertex(
        clickX,
        clickY,
        currentModel.vertices,
        camera,
        width,
        height,
        25,
        visibleVertexIndices
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
        let edgesToSearch = currentModel.getWireframeEdges();
        if (visibleVertexIndices !== null) {
          const visibleSet = new Set(visibleVertexIndices);
          edgesToSearch = edgesToSearch.filter(
            ([start, end]) => visibleSet.has(start) && visibleSet.has(end)
          );
        }
        const nearestEdge = raycasterRef.current.findNearestEdge(
          clickX,
          clickY,
          edgesToSearch,
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
      const visibleVertexIndices = controller.getVisibleVertexIndices();
      const nearestVertex = raycasterRef.current.findNearestVertex(
        clickX,
        clickY,
        currentModel.vertices,
        camera,
        width,
        height,
        25,
        visibleVertexIndices
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
      onTouchCancel={handleTouchEnd}
      onContextMenu={(event) => event.preventDefault()}
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
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
        onContextMenu={(event) => event.preventDefault()}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor:
            controller.getEditorModeService().getMode() === "TRANSLATE" ||
            controller.getEditorModeService().getMode() === "ROTATE"
              ? "grab"
              : controller.getEditorModeService().getMode() === "SCALE"
              ? "nwse-resize"
              : controller.getEditorModeService().getMode() === "TRANSFORM"
              ? "default"
              : "crosshair",
        }}
      />
      {controller.getEditorModeService().getMode() === "TRANSFORM" &&
        controller.getCameraStateService().isOrthographic() && (
          <>
            <TransformOverlay
              controller={controller}
              canvasElement={canvasRef.current}
              getActiveCamera={() =>
                rendererRef.current?.getActiveCamera() ?? null
              }
            />
            <TransformDimensionDialog />
          </>
        )}
      {controller.getEditorModeService().getMode() === "ROTATE" &&
        controller.getCameraStateService().isOrthographic() && (
          <RotateOverlay
            controller={controller}
            canvasElement={canvasRef.current}
            getActiveCamera={() =>
              rendererRef.current?.getActiveCamera() ?? null
            }
          />
        )}
      {controller.getEditorModeService().getMode() === "SCALE" &&
        controller.getCameraStateService().isOrthographic() && (
          <ScaleOverlay
            controller={controller}
            canvasElement={canvasRef.current}
            getActiveCamera={() =>
              rendererRef.current?.getActiveCamera() ?? null
            }
          />
        )}
    </div>
  );
};
