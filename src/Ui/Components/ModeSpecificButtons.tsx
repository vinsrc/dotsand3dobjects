import React from "react";
import { ThemeColors } from "../Common/Theme";

export interface ModeSpecificButtonsProps {
  isDecalSelected: boolean;
  hasSelectedFace: boolean;
  canDeleteDecal: boolean;
  currentMode: string;
  isAutoConnect: boolean;
  isClone: boolean;
  onSelectParentFace: () => void;
  onFlipFace: () => void;
  onAddDecalPlane: () => void;
  onDeleteDecalPlane: () => void;
  onClearMaterial: () => void;
  onToggleAutoConnect: () => void;
  onToggleClone: () => void;
}

export const ModeSpecificButtons: React.FC<ModeSpecificButtonsProps> = ({
  isDecalSelected,
  hasSelectedFace,
  canDeleteDecal,
  currentMode,
  isAutoConnect,
  isClone,
  onSelectParentFace,
  onFlipFace,
  onAddDecalPlane,
  onDeleteDecalPlane,
  onClearMaterial,
  onToggleAutoConnect,
  onToggleClone,
}) => {
  const buttonStyle: React.CSSProperties = {
    padding: "6px 12px",
    backgroundColor: ThemeColors.widget,
    border: `1px solid ${ThemeColors.borderStrong}`,
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    color: ThemeColors.textPrimary,
    whiteSpace: "nowrap",
  };

  return (
    <div
      data-testid="mode-specific-buttons"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      {isDecalSelected && (
        <button
          data-testid="select-parent-face-button"
          onClick={onSelectParentFace}
          title="Select Parent Face"
          style={{
            ...buttonStyle,
            backgroundColor: ThemeColors.widget,
            color: ThemeColors.textPrimary,
          }}
        >
          Select Parent Face
        </button>
      )}

      {hasSelectedFace && !isDecalSelected && (
        <button
          data-testid="flip-face-button"
          onClick={onFlipFace}
          title="Flip Face"
          style={{
            ...buttonStyle,
            backgroundColor: ThemeColors.widget,
            color: ThemeColors.textPrimary,
          }}
        >
          Flip Face
        </button>
      )}

      {hasSelectedFace && !isDecalSelected && (
        <button
          data-testid="add-decal-plane-button"
          onClick={onAddDecalPlane}
          title="Add Decal Plane to selected face"
          style={{
            ...buttonStyle,
            backgroundColor: ThemeColors.widget,
            color: ThemeColors.textPrimary,
          }}
        >
          Add Decal Plane
        </button>
      )}

      {canDeleteDecal && (
        <button
          data-testid="delete-decal-plane-button"
          onClick={onDeleteDecalPlane}
          title="Delete selected Decal Plane"
          style={{
            ...buttonStyle,
            backgroundColor: ThemeColors.widget,
            color: ThemeColors.danger,
            borderColor: ThemeColors.dangerBorder ?? ThemeColors.borderStrong,
          }}
        >
          Delete Decal Plane
        </button>
      )}

      {(hasSelectedFace || canDeleteDecal) && (
        <button
          data-testid="clear-material-button"
          onClick={onClearMaterial}
          title="Clear material from selected face or decal"
          style={{
            ...buttonStyle,
            backgroundColor: ThemeColors.widget,
            color: ThemeColors.textPrimary,
          }}
        >
          Clear Material
        </button>
      )}

      {currentMode === "INSERT" && (
        <button
          data-testid="auto-connect-toggle-button"
          onClick={onToggleAutoConnect}
          style={{
            ...buttonStyle,
            backgroundColor: isAutoConnect ? ThemeColors.success : ThemeColors.widget,
            color: isAutoConnect ? "#ffffff" : ThemeColors.textPrimary,
            borderColor: isAutoConnect
              ? ThemeColors.successBorder
              : ThemeColors.borderStrong,
          }}
        >
          {isAutoConnect ? "Auto Connect: ON" : "Auto Connect: OFF"}
        </button>
      )}

      {currentMode === "TRANSLATE" && (
        <>
          <button
            data-testid="clone-toggle-button"
            onClick={onToggleClone}
            style={{
              ...buttonStyle,
              backgroundColor: isClone ? ThemeColors.success : ThemeColors.widget,
              color: isClone ? "#ffffff" : ThemeColors.textPrimary,
              borderColor: isClone
                ? ThemeColors.successBorder
                : ThemeColors.borderStrong,
            }}
          >
            {isClone ? "Clone: ON" : "Clone: OFF"}
          </button>
          {isClone && (
            <button
              data-testid="clone-auto-connect-button"
              onClick={onToggleAutoConnect}
              style={{
                ...buttonStyle,
                backgroundColor: isAutoConnect ? ThemeColors.success : ThemeColors.widget,
                color: isAutoConnect ? "#ffffff" : ThemeColors.textPrimary,
                borderColor: isAutoConnect
                  ? ThemeColors.successBorder
                  : ThemeColors.borderStrong,
              }}
            >
              {isAutoConnect ? "Auto Connect: ON" : "Auto Connect: OFF"}
            </button>
          )}
        </>
      )}
    </div>
  );
};
