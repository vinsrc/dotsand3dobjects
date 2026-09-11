import React, { useRef } from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { FileMenu } from "./FileMenu";

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
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mtlFileInputRef = useRef<HTMLInputElement>(null);
  const isWireframe = controller.getRenderModeService().isWireframe();
  const isMaterialPanelOpen = controller.isMaterialLibraryPanelOpen();
  const isFaceOrthographic = controller.isFaceOrthographicView();
  const currentMode = controller.getEditorModeService().getMode();
  const isAutoConnect = controller.getEditorModeService().isAutoConnectEnabled();
  const selectedVertexCount = controller
    .getSelectionService()
    .getSelectedIndices().length;
  const canFillFace = selectedVertexCount >= 3;

  const handleSetFront = () => {
    controller.setFaceFront();
  };

  const handleFaceFill = () => {
    controller.createFaceFromSelectedVertices();
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
      const mtlContent = controller.exportMtlFile();
      const mtlBlob = new Blob([mtlContent], { type: "text/plain" });
      const mtlDownloadUrl = URL.createObjectURL(mtlBlob);
      const mtlAnchorElement = document.createElement("a");
      mtlAnchorElement.href = mtlDownloadUrl;
      mtlAnchorElement.download = "model.mtl";
      document.body.appendChild(mtlAnchorElement);
      mtlAnchorElement.click();
      document.body.removeChild(mtlAnchorElement);
      URL.revokeObjectURL(mtlDownloadUrl);
    }
  };

  const handleToggleRenderMode = () => {
    controller.toggleRenderMode();
  };

  const handleToggleAutoConnect = () => {
    controller.toggleAutoConnect();
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
        backgroundColor: "#e0e0e0",
        borderBottom: "1px solid #c0c0c0",
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
        <FileMenu
          onLoadClick={handleLoadClick}
          onLoadMtlClick={handleLoadMtlClick}
          onExportClick={handleExportClick}
          onCustomizeUiClick={onOpenCustomizeUi}
        />
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
          data-testid="material-library-button"
          onClick={() => controller.toggleMaterialLibraryPanel()}
          title="Material Library"
          style={{
            ...buttonStyle,
            backgroundColor: isMaterialPanelOpen ? "#2196f3" : "#ffffff",
            color: isMaterialPanelOpen ? "#ffffff" : "#333333",
            borderColor: isMaterialPanelOpen ? "#1976d2" : "#999999",
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
              backgroundColor: "#ffffff",
              color: "#333333",
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
      </div>
    </header>
  );
};
