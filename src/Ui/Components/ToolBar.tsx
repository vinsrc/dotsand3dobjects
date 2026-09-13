import React, { useRef } from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { FileMenu } from "./FileMenu";
import { ThemeColors } from "../Common/Theme";

export interface ToolBarProps {
  onOpenHelp?: () => void;
  onOpenCustomizeUi?: () => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  onOpenHelp,
  onOpenCustomizeUi,
}) => {
  const controller = useAppController();
  useApplicationState([
    "RENDER_MODE_CHANGED",
    "MODE_CHANGED",
    "AUTO_CONNECT_CHANGED",
    "SELECTION_CHANGED",
    "MATERIAL_PANEL_CHANGED",
    "VIEW_CHANGED",
    "MODEL_CHANGED",
    "DECALS_CHANGED",
    "GRID_SNAP_CHANGED",
    "UNDO_REDO_STATE_CHANGED",
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mtlFileInputRef = useRef<HTMLInputElement>(null);
  const zipFileInputRef = useRef<HTMLInputElement>(null);
  const isWireframe = controller.getRenderModeService().isWireframe();
  const isMaterialPanelOpen = controller.isMaterialLibraryPanelOpen();
  const isFaceOrthographic = controller.isFaceOrthographicView();
  const currentMode = controller.getEditorModeService().getMode();
  const isAutoConnect = controller.getEditorModeService().isAutoConnectEnabled();
  const isGridSnap = controller.isGridSnapEnabled();
  const canUndo = controller.canUndo();
  const canRedo = controller.canRedo();
  const selectedVertexCount = controller
    .getSelectionService()
    .getSelectedIndices().length;
  const selectedFaceCount =
    controller.getSelectedFaceIndices().length ||
    (controller.getSelectedFaceIndex() !== null ? 1 : 0);
  const hasSelectedFace = selectedFaceCount > 0;
  const isDecalSelected = controller.isDecalSelected();
  const selectedEdgeCount = controller.getSelectedEdges().length;
  const hasSelectedEdge = selectedEdgeCount > 0 && !isDecalSelected;
  const canClearSelection =
    selectedVertexCount > 0 ||
    hasSelectedEdge ||
    hasSelectedFace ||
    isDecalSelected;

  const handleUndo = () => {
    controller.undo();
  };

  const handleRedo = () => {
    controller.redo();
  };

  const handleToggleGridSnap = () => {
    controller.toggleGridSnap();
  };

  const handleClearSelection = () => {
    controller.clearSelection();
  };

  const handleToggleMultiSelect = () => {
    if (currentMode === "MULTI_SELECT") {
      controller.finishMode();
    } else {
      controller.enterMode("MULTI_SELECT");
    }
  };

  const handleClearMaterial = () => {
    controller.clearMaterialOnSelectedFaces();
  };

  const handleAddDecalPlane = () => {
    controller.addDecalPlaneToSelectedFace();
  };

  const handleDeleteDecalPlane = () => {
    controller.deleteSelectedDecal();
  };

  const handleSetFront = () => {
    controller.setFaceFront();
  };

  const handleLoadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleLoadMtlClick = () => {
    if (mtlFileInputRef.current) {
      mtlFileInputRef.current.value = "";
      mtlFileInputRef.current.click();
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const fileList = Array.from(selectedFiles);
    const objFile = fileList.find((file) =>
      file.name.toLowerCase().endsWith(".obj")
    );
    const mtlFile = fileList.find((file) =>
      file.name.toLowerCase().endsWith(".mtl")
    );

    if (objFile && mtlFile) {
      const objReader = new FileReader();
      objReader.onload = () => {
        const objString = objReader.result as string;
        const mtlReader = new FileReader();
        mtlReader.onload = () => {
          const mtlString = mtlReader.result as string;
          controller.loadModelFromFile(objFile.name, objString, mtlString);
        };
        mtlReader.readAsText(mtlFile);
      };
      objReader.readAsText(objFile);
    } else if (objFile) {
      const objReader = new FileReader();
      objReader.onload = () => {
        const objString = objReader.result as string;
        controller.loadModelFromFile(objFile.name, objString);
      };
      objReader.readAsText(objFile);
    } else if (mtlFile) {
      const mtlReader = new FileReader();
      mtlReader.onload = () => {
        const mtlString = mtlReader.result as string;
        controller.loadMaterialsFromFile(mtlFile.name, mtlString);
      };
      mtlReader.readAsText(mtlFile);
    } else if (fileList.length > 0) {
      const fallbackFile = fileList[0];
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => {
        const fallbackString = fallbackReader.result as string;
        controller.loadModelFromFile(fallbackFile.name, fallbackString);
      };
      fallbackReader.readAsText(fallbackFile);
    }
  };

  const handleMtlFileSelected = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      controller.loadMaterialsFromFile(targetFile.name, fileContentString);
    };
    fileReader.readAsText(targetFile);
  };

  const handleImportZipClick = () => {
    if (zipFileInputRef.current) {
      zipFileInputRef.current.value = "";
      zipFileInputRef.current.click();
    }
  };

  const handleZipFileSelected = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      const arrayBuffer = fileReader.result as ArrayBuffer;
      controller.importZip(arrayBuffer, targetFile.name);
    };
    fileReader.readAsArrayBuffer(targetFile);
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(",");
    const mimeMatch = parts[0]?.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
    const b64Data = parts[1] || "";
    const byteCharacters = atob(b64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let index = 0; index < byteCharacters.length; index += 1) {
      byteNumbers[index] = byteCharacters.charCodeAt(index);
    }
    return new Blob([byteNumbers], { type: mimeType });
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

    const materials = controller.getMaterialService().getMaterials();
    if (materials.length > 0) {
      const mtlContent = controller.exportMtlFile("model");
      const mtlBlob = new Blob([mtlContent], { type: "text/plain" });
      const mtlDownloadUrl = URL.createObjectURL(mtlBlob);
      const mtlAnchorElement = document.createElement("a");
      mtlAnchorElement.href = mtlDownloadUrl;
      mtlAnchorElement.download = "model.mtl";
      document.body.appendChild(mtlAnchorElement);
      mtlAnchorElement.click();
      document.body.removeChild(mtlAnchorElement);
      URL.revokeObjectURL(mtlDownloadUrl);

      const exportedImages = controller.exportImages("model");
      for (const image of exportedImages) {
        if (image.dataUrl.startsWith("data:")) {
          const imgBlob = dataUrlToBlob(image.dataUrl);
          const imgDownloadUrl = URL.createObjectURL(imgBlob);
          const imgAnchor = document.createElement("a");
          imgAnchor.href = imgDownloadUrl;
          imgAnchor.download = image.fileName;
          document.body.appendChild(imgAnchor);
          imgAnchor.click();
          document.body.removeChild(imgAnchor);
          URL.revokeObjectURL(imgDownloadUrl);
        } else if (
          image.dataUrl.startsWith("blob:") ||
          image.dataUrl.startsWith("http")
        ) {
          const imgAnchor = document.createElement("a");
          imgAnchor.href = image.dataUrl;
          imgAnchor.download = image.fileName;
          document.body.appendChild(imgAnchor);
          imgAnchor.click();
          document.body.removeChild(imgAnchor);
        }
      }
    }
  };

  const handleExportZipClick = () => {
    const zipContent = controller.exportModelAsZip();
    const zipBlob = new Blob([new Uint8Array(zipContent)], {
      type: "application/zip",
    });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const anchorElement = document.createElement("a");
    anchorElement.href = downloadUrl;
    anchorElement.download = "model.zip";
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleToggleRenderMode = () => {
    controller.toggleRenderMode();
  };

  const handleToggleAutoConnect = () => {
    controller.toggleAutoConnect();
  };

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

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: "not-allowed",
  };

  return (
    <header
      data-testid="toolbar"
      style={{
        position: "relative",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "48px",
        backgroundColor: ThemeColors.toolbarBackground,
        borderBottom: `1px solid ${ThemeColors.border}`,
        padding: "0 12px",
        boxSizing: "border-box",
        userSelect: "none",
        overflow: "visible",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".obj,.mtl"
          data-testid="file-input"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />
        <input
          ref={mtlFileInputRef}
          type="file"
          accept=".mtl"
          data-testid="mtl-file-input"
          style={{ display: "none" }}
          onChange={handleMtlFileSelected}
        />
        <input
          ref={zipFileInputRef}
          type="file"
          accept=".zip"
          data-testid="zip-file-input"
          style={{ display: "none" }}
          onChange={handleZipFileSelected}
        />
        <FileMenu
          onLoadClick={handleLoadClick}
          onLoadMtlClick={handleLoadMtlClick}
          onImportZipClick={handleImportZipClick}
          onExportClick={handleExportClick}
          onExportZipClick={handleExportZipClick}
          onCustomizeUiClick={onOpenCustomizeUi}
        />
        <button
          data-testid="undo-button"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={canUndo ? buttonStyle : disabledButtonStyle}
        >
          Undo
        </button>
        <button
          data-testid="redo-button"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={canRedo ? buttonStyle : disabledButtonStyle}
        >
          Redo
        </button>
        <button
          data-testid="grid-snap-toggle-button"
          onClick={handleToggleGridSnap}
          title="Toggle Grid Snap"
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
        <button
          data-testid="mode-multi-select-button"
          onClick={handleToggleMultiSelect}
          title="Multi selection"
          style={
            currentMode === "MULTI_SELECT"
              ? {
                  ...buttonStyle,
                  backgroundColor: ThemeColors.accent,
                  color: "#ffffff",
                  borderColor: ThemeColors.accentBorder,
                }
              : buttonStyle
          }
        >
          Multi selection
        </button>
        <button
          data-testid="clear-selection-button"
          onClick={handleClearSelection}
          disabled={!canClearSelection}
          title="Clear selection"
          style={canClearSelection ? buttonStyle : disabledButtonStyle}
        >
          Clear selection
        </button>
        <button
          data-testid="nearest-ortho-view-button"
          onClick={() => controller.orientToNearestOrthographicView()}
          title="Nearest Orthographic View (V)"
          style={buttonStyle}
        >
          Nearest Orthographic View
        </button>
        <button
          data-testid="toggle-view-button"
          onClick={handleToggleRenderMode}
          style={{
            ...buttonStyle,
            backgroundColor: isWireframe ? ThemeColors.accent : ThemeColors.widget,
            color: isWireframe ? "#ffffff" : ThemeColors.textPrimary,
          }}
        >
          {isWireframe ? "Wireframe View" : "Shaded View"}
        </button>
        <button
          data-testid="material-library-button"
          onClick={() => controller.toggleMaterialLibraryPanel()}
          title="Material Library"
          style={{
            ...buttonStyle,
            backgroundColor: isMaterialPanelOpen ? ThemeColors.accent : ThemeColors.widget,
            color: isMaterialPanelOpen ? "#ffffff" : ThemeColors.textPrimary,
            borderColor: isMaterialPanelOpen
              ? ThemeColors.accentBorder
              : ThemeColors.borderStrong,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🎨</span>
          <span>Material Library</span>
        </button>
        {onOpenHelp && (
          <button
            data-testid="help-button"
            onClick={onOpenHelp}
            title="Help & User Guide"
            style={{
              ...buttonStyle,
              padding: "6px 10px",
              fontWeight: 700,
            }}
          >
            ? Help
          </button>
        )}
        {isFaceOrthographic && (
          <button
            data-testid="set-front-button"
            onClick={handleSetFront}
            title="Set current view as front side of face"
            style={{
              ...buttonStyle,
              backgroundColor: ThemeColors.widget,
              color: ThemeColors.textPrimary,
            }}
          >
            Set Front
          </button>
        )}
      </div>

      <div
        data-testid="mode-specific-buttons"
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {hasSelectedFace && (
          <button
            data-testid="add-decal-plane-button"
            onClick={handleAddDecalPlane}
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

        {isDecalSelected && (
          <button
            data-testid="delete-decal-plane-button"
            onClick={handleDeleteDecalPlane}
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

        {(hasSelectedFace || isDecalSelected) && (
          <button
            data-testid="clear-material-button"
            onClick={handleClearMaterial}
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
            onClick={handleToggleAutoConnect}
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

      </div>
    </header>
  );
};
