import React, { useMemo, useRef, useState } from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { FileMenu } from "./FileMenu";
import { ThemeColors } from "../Common/Theme";
import { UndoIcon, RedoIcon, HelpIcon } from "./ToolBarIcons";
import { ModeSpecificButtons } from "./ModeSpecificButtons";
import { SaveProjectModal } from "./SaveProjectModal";
import { LoadProjectModal } from "./LoadProjectModal";
import { FileOperationsHandler } from "./FileOperationsHandler";

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
    "CLONE_CHANGED",
  ]);

  const fileOperationsHandler = useMemo(
    () => new FileOperationsHandler(controller),
    [controller]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mtlFileInputRef = useRef<HTMLInputElement>(null);
  const zipFileInputRef = useRef<HTMLInputElement>(null);
  const saveFileInputRef = useRef<HTMLInputElement>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);

  const isWireframe = controller.getRenderModeService().isWireframe();
  const isMaterialPanelOpen = controller.isMaterialLibraryPanelOpen();
  const isPerspectiveView = !controller.getCameraStateService().isOrthographic();
  const currentMode = controller.getEditorModeService().getMode();
  const isAutoConnect = controller.getEditorModeService().isAutoConnectEnabled();
  const isClone = controller.isCloneEnabled();
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
  const isFaceOrthographic = controller.isFaceOrthographicView();
  const activeFaceIndex = isFaceOrthographic
    ? controller.getCameraStateService().getActiveFaceIndex()
    : null;
  const hasDecalOnFace =
    isFaceOrthographic &&
    activeFaceIndex !== null &&
    controller.getDecals().some((d) => d.parentFaceIndex === activeFaceIndex);
  const canDeleteDecal = isDecalSelected || hasDecalOnFace;
  const selectedEdgeCount = controller.getSelectedEdges().length;
  const hasSelectedEdge = selectedEdgeCount > 0 && !isDecalSelected;
  const canClearSelection =
    selectedVertexCount > 0 ||
    hasSelectedEdge ||
    hasSelectedFace ||
    canDeleteDecal;

  const handleSaveMenuClick = () => {
    if (controller.needsProjectSaveName()) {
      setIsSaveModalOpen(true);
    } else {
      controller.saveProject();
    }
  };

  const handleConfirmSaveModal = (saveName: string) => {
    setIsSaveModalOpen(false);
    controller.saveProject(saveName);
  };

  const handleSelectProjectToLoad = (saveId: string) => {
    setIsLoadModalOpen(false);
    controller.loadProjectSave(saveId);
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
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "48px",
        flexShrink: 0,
        backgroundColor: ThemeColors.toolbarBackground,
        borderBottom: `1px solid ${ThemeColors.border}`,
        padding: "4px 12px",
        paddingTop: "max(6px, env(safe-area-inset-top, 6px))",
        paddingBottom: "6px",
        boxSizing: "border-box",
        userSelect: "none",
        overflow: "visible",
        gap: "4px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: "1 1 auto",
          minWidth: 0,
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".obj,.mtl"
          data-testid="file-input"
          style={{ display: "none" }}
          onChange={(event) => fileOperationsHandler.handleFileSelected(event)}
        />
        <input
          ref={mtlFileInputRef}
          type="file"
          accept=".mtl"
          data-testid="mtl-file-input"
          style={{ display: "none" }}
          onChange={(event) => fileOperationsHandler.handleMtlFileSelected(event)}
        />
        <input
          ref={zipFileInputRef}
          type="file"
          accept=".zip"
          data-testid="zip-file-input"
          style={{ display: "none" }}
          onChange={(event) => fileOperationsHandler.handleZipFileSelected(event)}
        />
        <input
          ref={saveFileInputRef}
          type="file"
          accept=".json,application/json"
          data-testid="save-file-input"
          style={{ display: "none" }}
          onChange={(event) => fileOperationsHandler.handleSaveFileSelected(event)}
        />
        <FileMenu
          onLoadClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
              fileInputRef.current.click();
            }
          }}
          onLoadMtlClick={() => {
            if (mtlFileInputRef.current) {
              mtlFileInputRef.current.value = "";
              mtlFileInputRef.current.click();
            }
          }}
          onImportZipClick={() => {
            if (zipFileInputRef.current) {
              zipFileInputRef.current.value = "";
              zipFileInputRef.current.click();
            }
          }}
          onExportClick={() => fileOperationsHandler.exportModelAndMaterials()}
          onExportZipClick={() => fileOperationsHandler.exportZip()}
          onSaveClick={handleSaveMenuClick}
          onLoadProjectClick={() => setIsLoadModalOpen(true)}
          onExportSaveFileClick={() => fileOperationsHandler.exportProjectSaveFile()}
          onLoadSaveFileClick={() => {
            if (saveFileInputRef.current) {
              saveFileInputRef.current.value = "";
              saveFileInputRef.current.click();
            }
          }}
          onCustomizeUiClick={onOpenCustomizeUi}
        />
        <button
          data-testid="undo-button"
          onClick={() => controller.undo()}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
          style={{
            ...(canUndo ? buttonStyle : disabledButtonStyle),
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 10px",
          }}
        >
          <UndoIcon />
        </button>
        <button
          data-testid="redo-button"
          onClick={() => controller.redo()}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
          style={{
            ...(canRedo ? buttonStyle : disabledButtonStyle),
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 10px",
          }}
        >
          <RedoIcon />
        </button>
        <button
          data-testid="grid-snap-toggle-button"
          onClick={() => controller.toggleGridSnap()}
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
          onClick={() => {
            if (currentMode === "MULTI_SELECT") {
              controller.finishMode();
            } else {
              controller.enterMode("MULTI_SELECT");
            }
          }}
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
          onClick={() => controller.clearSelection()}
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
          data-testid="perspective-view-button"
          onClick={() => controller.switchToDefaultPerspectiveView()}
          title="Perspective View"
          style={{
            ...buttonStyle,
            backgroundColor: isPerspectiveView ? ThemeColors.accent : ThemeColors.widget,
            color: isPerspectiveView ? "#ffffff" : ThemeColors.textPrimary,
            borderColor: isPerspectiveView
              ? ThemeColors.accentBorder
              : ThemeColors.borderStrong,
          }}
        >
          Perspective View
        </button>
        <button
          data-testid="toggle-view-button"
          onClick={() => controller.toggleRenderMode()}
          title="Toggle Wireframe"
          style={{
            ...buttonStyle,
            backgroundColor: isWireframe ? ThemeColors.accent : ThemeColors.widget,
            color: isWireframe ? "#ffffff" : ThemeColors.textPrimary,
            borderColor: isWireframe
              ? ThemeColors.accentBorder
              : ThemeColors.borderStrong,
          }}
        >
          Wireframe
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
            aria-label="Help"
            style={{
              ...buttonStyle,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 10px",
            }}
          >
            <HelpIcon />
          </button>
        )}
      </div>

      <ModeSpecificButtons
        isDecalSelected={isDecalSelected}
        hasSelectedFace={hasSelectedFace}
        canDeleteDecal={canDeleteDecal}
        currentMode={currentMode}
        isAutoConnect={isAutoConnect}
        isClone={isClone}
        onSelectParentFace={() => controller.selectParentFace()}
        onFlipFace={() => controller.flipFace()}
        onAddDecalPlane={() => controller.addDecalPlaneToSelectedFace()}
        onDeleteDecalPlane={() => controller.deleteSelectedDecal()}
        onClearMaterial={() => controller.clearMaterialOnSelectedFaces()}
        onToggleAutoConnect={() => controller.toggleAutoConnect()}
        onToggleClone={() => controller.toggleClone()}
      />

      <SaveProjectModal
        isOpen={isSaveModalOpen}
        suggestedName={controller.getActiveProjectSaveName() ?? "Untitled Project"}
        onCancel={() => setIsSaveModalOpen(false)}
        onSave={handleConfirmSaveModal}
      />

      <LoadProjectModal
        isOpen={isLoadModalOpen}
        saves={isLoadModalOpen ? controller.listProjectSaves() : []}
        onSelectSave={handleSelectProjectToLoad}
        onClose={() => setIsLoadModalOpen(false)}
      />
    </header>
  );
};
