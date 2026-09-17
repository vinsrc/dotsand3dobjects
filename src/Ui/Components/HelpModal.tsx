import React from "react";
import { ThemeColors } from "../Common/Theme";

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
        right: 0,
        bottom: 0,
        backgroundColor: ThemeColors.backdrop,
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
          backgroundColor: ThemeColors.surface,
          borderRadius: "8px",
          width: "560px",
          maxWidth: "90vw",
          maxHeight: "calc(100dvh - 32px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 8px 32px ${ThemeColors.shadow}`,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${ThemeColors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: ThemeColors.panelHeaderBackground,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              color: ThemeColors.textPrimary,
            }}
          >
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
              color: ThemeColors.textSecondary,
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
            color: ThemeColors.textSecondary,
          }}
        >
          <h3
            style={{ marginTop: 0, color: ThemeColors.textPrimary }}
          >🎨 Material Library</h3>
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

          <h3 style={{ color: ThemeColors.textPrimary }}>🧭 Viewport Navigation</h3>
          <ul>
            <li><strong>Rotate</strong>: Drag with mouse or single finger in perspective mode or Translate mode (when no vertex is selected).</li>
            <li><strong>Snap View</strong>: Double-click empty space to snap to the closest orthographic view (+X, +Y, +Z, etc.). Double-click a mesh face to rotate into that face's orthographic view.</li>
            <li><strong>Pan & Zoom</strong>: Use mouse wheel to zoom, or two-finger pinch and drag on touch screens.</li>
          </ul>

          <h3 style={{ color: ThemeColors.textPrimary }}>🛠️ Editor Modes</h3>
          <ul>
            <li><strong>Default</strong>: Click vertices to select. Click faces to select.</li>
            <li><strong>Multi-Select</strong>: Toggle selection of multiple vertices and faces.</li>
            <li><strong>Move Vertex</strong>: Move selected vertices on orthographic grid.</li>
            <li><strong>Transform</strong>: Rotate, scale, or move mesh or selected decal plane in orthographic view using handles.</li>
            <li><strong>New Vertex</strong>: Add vertices on grid or split edges.</li>
            <li><strong>Draw Edge</strong>: Connect vertices with edges.</li>
          </ul>
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${ThemeColors.border}`,
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: ThemeColors.panelHeaderBackground,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "6px 16px",
              backgroundColor: ThemeColors.accent,
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
