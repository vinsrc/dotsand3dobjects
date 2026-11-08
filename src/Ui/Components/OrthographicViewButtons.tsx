import React from "react";
import { OrthographicAxis } from "../../Application/Services/CameraService/OrthographicViewStrategy";
import { ThemeColors } from "../Common/Theme";

export const ORTHOGRAPHIC_VIEW_BUTTON_ORDER: readonly OrthographicAxis[] = [
  "+Z",
  "-Z",
  "+Y",
  "-Y",
  "+X",
  "-X",
];

interface OrthographicViewButtonsProps {
  readonly onAxisSelect: (
    axisIdentifier: OrthographicAxis,
    event: React.MouseEvent
  ) => void;
}

/**
 * Six square buttons rendered below the 3D axis gizmo. Each delegates to the
 * same axis selection handler used by the gizmo axis buttons.
 */
export const OrthographicViewButtons: React.FC<OrthographicViewButtonsProps> = ({
  onAxisSelect,
}) => {
  return (
    <div
      data-testid="orthographic-view-buttons"
      role="group"
      aria-label="Orthographic view buttons"
      style={{
        position: "absolute",
        top: "138px",
        right: "20px",
        width: "110px",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "4px",
        zIndex: 50,
      }}
    >
      {ORTHOGRAPHIC_VIEW_BUTTON_ORDER.map((axisIdentifier) => (
        <button
          key={axisIdentifier}
          type="button"
          data-testid={`ortho-view-button-${axisIdentifier}`}
          aria-label={`Orthographic ${axisIdentifier} View`}
          title={`Orthographic ${axisIdentifier} View`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => onAxisSelect(axisIdentifier, event)}
          style={{
            aspectRatio: "1 / 1",
            width: "100%",
            maxWidth: "36px",
            justifySelf: "center",
            borderRadius: "4px",
            border: `1px solid ${ThemeColors.textMuted}`,
            backgroundColor: "rgba(22, 22, 25, 0.9)",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            padding: 0,
            boxShadow: `0 2px 8px ${ThemeColors.shadow}`,
          }}
        >
          {axisIdentifier}
        </button>
      ))}
    </div>
  );
};
