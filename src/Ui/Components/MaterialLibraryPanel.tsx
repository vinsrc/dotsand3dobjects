import React, { useState, useRef } from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { Material3D } from "../../Application/Services/MaterialService/Material3D";

export const MaterialLibraryPanel: React.FC = () => {
  const controller = useAppController();
  useApplicationState([
    "MATERIALS_CHANGED",
    "MATERIAL_PANEL_CHANGED",
    "SELECTION_CHANGED",
    "MODEL_CHANGED",
  ]);

  const materialService = controller.getMaterialService();
  const isOpen = materialService.isPanelOpen();
  const dockSide = materialService.getDockSide();
  const materials = materialService.getMaterials();
  const selectedMaterial = materialService.getSelectedMaterial();
  const selectedFaceCount =
    controller.getSelectedFaceIndices().length ||
    (controller.getSelectedFaceIndex() !== null ? 1 : 0);

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
      controller.updateMaterial(selectedMaterial.withImage(dataUrl));
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    if (selectedMaterial) {
      controller.updateMaterial(selectedMaterial.withImage(null));
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
        backgroundColor: "#fcfcfc",
        borderRight: dockSide === "left" ? "1px solid #d0d0d0" : "none",
        borderLeft: dockSide === "right" ? "1px solid #d0d0d0" : "none",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        zIndex: 50,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
          backgroundColor: "#ebebeb",
          borderBottom: "1px solid #d0d0d0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "15px" }}>🎨</span>
          <span style={{ fontWeight: 600, fontSize: "13px", color: "#333333" }}>
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
              backgroundColor: "#ffffff",
              border: "1px solid #aaaaaa",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
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
              backgroundColor: selectedMaterial ? "#ffffff" : "#f0f0f0",
              border: "1px solid #aaaaaa",
              borderRadius: "4px",
              cursor: selectedMaterial ? "pointer" : "not-allowed",
              opacity: selectedMaterial ? 1 : 0.4,
              fontWeight: "bold",
              fontSize: "12px",
              color: selectedMaterial ? "#d32f2f" : "#999999",
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
              backgroundColor: "#ffffff",
              border: "1px solid #aaaaaa",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#333333",
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
              color: "#666666",
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
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#ffffff",
          padding: "6px",
        }}
      >
        {materials.length === 0 ? (
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#888888",
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
                  backgroundColor: isSelected ? "#e3f2fd" : "#f8f8f8",
                  border: isSelected
                    ? "1px solid #2196f3"
                    : "1px solid #eeeeee",
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
                    border: "1px solid #bbbbbb",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: isSelected ? 600 : 400,
                    color: "#333333",
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
          overflowY: "auto",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {selectedMaterial ? (
          <>
            {/* Material Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#666666",
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
                  border: "1px solid #cccccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
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
                  color: hasImage ? "#aaaaaa" : "#666666",
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
                    border: "1px solid #cccccc",
                    borderRadius: "4px",
                    cursor: hasImage ? "not-allowed" : "pointer",
                    opacity: hasImage ? 0.4 : 1,
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    color: hasImage ? "#aaaaaa" : "#444444",
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
                    color: hasImage ? "#aaaaaa" : "#666666",
                    textTransform: "uppercase",
                  }}
                >
                  Roughness
                </label>
                <span style={{ fontSize: "11px", color: "#666666" }}>
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
                    color: hasImage ? "#aaaaaa" : "#666666",
                    textTransform: "uppercase",
                  }}
                >
                  Metalness
                </label>
                <span style={{ fontSize: "11px", color: "#666666" }}>
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
                  color: "#666666",
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
                    border: "1px solid #cccccc",
                    borderRadius: "4px",
                    backgroundColor: "#ffffff",
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
                      border: "1px solid #dddddd",
                    }}
                  />
                  <span style={{ flex: 1, fontSize: "11px", color: "#555555" }}>
                    Image Set (Decal)
                  </span>
                  <button
                    data-testid="clear-material-image-button"
                    title="Clear image"
                    onClick={handleClearImage}
                    style={{
                      padding: "3px 8px",
                      backgroundColor: "#ffebee",
                      color: "#d32f2f",
                      border: "1px solid #ffcdd2",
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
                    backgroundColor: "#ffffff",
                    border: "1px dashed #aaaaaa",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#555555",
                    cursor: "pointer",
                  }}
                >
                  📁 Set Image File...
                </button>
              )}
            </div>

            {/* Assign to Selected Face(s) */}
            <div style={{ marginTop: "auto", paddingTop: "12px" }}>
              <button
                data-testid="assign-material-button"
                onClick={handleAssignToFace}
                disabled={selectedFaceCount === 0}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor:
                    selectedFaceCount > 0 ? "#4caf50" : "#cccccc",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: selectedFaceCount > 0 ? "pointer" : "not-allowed",
                  boxShadow:
                    selectedFaceCount > 0
                      ? "0 2px 4px rgba(76,175,80,0.3)"
                      : "none",
                }}
              >
                {selectedFaceCount > 0
                  ? `Assign to Selected Face (${selectedFaceCount})`
                  : "Select Face to Assign"}
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "#888888",
              fontSize: "12px",
              margin: "auto 0",
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
              backgroundColor: "#ffffff",
              padding: "16px",
              borderRadius: "6px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              width: "100%",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                margin: "0 0 14px 0",
                color: "#333333",
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
                  backgroundColor: "#d32f2f",
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
                  backgroundColor: "#eeeeee",
                  color: "#333333",
                  border: "1px solid #cccccc",
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
