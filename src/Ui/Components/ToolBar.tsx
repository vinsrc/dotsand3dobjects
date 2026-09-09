import React, { useRef } from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";

export const ToolBar: React.FC = () => {
  const controller = useAppController();
  useApplicationState(["RENDER_MODE_CHANGED", "MODEL_CHANGED"]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isWireframe = controller.getRenderModeService().isWireframe();

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
        padding: "0 16px",
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
          style={{
            padding: "6px 14px",
            backgroundColor: "#ffffff",
            border: "1px solid #999999",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            color: "#333333",
          }}
        >
          Load OBJ
        </button>
        <button
          data-testid="export-obj-button"
          onClick={handleExportClick}
          style={{
            padding: "6px 14px",
            backgroundColor: "#ffffff",
            border: "1px solid #999999",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            color: "#333333",
          }}
        >
          Export OBJ
        </button>
        <button
          data-testid="toggle-view-button"
          onClick={handleToggleRenderMode}
          style={{
            padding: "6px 14px",
            backgroundColor: isWireframe ? "#333333" : "#ffffff",
            color: isWireframe ? "#ffffff" : "#333333",
            border: "1px solid #999999",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {isWireframe ? "Wireframe View" : "Shaded View"}
        </button>
      </div>

      <div
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "#555555",
          letterSpacing: "0.5px",
        }}
      >
        Tool Bar
      </div>
    </header>
  );
};
