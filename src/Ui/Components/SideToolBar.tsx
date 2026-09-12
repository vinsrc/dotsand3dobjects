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
    "GRID_SNAP_CHANGED",
    "SELECTION_CHANGED",
    "UNDO_REDO_STATE_CHANGED",
    "UI_CUSTOMIZATION_CHANGED",
    "DECALS_CHANGED",
  ]);

  const dockSide = controller.getUiCustomizationService().getSideToolBarDock();
  const currentMode = controller.getEditorModeService().getMode();
  const isGridSnap = controller.isGridSnapEnabled();
  const canUndo = controller.canUndo();
  const canRedo = controller.canRedo();
  const isDecalSelected = controller.isDecalSelected();
  const selectedVertexCount = controller
    .getSelectionService()
    .getSelectedIndices().length;

  const hasSelectedVertex = selectedVertexCount > 0;

  const handleCenterObject = () => {
    controller.centerObject();
  };

  const handleUndo = () => {
    controller.undo();
  };

  const handleRedo = () => {
    controller.redo();
  };

  const handleClearSelection = () => {
    controller.clearSelection();
  };

  const handleDeleteVertex = () => {
    controller.deleteSelectedVertices();
  };

  const handleEnterMode = (mode: UiMode) => {
    if (currentMode === mode) {
      controller.finishMode();
    } else {
      controller.enterMode(mode);
    }
  };

  const handleToggleGridSnap = () => {
    controller.toggleGridSnap();
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
        data-testid="mode-3d-view-button"
        onClick={() => controller.finishMode()}
        style={
          currentMode === "DEFAULT" ? activeModeButtonStyle : buttonStyle
        }
      >
        3D View
      </button>

      <button
        data-testid="undo-button"
        onClick={handleUndo}
        disabled={!canUndo}
        style={canUndo ? buttonStyle : disabledButtonStyle}
      >
        Undo
      </button>

      <button
        data-testid="redo-button"
        onClick={handleRedo}
        disabled={!canRedo}
        style={canRedo ? buttonStyle : disabledButtonStyle}
      >
        Redo
      </button>

      <button
        data-testid="center-object-button"
        onClick={handleCenterObject}
        disabled={isDecalSelected}
        style={!isDecalSelected ? buttonStyle : disabledButtonStyle}
      >
        Center Object
      </button>

      <button
        data-testid="mode-multi-select-button"
        onClick={() => handleEnterMode("MULTI_SELECT")}
        style={
          currentMode === "MULTI_SELECT" ? activeModeButtonStyle : buttonStyle
        }
      >
        Multi selection
      </button>

      <button
        data-testid="clear-selection-button"
        onClick={handleClearSelection}
        disabled={!hasSelectedVertex && !isDecalSelected}
        style={hasSelectedVertex || isDecalSelected ? buttonStyle : disabledButtonStyle}
      >
        Clear selection
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
        style={
          currentMode === "TRANSLATE" ? activeModeButtonStyle : buttonStyle
        }
      >
        Translate
      </button>

      <button
        data-testid="mode-rotate-button"
        onClick={() => handleEnterMode("ROTATE")}
        style={currentMode === "ROTATE" ? activeModeButtonStyle : buttonStyle}
      >
        Rotate
      </button>

      <button
        data-testid="mode-scale-button"
        onClick={() => handleEnterMode("SCALE")}
        style={currentMode === "SCALE" ? activeModeButtonStyle : buttonStyle}
      >
        Scale
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
        Fill
      </button>

      <button
        data-testid="grid-snap-toggle-button"
        onClick={handleToggleGridSnap}
        style={{
          ...buttonStyle,
          backgroundColor: isGridSnap ? ThemeColors.success : ThemeColors.widget,
          color: isGridSnap ? "#ffffff" : ThemeColors.textPrimary,
          borderColor: isGridSnap
            ? ThemeColors.successBorder
            : ThemeColors.borderStrong,
        }}
      >
        {isGridSnap ? "Grid Snap: ON" : "Grid Snap: OFF"}
      </button>
    </aside>
  );
};
