import React, { useRef } from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { UiMode } from "../../Application/Services/EditorModeService/EditorModeService";

export const ToolBar: React.FC = () => {
  const controller = useAppController();
  useApplicationState([
    "RENDER_MODE_CHANGED",
    "MODEL_CHANGED",
    "MODE_CHANGED",
    "AUTO_CONNECT_CHANGED",
    "GRID_SNAP_CHANGED",
    "SELECTION_CHANGED",
    "UNDO_REDO_STATE_CHANGED",
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isWireframe = controller.getRenderModeService().isWireframe();
  const currentMode = controller.getEditorModeService().getMode();
  const isAutoConnect = controller.getEditorModeService().isAutoConnectEnabled();
  const isGridSnap = controller.isGridSnapEnabled();
  const canUndo = controller.canUndo();
  const canRedo = controller.canRedo();
  const selectedVertexCount = controller
    .getSelectionService()
    .getSelectedIndices().length;
  const canFillFace =
    selectedVertexCount === 3 || selectedVertexCount === 4;

  const handleFaceFill = () => {
    controller.createFaceFromSelectedVertices();
  };

  const handleLoadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const targetFile = selectedFiles[0];
    if (!targetFile) {
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      const fileContentString = fileReader.result as string;
      controller.loadModelFromFile(targetFile.name, fileContentString);
    };
    fileReader.readAsText(targetFile);
  };

  const handleExportClick = () => {
    const objContent = controller.exportModelToFile();
    const textBlob = new Blob([objContent], { type: "text/plain" });
    const downloadUrl = URL.createObjectURL(textBlob);
    const anchorElement = document.createElement("a");
    anchorElement.href = downloadUrl;
    anchorElement.download = "model.obj";
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleToggleRenderMode = () => {
    controller.toggleRenderMode();
  };

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

  const handleToggleAutoConnect = () => {
    controller.toggleAutoConnect();
  };

  const handleToggleGridSnap = () => {
    controller.toggleGridSnap();
  };

  const buttonStyle: React.CSSProperties = {
    padding: "6px 12px",
    backgroundColor: "#ffffff",
    border: "1px solid #999999",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    color: "#333333",
    whiteSpace: "nowrap",
  };

  const activeModeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#2196f3",
    color: "#ffffff",
    borderColor: "#1976d2",
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: "not-allowed",
  };

  return (
    <header
      data-testid="toolbar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "48px",
        backgroundColor: "#e0e0e0",
        borderBottom: "1px solid #c0c0c0",
        padding: "0 12px",
        boxSizing: "border-box",
        userSelect: "none",
        overflowX: "auto",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          ref={fileInputRef}
          type="file"
          data-testid="file-input"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
        <button
          data-testid="load-obj-button"
          onClick={handleLoadClick}
          style={buttonStyle}
        >
          Load OBJ
        </button>
        <button
          data-testid="export-obj-button"
          onClick={handleExportClick}
          style={buttonStyle}
        >
          Export OBJ
        </button>
        <button
          data-testid="toggle-view-button"
          onClick={handleToggleRenderMode}
          style={{
            ...buttonStyle,
            backgroundColor: isWireframe ? "#333333" : "#ffffff",
            color: isWireframe ? "#ffffff" : "#333333",
          }}
        >
          {isWireframe ? "Wireframe View" : "Shaded View"}
        </button>
        <button
          data-testid="center-object-button"
          onClick={handleCenterObject}
          style={buttonStyle}
        >
          Center Object
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
          data-testid="clear-selection-button"
          onClick={handleClearSelection}
          style={buttonStyle}
        >
          Clear Selection
        </button>
        <button
          data-testid="delete-vertex-button"
          onClick={handleDeleteVertex}
          style={buttonStyle}
        >
          Delete Vertex
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          data-testid="mode-multi-select-button"
          onClick={() => handleEnterMode("MULTI_SELECT")}
          style={
            currentMode === "MULTI_SELECT" ? activeModeButtonStyle : buttonStyle
          }
        >
          Multi Select Mode
        </button>

        <button
          data-testid="mode-translate-button"
          onClick={() => handleEnterMode("TRANSLATE")}
          style={
            currentMode === "TRANSLATE" ? activeModeButtonStyle : buttonStyle
          }
        >
          Translate Mode
        </button>

        <button
          data-testid="mode-insert-button"
          onClick={() => handleEnterMode("INSERT")}
          style={
            currentMode === "INSERT" ? activeModeButtonStyle : buttonStyle
          }
        >
          Insert Mode
        </button>

        {currentMode === "INSERT" && (
          <button
            data-testid="auto-connect-toggle-button"
            onClick={handleToggleAutoConnect}
            style={{
              ...buttonStyle,
              backgroundColor: isAutoConnect ? "#4caf50" : "#ffffff",
              color: isAutoConnect ? "#ffffff" : "#333333",
              borderColor: isAutoConnect ? "#388e3c" : "#999999",
            }}
          >
            {isAutoConnect ? "Auto Connect: ON" : "Auto Connect: OFF"}
          </button>
        )}

        <button
          data-testid="mode-fill-button"
          onClick={() => handleEnterMode("FILL")}
          style={currentMode === "FILL" ? activeModeButtonStyle : buttonStyle}
        >
          Fill Mode
        </button>

        {currentMode === "FILL" && (
          <button
            data-testid="face-fill-button"
            onClick={handleFaceFill}
            disabled={!canFillFace}
            style={canFillFace ? buttonStyle : disabledButtonStyle}
          >
            Face Fill
          </button>
        )}

        <button
          data-testid="grid-snap-toggle-button"
          onClick={handleToggleGridSnap}
          style={{
            ...buttonStyle,
            backgroundColor: isGridSnap ? "#4caf50" : "#ffffff",
            color: isGridSnap ? "#ffffff" : "#333333",
            borderColor: isGridSnap ? "#388e3c" : "#999999",
          }}
        >
          {isGridSnap ? "Grid Snap: ON" : "Grid Snap: OFF"}
        </button>
      </div>
    </header>
  );
};
