import React, { useState, useRef } from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { Material3D } from "../../Application/Services/MaterialService/Material3D";
import { ThemeColors } from "../Common/Theme";

export const MaterialLibraryPanel: React.FC = () => {
  const controller = useAppController();
  useApplicationState([
    "MATERIALS_CHANGED",
    "MATERIAL_PANEL_CHANGED",
    "SELECTION_CHANGED",
    "MODEL_CHANGED",
    "DECALS_CHANGED",
  ]);

  const materialService = controller.getMaterialService();
  const isOpen = materialService.isPanelOpen();
  const dockSide = materialService.getDockSide();
  const materials = materialService.getMaterials();
  const selectedMaterial = materialService.getSelectedMaterial();
  const isDecalSelected = controller.isDecalSelected();
  const selectedFaceCount =
    controller.getSelectedFaceIndices().length ||
    (controller.getSelectedFaceIndex() !== null ? 1 : 0);
  const hasTarget = selectedFaceCount > 0 || isDecalSelected;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  const handleAddMaterial = () => {
    controller.createMaterial();
  };

  const handleDeleteClick = () => {
    if (selectedMaterial) {
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedMaterial) {
      controller.deleteMaterial(selectedMaterial.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedMaterial) {
      controller.updateMaterial(selectedMaterial.withName(event.target.value));
    }
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedMaterial && !selectedMaterial.hasImage()) {
      controller.updateMaterial(
        selectedMaterial.withBaseColor(event.target.value)
      );
    }
  };

  const handleRoughnessChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (selectedMaterial && !selectedMaterial.hasImage()) {
      const roughnessValue = parseFloat(event.target.value);
      controller.updateMaterial(
        selectedMaterial.withRoughness(roughnessValue)
      );
    }
  };

  const handleMetalnessChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (selectedMaterial && !selectedMaterial.hasImage()) {
      const metalnessValue = parseFloat(event.target.value);
      controller.updateMaterial(
        selectedMaterial.withMetalness(metalnessValue)
      );
    }
  };

  const handleImageFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedMaterial) {
      return;
    }
    const file = files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      controller.updateMaterial(
        selectedMaterial.withImage(dataUrl, file.name)
      );
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    if (selectedMaterial) {
      controller.updateMaterial(selectedMaterial.withImage(null, null));
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleAssignToFace = () => {
    if (selectedMaterial) {
      controller.assignMaterialToSelectedFaces(selectedMaterial.id);
    }
  };

  const hasImage = selectedMaterial?.hasImage() ?? false;

  return (
    <div
      data-testid="material-library-panel"
      style={{
        width: "280px",
        height: "100%",
        backgroundColor: ThemeColors.panelBackground,
        borderRight:
          dockSide === "left" ? `1px solid ${ThemeColors.border}` : "none",
        borderLeft:
          dockSide === "right" ? `1px solid ${ThemeColors.border}` : "none",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        zIndex: 50,
        boxShadow: `0 2px 8px ${ThemeColors.shadow}`,
        overflow: "hidden",
      }}
    >
      {/* Topmost header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          backgroundColor: ThemeColors.panelHeaderBackground,
          borderBottom: `1px solid ${ThemeColors.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "15px" }}>🎨</span>
          <span
            style={{
              fontWeight: 600,
              fontSize: "13px",
              color: ThemeColors.textPrimary,
            }}
          >
            Material Library
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            data-testid="add-material-button"
            title="Add new material"
            onClick={handleAddMaterial}
            style={{
              width: "26px",
              height: "26px",
              backgroundColor: ThemeColors.widget,
              border: `1px solid ${ThemeColors.borderStrong}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              color: ThemeColors.textPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            +
          </button>
          <button
            data-testid="delete-material-button"
            title="Delete selected material"
            disabled={!selectedMaterial}
            onClick={handleDeleteClick}
            style={{
              width: "26px",
              height: "26px",
              backgroundColor: selectedMaterial
                ? ThemeColors.widget
                : ThemeColors.listItem,
              border: `1px solid ${ThemeColors.borderStrong}`,
              borderRadius: "4px",
              cursor: selectedMaterial ? "pointer" : "not-allowed",
              opacity: selectedMaterial ? 1 : 0.4,
              fontWeight: "bold",
              fontSize: "12px",
              color: selectedMaterial ? ThemeColors.danger : ThemeColors.textDisabled,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
          <button
            data-testid="dock-material-library-button"
            title={dockSide === "left" ? "Dock to right" : "Dock to left"}
            onClick={() =>
              controller.setMaterialLibraryDockSide(
                dockSide === "left" ? "right" : "left"
              )
            }
            style={{
              width: "26px",
              height: "26px",
              backgroundColor: ThemeColors.widget,
              border: `1px solid ${ThemeColors.borderStrong}`,
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: ThemeColors.textPrimary,
            }}
          >
            {dockSide === "left" ? "⇥" : "⇤"}
          </button>
          <button
            data-testid="close-material-library-button"
            title="Close panel"
            onClick={() => controller.toggleMaterialLibraryPanel()}
            style={{
              width: "26px",
              height: "26px",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              color: ThemeColors.textSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            &times;
          </button>
        </div>
      </div>

      {/* 1) Material list view */}
      <div
        data-testid="material-list-view"
        style={{
          flex: "0 0 140px",
          overflowY: "auto",
          borderBottom: `1px solid ${ThemeColors.border}`,
          backgroundColor: ThemeColors.surface,
          padding: "6px",
        }}
      >
        {materials.length === 0 ? (
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              color: ThemeColors.textMuted,
              fontSize: "12px",
            }}
          >
            No materials created. Click + to add one.
          </div>
        ) : (
          materials.map((mat) => {
            const isSelected = selectedMaterial?.id === mat.id;
            return (
              <div
                key={mat.id}
                data-testid={`material-item-${mat.id}`}
                onClick={() => controller.selectMaterial(mat.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 10px",
                  marginBottom: "4px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: isSelected
                    ? ThemeColors.selectedItem
                    : ThemeColors.listItem,
                  border: isSelected
                    ? `1px solid ${ThemeColors.accent}`
                    : `1px solid ${ThemeColors.borderSubtle}`,
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "3px",
                    backgroundColor: mat.hasImage() ? "#ffffff" : mat.baseColor,
                    backgroundImage: mat.hasImage()
                      ? `url(${mat.imageUrl})`
                      : "none",
                    backgroundSize: "cover",
                    border: `1px solid ${ThemeColors.borderStrong}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: isSelected ? 600 : 400,
                    color: ThemeColors.textPrimary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {mat.name}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* 2) Material detail view */}
      <div
        data-testid="material-detail-view"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {selectedMaterial ? (
          <>
            <div
              data-testid="material-detail-scroll"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
            {/* Material Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: ThemeColors.textSecondary,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                Material Name
              </label>
              <input
                data-testid="material-name-input"
                type="text"
                value={selectedMaterial.name}
                onChange={handleNameChange}
                style={{
                  width: "100%",
                  padding: "5px 8px",
                  fontSize: "12px",
backgroundColor: ThemeColors.widget,
                    border: `1px solid ${ThemeColors.borderStrong}`,
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    color: ThemeColors.textPrimary,
                  }}
              />
            </div>

            {/* Base Color (Albedo) */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: hasImage ? ThemeColors.textDisabled : ThemeColors.textSecondary,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                Base Color (Albedo) {hasImage && "(Disabled: Image set)"}
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  data-testid="material-base-color-input"
                  type="color"
                  value={selectedMaterial.baseColor}
                  disabled={hasImage}
                  onChange={handleColorChange}
                  style={{
                    width: "36px",
                    height: "28px",
                    padding: 0,
                    border: `1px solid ${ThemeColors.borderStrong}`,
                    borderRadius: "4px",
                    cursor: hasImage ? "not-allowed" : "pointer",
                    opacity: hasImage ? 0.4 : 1,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    color: hasImage ? ThemeColors.textDisabled : ThemeColors.textPrimary,
                    fontFamily: "monospace",
                  }}
                >
                  {selectedMaterial.baseColor}
                </span>
              </div>
            </div>

            {/* Roughness */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: hasImage ? ThemeColors.textDisabled : ThemeColors.textSecondary,
                    textTransform: "uppercase",
                  }}
                >
                  Roughness
                </label>
                <span style={{ fontSize: "11px", color: ThemeColors.textSecondary }}>
                  {selectedMaterial.roughness.toFixed(2)}
                </span>
              </div>
              <input
                data-testid="material-roughness-input"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedMaterial.roughness}
                disabled={hasImage}
                onChange={handleRoughnessChange}
                style={{
                  width: "100%",
                  opacity: hasImage ? 0.4 : 1,
                  cursor: hasImage ? "not-allowed" : "pointer",
                }}
              />
            </div>

            {/* Metalness */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: hasImage ? ThemeColors.textDisabled : ThemeColors.textSecondary,
                    textTransform: "uppercase",
                  }}
                >
                  Metalness
                </label>
                <span style={{ fontSize: "11px", color: ThemeColors.textSecondary }}>
                  {selectedMaterial.metalness.toFixed(2)}
                </span>
              </div>
              <input
                data-testid="material-metalness-input"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedMaterial.metalness}
                disabled={hasImage}
                onChange={handleMetalnessChange}
                style={{
                  width: "100%",
                  opacity: hasImage ? 0.4 : 1,
                  cursor: hasImage ? "not-allowed" : "pointer",
                }}
              />
            </div>

            {/* Image / Decal property */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: ThemeColors.textSecondary,
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                Image / Decal Texture
              </label>
              <input
                ref={imageInputRef}
                data-testid="material-image-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                style={{ display: "none" }}
              />
              {hasImage ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px",
                    border: `1px solid ${ThemeColors.borderStrong}`,
                    borderRadius: "4px",
                    backgroundColor: ThemeColors.widget,
                  }}
                >
                  <img
                    src={selectedMaterial.imageUrl || ""}
                    alt="Material texture preview"
                    style={{
                      width: "36px",
                      height: "36px",
                      objectFit: "cover",
                      borderRadius: "3px",
                      border: `1px solid ${ThemeColors.borderSubtle}`,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: "11px",
                      color: ThemeColors.textSecondary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedMaterial.imageFileName || "Image Set (Decal)"}
                  </span>
                  <button
                    data-testid="clear-material-image-button"
                    title="Clear image"
                    onClick={handleClearImage}
                    style={{
                      padding: "3px 8px",
                      backgroundColor: ThemeColors.dangerBackground,
                      color: ThemeColors.danger,
                      border: `1px solid ${ThemeColors.dangerBorder}`,
                      borderRadius: "3px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Clear
                  </button>
                </div>
              ) : (
                <button
                  data-testid="material-image-upload-button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    width: "100%",
                    padding: "6px",
                    backgroundColor: ThemeColors.widget,
                    border: `1px dashed ${ThemeColors.borderStrong}`,
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: ThemeColors.textSecondary,
                    cursor: "pointer",
                  }}
                >
                  📁 Set Image File...
                </button>
              )}
            </div>
            </div>

            {/* Assign to Selected Face(s) / Decal */}
            <div
              data-testid="assign-button-anchor"
              style={{
                padding: "12px",
                borderTop: `1px solid ${ThemeColors.borderSubtle}`,
                backgroundColor: ThemeColors.panelBackground,
              }}
            >
              <button
                data-testid="assign-material-button"
                onClick={handleAssignToFace}
                disabled={!hasTarget}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor:
                    hasTarget
                      ? ThemeColors.success
                      : ThemeColors.disabledSolid,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: hasTarget ? "pointer" : "not-allowed",
                  boxShadow:
                    hasTarget
                      ? "0 2px 4px rgba(63,185,80,0.3)"
                      : "none",
                }}
              >
                {isDecalSelected
                  ? "Assign to Decal Plane"
                  : selectedFaceCount > 0
                  ? `Assign to Selected Face (${selectedFaceCount})`
                  : "Select Face to Assign"}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: ThemeColors.textMuted,
              fontSize: "12px",
              margin: "auto 0",
              padding: "12px",
            }}
          >
            Select a material above to edit its properties.
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          data-testid="delete-material-confirm-backdrop"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            data-testid="delete-material-confirm-modal"
            style={{
              backgroundColor: ThemeColors.surface,
              padding: "16px",
              borderRadius: "6px",
              boxShadow: `0 4px 16px ${ThemeColors.shadow}`,
              width: "100%",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                margin: "0 0 14px 0",
                color: ThemeColors.textPrimary,
              }}
            >
              Delete <strong>{selectedMaterial?.name}</strong>?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <button
                data-testid="confirm-delete-material-button"
                onClick={handleConfirmDelete}
                style={{
                  padding: "5px 12px",
                  backgroundColor: ThemeColors.danger,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
              <button
                data-testid="cancel-delete-material-button"
                onClick={handleCancelDelete}
                style={{
                  padding: "5px 12px",
                  backgroundColor: ThemeColors.widget,
                  color: ThemeColors.textPrimary,
                  border: `1px solid ${ThemeColors.borderStrong}`,
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
