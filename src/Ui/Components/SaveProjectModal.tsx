import React, { useEffect, useState } from "react";
import { ThemeColors } from "../Common/Theme";

export interface SaveProjectModalProps {
  isOpen: boolean;
  suggestedName: string;
  onCancel: () => void;
  onSave: (saveName: string) => void;
}

export const SaveProjectModal: React.FC<SaveProjectModalProps> = ({
  isOpen,
  suggestedName,
  onCancel,
  onSave,
}) => {
  const [saveName, setSaveName] = useState<string>(suggestedName);

  useEffect(() => {
    if (isOpen) {
      setSaveName(suggestedName);
    }
  }, [isOpen, suggestedName]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(saveName.trim());
  };

  return (
    <div
      data-testid="save-project-backdrop"
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
      onClick={onCancel}
    >
      <form
        data-testid="save-project-modal"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        style={{
          backgroundColor: ThemeColors.surface,
          borderRadius: "8px",
          width: "400px",
          maxWidth: "90vw",
          boxShadow: `0 8px 32px ${ThemeColors.shadow}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${ThemeColors.border}`,
            backgroundColor: ThemeColors.panelHeaderBackground,
          }}
        >
          <h2
            style={{ margin: 0, fontSize: "17px", color: ThemeColors.textPrimary }}
          >
            Save Project
          </h2>
        </div>
        <div style={{ padding: "20px" }}>
          <label
            htmlFor="project-save-name-input"
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: ThemeColors.textPrimary,
            }}
          >
            Save name
          </label>
          <input
            id="project-save-name-input"
            data-testid="save-project-name-input"
            type="text"
            value={saveName}
            autoFocus
            onChange={(event) => setSaveName(event.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 10px",
              border: `1px solid ${ThemeColors.borderStrong}`,
              borderRadius: "4px",
              fontSize: "14px",
              color: ThemeColors.textPrimary,
              backgroundColor: ThemeColors.widget,
            }}
          />
        </div>
        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${ThemeColors.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            backgroundColor: ThemeColors.panelHeaderBackground,
          }}
        >
          <button
            type="button"
            data-testid="save-project-cancel-button"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              backgroundColor: ThemeColors.widget,
              border: `1px solid ${ThemeColors.borderStrong}`,
              borderRadius: "4px",
              fontSize: "13px",
              cursor: "pointer",
              color: ThemeColors.textPrimary,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="save-project-confirm-button"
            style={{
              padding: "8px 18px",
              backgroundColor: ThemeColors.accent,
              border: `1px solid ${ThemeColors.accentBorder}`,
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              color: "#ffffff",
            }}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};
