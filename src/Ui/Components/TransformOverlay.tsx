import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { AppController } from "../../Application/Controllers/AppController";
import { ThemeColors } from "../Common/Theme";
import { Vector3D } from "../../Application/Common/Vector3D";
import { ViewportRaycaster } from "../Common/ViewportRaycaster";

export interface TransformOverlayProps {
  readonly controller: AppController;
  readonly canvasElement: HTMLCanvasElement | null;
  readonly getActiveCamera: () => THREE.Camera | null;
}

interface BoundaryBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly centerX: number;
  readonly centerY: number;
}

type DragMode = "scale" | "rotate" | "translate" | null;

export const TransformOverlay: React.FC<TransformOverlayProps> = ({
  controller,
  canvasElement,
  getActiveCamera,
}) => {
  const [boundary, setBoundary] = useState<BoundaryBox | null>(null);
  const dragModeRef = useRef<DragMode>(null);

  // Rotate drag state
  const dragStartAngleRef = useRef<number>(0);

  // Scale drag state
  const dragStartDistanceRef = useRef<number>(1);
  const dragCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Translate drag state
  const raycasterRef = useRef<ViewportRaycaster>(new ViewportRaycaster());
  const dragStartWorldPosRef = useRef<Vector3D>(new Vector3D(0, 0, 0));

  const calculateBoundary = (): BoundaryBox | null => {
    if (!canvasElement) {
      return null;
    }

    const camera = getActiveCamera();
    if (!camera || !(camera instanceof THREE.OrthographicCamera)) {
      return null;
    }

    let verticesToProject: readonly Vector3D[] = [];
    if (controller.isDecalSelected()) {
      const selectedDecal = controller.getSelectedDecal();
      if (!selectedDecal) {
        return null;
      }
      verticesToProject = selectedDecal.vertices;
    } else {
      const currentModel = controller.getModelService().getCurrentModel();
      if (currentModel.isEmpty()) {
        return null;
      }
      verticesToProject = currentModel.vertices;
    }

    const width = canvasElement.clientWidth;
    const height = canvasElement.clientHeight;
    if (width <= 0 || height <= 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const projectionVector = new THREE.Vector3();
    for (const currentVertex of verticesToProject) {
      projectionVector.set(
        currentVertex.coordinateX,
        currentVertex.coordinateY,
        currentVertex.coordinateZ
      );
      projectionVector.project(camera);

      const screenX = (projectionVector.x * 0.5 + 0.5) * width;
      const screenY = (-projectionVector.y * 0.5 + 0.5) * height;

      if (screenX < minX) minX = screenX;
      if (screenX > maxX) maxX = screenX;
      if (screenY < minY) minY = screenY;
      if (screenY > maxY) maxY = screenY;
    }

    if (!isFinite(minX) || !isFinite(minY)) {
      return null;
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  };

  useEffect(() => {
    setBoundary(calculateBoundary());

    const updateHandler = () => {
      setBoundary(calculateBoundary());
    };

    const notifier = controller.getStateNotifier();
    const unsubModel = notifier.subscribe("MODEL_CHANGED", updateHandler);
    const unsubView = notifier.subscribe("VIEW_CHANGED", updateHandler);
    const unsubMode = notifier.subscribe("MODE_CHANGED", updateHandler);
    const unsubDecals = notifier.subscribe("DECALS_CHANGED", updateHandler);
    const unsubSelection = notifier.subscribe("SELECTION_CHANGED", updateHandler);

    return () => {
      unsubModel();
      unsubView();
      unsubMode();
      unsubDecals();
      unsubSelection();
    };
  }, [canvasElement, controller]);

  if (!boundary) {
    return null;
  }

  const padding = 16;
  const boxLeft = boundary.minX - padding;
  const boxTop = boundary.minY - padding;
  const boxWidth = Math.max(boundary.maxX - boundary.minX + padding * 2, 20);
  const boxHeight = Math.max(boundary.maxY - boundary.minY + padding * 2, 20);

  // --- Scale Handlers ---
  const handleScalePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    event.preventDefault();
    try {
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Ignored
    }

    if (!canvasElement) return;
    const rect = canvasElement.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    dragModeRef.current = "scale";
    dragCenterRef.current = { x: boundary.centerX, y: boundary.centerY };
    const initialDistance = Math.hypot(
      pointerX - boundary.centerX,
      pointerY - boundary.centerY
    );
    dragStartDistanceRef.current = Math.max(initialDistance, 10);
    controller.beginScaling();
  };

  const handleScalePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (dragModeRef.current !== "scale" || !canvasElement) return;
    event.stopPropagation();
    event.preventDefault();

    const rect = canvasElement.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    const currentDistance = Math.hypot(
      pointerX - dragCenterRef.current.x,
      pointerY - dragCenterRef.current.y
    );
    const scaleFactor = currentDistance / dragStartDistanceRef.current;
    controller.applyDragScaling(scaleFactor);
  };

  const handleScalePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (dragModeRef.current !== "scale") return;
    event.stopPropagation();
    event.preventDefault();
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignored
    }
    dragModeRef.current = null;
    controller.endScaling();
    setBoundary(calculateBoundary());
  };

  // --- Rotate Handlers ---
  const handleRotatePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    event.preventDefault();
    try {
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Ignored
    }

    if (!canvasElement) return;
    const rect = canvasElement.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    dragModeRef.current = "rotate";
    dragStartAngleRef.current = Math.atan2(
      pointerY - boundary.centerY,
      pointerX - boundary.centerX
    );
    controller.beginRotation();
  };

  const handleRotatePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (dragModeRef.current !== "rotate" || !canvasElement) return;
    event.stopPropagation();
    event.preventDefault();

    const rect = canvasElement.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    const currentAngle = Math.atan2(
      pointerY - boundary.centerY,
      pointerX - boundary.centerX
    );
    const deltaAngle = currentAngle - dragStartAngleRef.current;
    controller.applyDragRotation(-deltaAngle);
  };

  const handleRotatePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (dragModeRef.current !== "rotate") return;
    event.stopPropagation();
    event.preventDefault();
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignored
    }
    dragModeRef.current = null;
    controller.endRotation();
  };

  // --- Translate Handlers ---
  const handleTranslatePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    event.preventDefault();
    try {
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Ignored
    }

    if (!canvasElement) return;
    const camera = getActiveCamera();
    if (!camera) return;

    const rect = canvasElement.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    const gridPlane = controller
      .getCameraStateService()
      .getActiveStrategy()
      .getGridPlane();
    const targetPoint = controller.getCameraStateService().getTargetPoint();

    const startWorldPos = raycasterRef.current.unprojectToGridPlane(
      pointerX,
      pointerY,
      camera,
      gridPlane,
      rect.width,
      rect.height,
      targetPoint
    );

    if (startWorldPos) {
      dragModeRef.current = "translate";
      dragStartWorldPosRef.current = startWorldPos;
      controller.beginTransformTranslation();
    }
  };

  const handleTranslatePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (dragModeRef.current !== "translate" || !canvasElement) return;
    event.stopPropagation();
    event.preventDefault();

    const camera = getActiveCamera();
    if (!camera) return;

    const rect = canvasElement.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    const gridPlane = controller
      .getCameraStateService()
      .getActiveStrategy()
      .getGridPlane();
    const targetPoint = controller.getCameraStateService().getTargetPoint();

    const currentWorldPos = raycasterRef.current.unprojectToGridPlane(
      pointerX,
      pointerY,
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
      controller.applyTransformTranslation(totalDragDelta);
    }
  };

  const handleTranslatePointerUp = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (dragModeRef.current !== "translate") return;
    event.stopPropagation();
    event.preventDefault();
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignored
    }
    dragModeRef.current = null;
    controller.endTransformTranslation();
    setBoundary(calculateBoundary());
  };

  const baseHandleStyle: React.CSSProperties = {
    position: "absolute",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: ThemeColors.panelBackground,
    border: `2px solid ${ThemeColors.accent}`,
    color: ThemeColors.textPrimary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    outline: "none",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
    transform: "translate(-50%, -50%)",
    zIndex: 5,
    userSelect: "none",
    touchAction: "none",
    pointerEvents: "auto",
  };

  // Icons
  const RotateIcon: React.FC = () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pointerEvents: "none" }}
    >
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  );

  const ScaleIconDiagonal1: React.FC = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pointerEvents: "none" }}
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );

  const ScaleIconDiagonal2: React.FC = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pointerEvents: "none" }}
    >
      <polyline points="9 3 3 3 3 9" />
      <polyline points="15 21 21 21 21 15" />
      <line x1="3" y1="3" x2="10" y2="10" />
      <line x1="21" y1="21" x2="14" y2="14" />
    </svg>
  );

  const MoveCrossIcon: React.FC = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pointerEvents: "none" }}
    >
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );

  return (
    <div
      data-testid="transform-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      {/* Bounding boundary guideline */}
      <div
        data-testid="transform-boundary-box"
        style={{
          position: "absolute",
          left: `${boxLeft}px`,
          top: `${boxTop}px`,
          width: `${boxWidth}px`,
          height: `${boxHeight}px`,
          border: `1px dashed ${ThemeColors.borderStrong}`,
          borderRadius: "2px",
          pointerEvents: "none",
        }}
      />

      {/* --- 4 Corner Scale Handles --- */}
      <button
        data-testid="transform-scale-handle-top-left"
        title="Scale (Top-Left)"
        onPointerDown={handleScalePointerDown}
        onPointerMove={handleScalePointerMove}
        onPointerUp={handleScalePointerUp}
        onPointerCancel={handleScalePointerUp}
        style={{
          ...baseHandleStyle,
          cursor: "nwse-resize",
          left: `${boxLeft}px`,
          top: `${boxTop}px`,
        }}
      >
        <ScaleIconDiagonal1 />
      </button>

      <button
        data-testid="transform-scale-handle-top-right"
        title="Scale (Top-Right)"
        onPointerDown={handleScalePointerDown}
        onPointerMove={handleScalePointerMove}
        onPointerUp={handleScalePointerUp}
        onPointerCancel={handleScalePointerUp}
        style={{
          ...baseHandleStyle,
          cursor: "nesw-resize",
          left: `${boxLeft + boxWidth}px`,
          top: `${boxTop}px`,
        }}
      >
        <ScaleIconDiagonal2 />
      </button>

      <button
        data-testid="transform-scale-handle-bottom-right"
        title="Scale (Bottom-Right)"
        onPointerDown={handleScalePointerDown}
        onPointerMove={handleScalePointerMove}
        onPointerUp={handleScalePointerUp}
        onPointerCancel={handleScalePointerUp}
        style={{
          ...baseHandleStyle,
          cursor: "nwse-resize",
          left: `${boxLeft + boxWidth}px`,
          top: `${boxTop + boxHeight}px`,
        }}
      >
        <ScaleIconDiagonal1 />
      </button>

      <button
        data-testid="transform-scale-handle-bottom-left"
        title="Scale (Bottom-Left)"
        onPointerDown={handleScalePointerDown}
        onPointerMove={handleScalePointerMove}
        onPointerUp={handleScalePointerUp}
        onPointerCancel={handleScalePointerUp}
        style={{
          ...baseHandleStyle,
          cursor: "nesw-resize",
          left: `${boxLeft}px`,
          top: `${boxTop + boxHeight}px`,
        }}
      >
        <ScaleIconDiagonal2 />
      </button>

      {/* --- 4 Mid-Edge Rotate Handles --- */}
      <button
        data-testid="transform-rotate-handle-top"
        title="Rotate (Top)"
        onPointerDown={handleRotatePointerDown}
        onPointerMove={handleRotatePointerMove}
        onPointerUp={handleRotatePointerUp}
        onPointerCancel={handleRotatePointerUp}
        style={{
          ...baseHandleStyle,
          cursor: "grab",
          left: `${boxLeft + boxWidth / 2}px`,
          top: `${boxTop}px`,
        }}
      >
        <RotateIcon />
      </button>

      <button
        data-testid="transform-rotate-handle-right"
        title="Rotate (Right)"
        onPointerDown={handleRotatePointerDown}
        onPointerMove={handleRotatePointerMove}
        onPointerUp={handleRotatePointerUp}
        onPointerCancel={handleRotatePointerUp}
        style={{
          ...baseHandleStyle,
          cursor: "grab",
          left: `${boxLeft + boxWidth}px`,
          top: `${boxTop + boxHeight / 2}px`,
        }}
      >
        <RotateIcon />
      </button>

      <button
        data-testid="transform-rotate-handle-bottom"
        title="Rotate (Bottom)"
        onPointerDown={handleRotatePointerDown}
        onPointerMove={handleRotatePointerMove}
        onPointerUp={handleRotatePointerUp}
        onPointerCancel={handleRotatePointerUp}
        style={{
          ...baseHandleStyle,
          cursor: "grab",
          left: `${boxLeft + boxWidth / 2}px`,
          top: `${boxTop + boxHeight}px`,
        }}
      >
        <RotateIcon />
      </button>

      <button
        data-testid="transform-rotate-handle-left"
        title="Rotate (Left)"
        onPointerDown={handleRotatePointerDown}
        onPointerMove={handleRotatePointerMove}
        onPointerUp={handleRotatePointerUp}
        onPointerCancel={handleRotatePointerUp}
        style={{
          ...baseHandleStyle,
          cursor: "grab",
          left: `${boxLeft}px`,
          top: `${boxTop + boxHeight / 2}px`,
        }}
      >
        <RotateIcon />
      </button>

      {/* --- Center Translate Handle --- */}
      <button
        data-testid="transform-translate-handle-center"
        title="Move Object"
        onPointerDown={handleTranslatePointerDown}
        onPointerMove={handleTranslatePointerMove}
        onPointerUp={handleTranslatePointerUp}
        onPointerCancel={handleTranslatePointerUp}
        style={{
          ...baseHandleStyle,
          cursor: "move",
          left: `${boundary.centerX}px`,
          top: `${boundary.centerY}px`,
          backgroundColor: ThemeColors.accent,
          color: "#ffffff",
          border: `2px solid ${ThemeColors.borderStrong}`,
        }}
      >
        <MoveCrossIcon />
      </button>
    </div>
  );
};