import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { AppController } from "../../Application/Controllers/AppController";
import { ThemeColors } from "../Common/Theme";
import { Vector3D } from "../../Application/Common/Vector3D";

export interface RotateOverlayProps {
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

export const RotateOverlay: React.FC<RotateOverlayProps> = ({
  controller,
  canvasElement,
  getActiveCamera,
}) => {
  const [boundary, setBoundary] = useState<BoundaryBox | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartAngleRef = useRef<number>(0);

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

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    _handleName: string
  ) => {
    event.stopPropagation();
    event.preventDefault();

    try {
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Ignored
    }

    if (!canvasElement) {
      return;
    }

    const rect = canvasElement.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    isDraggingRef.current = true;
    dragStartAngleRef.current = Math.atan2(
      pointerY - boundary.centerY,
      pointerX - boundary.centerX
    );

    controller.beginRotation();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current || !canvasElement) {
      return;
    }

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
    // Invert delta because screen Y grows downward
    controller.applyDragRotation(-deltaAngle);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignored
    }

    isDraggingRef.current = false;
    controller.endRotation();
  };

  const handleButtonStyle: React.CSSProperties = {
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
    cursor: "grab",
    padding: 0,
    outline: "none",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
    transform: "translate(-50%, -50%)",
    zIndex: 5,
    userSelect: "none",
    touchAction: "none",
  };

  const RotateIcon: React.FC = () => (
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
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  );

  return (
    <div
      data-testid="rotate-overlay"
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
        data-testid="rotate-boundary-box"
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

      {/* Top-Left Rotate Icon */}
      <button
        data-testid="rotate-handle-top-left"
        title="Rotate geometry"
        onPointerDown={(e) => handlePointerDown(e, "top-left")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          ...handleButtonStyle,
          left: `${boxLeft}px`,
          top: `${boxTop}px`,
          pointerEvents: "auto",
        }}
      >
        <RotateIcon />
      </button>

      {/* Top-Right Rotate Icon */}
      <button
        data-testid="rotate-handle-top-right"
        title="Rotate geometry"
        onPointerDown={(e) => handlePointerDown(e, "top-right")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          ...handleButtonStyle,
          left: `${boxLeft + boxWidth}px`,
          top: `${boxTop}px`,
          pointerEvents: "auto",
        }}
      >
        <RotateIcon />
      </button>

      {/* Bottom-Right Rotate Icon */}
      <button
        data-testid="rotate-handle-bottom-right"
        title="Rotate geometry"
        onPointerDown={(e) => handlePointerDown(e, "bottom-right")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          ...handleButtonStyle,
          left: `${boxLeft + boxWidth}px`,
          top: `${boxTop + boxHeight}px`,
          pointerEvents: "auto",
        }}
      >
        <RotateIcon />
      </button>

      {/* Bottom-Left Rotate Icon */}
      <button
        data-testid="rotate-handle-bottom-left"
        title="Rotate geometry"
        onPointerDown={(e) => handlePointerDown(e, "bottom-left")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          ...handleButtonStyle,
          left: `${boxLeft}px`,
          top: `${boxTop + boxHeight}px`,
          pointerEvents: "auto",
        }}
      >
        <RotateIcon />
      </button>
    </div>
  );
};
