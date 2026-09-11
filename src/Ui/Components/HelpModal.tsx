import React from "react";

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      data-testid="help-modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        data-testid="help-modal"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          width: "560px",
          maxWidth: "90vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f7f7f7",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", color: "#333333" }}>
            WireframeVibe3D - Help & User Guide
          </h2>
          <button
            data-testid="help-modal-close-button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666666",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        <div
          style={{
            padding: "20px",
            overflowY: "auto",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#444444",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#222222" }}>🎨 Material Library</h3>
          <p>
            The <strong>Material Library</strong> panel lets you create, customize, and assign PBR materials to mesh faces:
          </p>
          <ul>
            <li>
              <strong>Open/Close</strong>: Toggle the Material Library button on the top toolbar or select a face in the viewport.
            </li>
            <li>
              <strong>Create & Delete</strong>: Click <code>+</code> to add a new auto-numbered material. Click <code>&times;</code> to delete the selected material (requires confirmation).
            </li>
            <li>
              <strong>PBR Properties</strong>: Edit Material Name, Base Color (Albedo), Roughness, and Metalness. Changes update automatically.
            </li>
            <li>
              <strong>Image / Decal Textures</strong>: Set an image file to apply a decal to the face. When an image is set, Base Color, Roughness, and Metalness are disabled. Click <code>&times;</code> to clear the image and re-enable properties.
            </li>
            <li>
              <strong>Assign to Faces</strong>: Select a face (or multiple faces in Multi-Select mode) and click <em>Assign to Face</em>.
            </li>
          </ul>

          <h3 style={{ color: "#222222" }}>🧭 Viewport Navigation</h3>
          <ul>
            <li><strong>Rotate</strong>: Drag with mouse or single finger in perspective mode or Translate mode (when no vertex is selected).</li>
            <li><strong>Snap View</strong>: Double-click empty space to snap to the closest orthographic view (+X, +Y, +Z, etc.). Double-click a mesh face to rotate into that face's orthographic view.</li>
            <li><strong>Pan & Zoom</strong>: Use mouse wheel to zoom, or two-finger pinch and drag on touch screens.</li>
          </ul>

          <h3 style={{ color: "#222222" }}>🛠️ Editor Modes</h3>
          <ul>
            <li><strong>Default</strong>: Click vertices to select. Click faces to select.</li>
            <li><strong>Multi-Select</strong>: Toggle selection of multiple vertices and faces.</li>
            <li><strong>Translate</strong>: Move selected vertices on orthographic grid.</li>
            <li><strong>Insert</strong>: Add vertices on grid or split edges.</li>
            <li><strong>Fill</strong>: Connect vertices and create faces.</li>
          </ul>
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: "#f7f7f7",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "6px 16px",
              backgroundColor: "#2196f3",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
