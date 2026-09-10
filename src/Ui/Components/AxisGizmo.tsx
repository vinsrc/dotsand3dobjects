import React, { useRef, useState } from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { OrthographicAxis } from "../../Application/Services/CameraService/OrthographicViewStrategy";
import { Vector3D } from "../../Application/Common/Vector3D";
import { AXIS_COLOR_STRINGS } from "../Common/AxisColors";

interface AxisDefinition {
  readonly axisId: OrthographicAxis;
  readonly label: string;
  readonly direction: Vector3D;
  readonly color: string;
  readonly isNegative: boolean;
}

const AXIS_DEFINITIONS: AxisDefinition[] = [
  {
    axisId: "+X",
    label: "X",
    direction: new Vector3D(1, 0, 0),
    color: AXIS_COLOR_STRINGS.positiveX,
    isNegative: false,
  },
  {
    axisId: "-X",
    label: "-X",
    direction: new Vector3D(-1, 0, 0),
    color: AXIS_COLOR_STRINGS.negativeX,
    isNegative: true,
  },
  {
    axisId: "+Y",
    label: "Y",
    direction: new Vector3D(0, 1, 0),
    color: AXIS_COLOR_STRINGS.positiveY,
    isNegative: false,
  },
  {
    axisId: "-Y",
    label: "-Y",
    direction: new Vector3D(0, -1, 0),
    color: AXIS_COLOR_STRINGS.negativeY,
    isNegative: true,
  },
  {
    axisId: "+Z",
    label: "Z",
    direction: new Vector3D(0, 0, 1),
    color: AXIS_COLOR_STRINGS.positiveZ,
    isNegative: false,
  },
  {
    axisId: "-Z",
    label: "-Z",
    direction: new Vector3D(0, 0, -1),
    color: AXIS_COLOR_STRINGS.negativeZ,
    isNegative: true,
  },
];

export const AxisGizmo: React.FC = () => {
  const controller = useAppController();
  useApplicationState(["VIEW_CHANGED"]);

  const gizmoContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const previousPointerPosition = useRef<{
    coordinateX: number;
    coordinateY: number;
  }>({
    coordinateX: 0,
    coordinateY: 0,
  });

  const cameraService = controller.getCameraStateService();
  const viewStrategy = cameraService.getActiveStrategy();
  const viewDirection = viewStrategy.getViewDirection();
  const upDirection = viewStrategy.getUpDirection();
  const rightDirection = upDirection
    .calculateCrossProduct(viewDirection)
    .normalize();

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    previousPointerPosition.current = {
      coordinateX: event.clientX,
      coordinateY: event.clientY,
    };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    const deltaPixelX = event.clientX - previousPointerPosition.current.coordinateX;
    const deltaPixelY = event.clientY - previousPointerPosition.current.coordinateY;

    previousPointerPosition.current = {
      coordinateX: event.clientX,
      coordinateY: event.clientY,
    };

    // Orbit sensitivity
    const orbitSensitivity = 0.012;
    controller.rotateCamera(
      -deltaPixelX * orbitSensitivity,
      deltaPixelY * orbitSensitivity
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Ignored if capture already lost
    }
  };

  const handleAxisSelect = (
    axisIdentifier: OrthographicAxis,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    controller.selectOrthographicView(axisIdentifier);
  };

  // Project 3D axes to 2D gizmo disk
  const gizmoRadius = 42;
  const gizmoCenter = 55;

  const projectedAxes = AXIS_DEFINITIONS.map((axisDefinition) => {
    const direction = axisDefinition.direction;
    const screenCoordinateX =
      direction.coordinateX * rightDirection.coordinateX +
      direction.coordinateY * rightDirection.coordinateY +
      direction.coordinateZ * rightDirection.coordinateZ;

    const screenCoordinateY =
      direction.coordinateX * upDirection.coordinateX +
      direction.coordinateY * upDirection.coordinateY +
      direction.coordinateZ * upDirection.coordinateZ;

    const depthValue =
      direction.coordinateX * viewDirection.coordinateX +
      direction.coordinateY * viewDirection.coordinateY +
      direction.coordinateZ * viewDirection.coordinateZ;

    return {
      axisDefinition,
      positionX: gizmoCenter + screenCoordinateX * gizmoRadius,
      positionY: gizmoCenter - screenCoordinateY * gizmoRadius,
      depthValue,
    };
  });

  // Sort back to front so front axes draw over back ones
  projectedAxes.sort((firstAxis, secondAxis) => {
    return firstAxis.depthValue - secondAxis.depthValue;
  });

  return (
    <div
      ref={gizmoContainerRef}
      data-testid="3d-axis-gizmo"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        width: "110px",
        height: "110px",
        borderRadius: "50%",
        backgroundColor: "rgba(240, 240, 240, 0.85)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        zIndex: 50,
      }}
    >
      <svg
        width="110"
        height="110"
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        {projectedAxes.map(({ axisDefinition, positionX, positionY, depthValue }) => {
          if (depthValue < -0.1 && axisDefinition.isNegative) {
            return null;
          }
          return (
            <line
              key={`line-${axisDefinition.axisId}`}
              x1={gizmoCenter}
              y1={gizmoCenter}
              x2={positionX}
              y2={positionY}
              stroke={axisDefinition.isNegative ? "#aaaaaa" : axisDefinition.color}
              strokeWidth={axisDefinition.isNegative ? "1" : "2"}
              strokeDasharray={axisDefinition.isNegative ? "2 2" : undefined}
            />
          );
        })}
      </svg>

      {projectedAxes.map(({ axisDefinition, positionX, positionY, depthValue }) => {
        const isNegative = axisDefinition.isNegative;
        const circleSize = isNegative ? 16 : 22;
        const circleOffset = circleSize / 2;

        return (
          <button
            key={axisDefinition.axisId}
            data-testid={`gizmo-axis-${axisDefinition.axisId}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => handleAxisSelect(axisDefinition.axisId, event)}
            title={`Orthographic ${axisDefinition.axisId} View`}
            style={{
              position: "absolute",
              left: `${positionX - circleOffset}px`,
              top: `${positionY - circleOffset}px`,
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              borderRadius: "50%",
              backgroundColor: axisDefinition.color,
              border: "1.5px solid #ffffff",
              color: isNegative ? "#444444" : "#ffffff",
              fontSize: isNegative ? "9px" : "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              opacity: depthValue < -0.2 ? 0.6 : 1,
              zIndex: Math.round((depthValue + 1) * 10),
            }}
          >
            {isNegative ? "" : axisDefinition.label}
          </button>
        );
      })}
    </div>
  );
};
