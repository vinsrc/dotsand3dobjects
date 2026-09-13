import React from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { UiMode } from "../../Application/Services/EditorModeService/EditorModeService";
import { ThemeColors } from "../Common/Theme";

export const SideToolBar: React.FC = () => {
  const controller = useAppController();
  useApplicationState([
    "MODEL_CHANGED",
    "MODE_CHANGED",
    "SELECTION_CHANGED",
    "UI_CUSTOMIZATION_CHANGED",
    "DECALS_CHANGED",
    "VIEW_CHANGED",
  ]);

  const dockSide = controller.getUiCustomizationService().getSideToolBarDock();
  const currentMode = controller.getEditorModeService().getMode();
  const isDecalSelected = controller.isDecalSelected();
  const selectedVertexCount = controller
    .getSelectionService()
    .getSelectedIndices().length;

  const hasSelectedVertex = selectedVertexCount > 0;
  const canFillFace = selectedVertexCount >= 3;
  const selectedFaceIndex = controller.getSelectedFaceIndex();
  const hasSelectedFace = selectedFaceIndex !== null && !isDecalSelected;
  const selectedEdgeCount = controller.getSelectedEdges().length;
  const hasSelectedEdge = selectedEdgeCount > 0 && !isDecalSelected;

  const handleCenterObject = () => {
    controller.centerObject();
  };

  const handleDeleteVertex = () => {
    controller.deleteSelectedVertices();
  };

  const handleDeleteEdge = () => {
    controller.deleteSelectedEdges();
  };

  const handleFaceFill = () => {
    controller.createFaceFromSelectedVertices();
  };

  const handleDeleteFace = () => {
    controller.deleteSelectedFace();
  };

  const handleEnterMode = (mode: UiMode) => {
    if (currentMode === mode) {
      controller.finishMode();
    } else {
      controller.enterMode(mode);
    }
  };

  const buttonStyle: React.CSSProperties = {
    padding: "8px 12px",
    backgroundColor: ThemeColors.widget,
    border: `1px solid ${ThemeColors.borderStrong}`,
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    color: ThemeColors.textPrimary,
    whiteSpace: "nowrap",
    width: "100%",
    textAlign: "center",
    boxSizing: "border-box",
  };

  const activeModeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: ThemeColors.accent,
    color: "#ffffff",
    borderColor: ThemeColors.accentBorder,
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: "not-allowed",
  };

  return (
    <aside
      data-testid="side-toolbar"
      style={{
        width: "140px",
        minWidth: "140px",
        height: "100%",
        backgroundColor: ThemeColors.toolbarBackground,
        borderLeft: dockSide === "right" ? `1px solid ${ThemeColors.border}` : "none",
        borderRight: dockSide === "left" ? `1px solid ${ThemeColors.border}` : "none",
        display: "flex",
        flexDirection: "column",
        padding: "12px 8px",
        gap: "8px",
        boxSizing: "border-box",
        overflowY: "auto",
        userSelect: "none",
        zIndex: 10,
      }}
    >
      <button
        data-testid="center-object-button"
        onClick={handleCenterObject}
        disabled={isDecalSelected}
        style={!isDecalSelected ? buttonStyle : disabledButtonStyle}
      >
        Center Object
      </button>

      <button
        data-testid="mode-transform-button"
        onClick={() => handleEnterMode("TRANSFORM")}
        style={
          currentMode === "TRANSFORM" ? activeModeButtonStyle : buttonStyle
        }
      >
        Transform
      </button>

      <button
        data-testid="delete-vertex-button"
        onClick={handleDeleteVertex}
        disabled={!hasSelectedVertex || isDecalSelected}
        style={hasSelectedVertex && !isDecalSelected ? buttonStyle : disabledButtonStyle}
      >
        Delete vertex
      </button>

      <button
        data-testid="delete-edge-button"
        onClick={handleDeleteEdge}
        disabled={!hasSelectedEdge}
        style={hasSelectedEdge ? buttonStyle : disabledButtonStyle}
      >
        Delete Edge
      </button>

      <button
        data-testid="face-delete-button"
        onClick={handleDeleteFace}
        disabled={!hasSelectedFace}
        style={hasSelectedFace ? buttonStyle : disabledButtonStyle}
      >
        Delete Face
      </button>

      <button
        data-testid="mode-insert-button"
        onClick={() => handleEnterMode("INSERT")}
        disabled={isDecalSelected}
        style={
          isDecalSelected
            ? disabledButtonStyle
            : currentMode === "INSERT"
            ? activeModeButtonStyle
            : buttonStyle
        }
      >
        Insert
      </button>

      <button
        data-testid="mode-translate-button"
        onClick={() => handleEnterMode("TRANSLATE")}
        disabled={isDecalSelected}
        style={
          isDecalSelected
            ? disabledButtonStyle
            : currentMode === "TRANSLATE"
            ? activeModeButtonStyle
            : buttonStyle
        }
      >
        Move Vertex
      </button>

      <button
        data-testid="mode-fill-button"
        onClick={() => handleEnterMode("FILL")}
        disabled={isDecalSelected}
        style={
          isDecalSelected
            ? disabledButtonStyle
            : currentMode === "FILL"
            ? activeModeButtonStyle
            : buttonStyle
        }
      >
        Draw Edge
      </button>

      <button
        data-testid="face-fill-button"
        onClick={handleFaceFill}
        disabled={!canFillFace || isDecalSelected}
        style={
          canFillFace && !isDecalSelected ? buttonStyle : disabledButtonStyle
        }
      >
        Face Fill
      </button>
    </aside>
  );
};
