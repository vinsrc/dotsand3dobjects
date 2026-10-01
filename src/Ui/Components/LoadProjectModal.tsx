import React from "react";
import { ThemeColors } from "../Common/Theme";
import { ProjectSaveListItem } from "../../Application/Services/ProjectSaveService/ProjectSaveDocument";

export interface LoadProjectModalProps {
  isOpen: boolean;
  saves: readonly ProjectSaveListItem[];
  onSelectSave: (saveId: string) => void;
  onClose: () => void;
}

export const LoadProjectModal: React.FC<LoadProjectModalProps> = ({
  isOpen,
  saves,
  onSelectSave,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return isoString;
    }
  };

  return (
    <div
      data-testid="load-project-backdrop"
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
        data-testid="load-project-modal"
        onClick={(event) => event.stopPropagation()}
        style={{
          backgroundColor: ThemeColors.surface,
          borderRadius: "8px",
          width: "480px",
          maxWidth: "90vw",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 8px 32px ${ThemeColors.shadow}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${ThemeColors.border}`,
            backgroundColor: ThemeColors.panelHeaderBackground,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "17px",
              color: ThemeColors.textPrimary,
            }}
          >
            Load Saved Project
          </h2>
          <button
            type="button"
            data-testid="load-project-close-button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              lineHeight: 1,
              cursor: "pointer",
              color: ThemeColors.textSecondary,
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: "16px 20px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {saves.length === 0 ? (
            <div
              data-testid="no-saved-projects-message"
              style={{
                padding: "24px",
                textAlign: "center",
                color: ThemeColors.textSecondary,
                fontSize: "14px",
              }}
            >
              No saved projects found in browser storage.
            </div>
          ) : (
            <div
              data-testid="saved-projects-list"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {saves.map((item) => (
                <div
                  key={item.id}
                  data-testid={`saved-project-item-${item.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    backgroundColor: ThemeColors.widget,
                    border: `1px solid ${ThemeColors.border}`,
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onClick={() => onSelectSave(item.id)}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: ThemeColors.textPrimary,
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: ThemeColors.textSecondary,
                      }}
                    >
                      {formatTimestamp(item.savedAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-testid={`load-saved-project-btn-${item.id}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectSave(item.id);
                    }}
                    style={{
                      padding: "6px 14px",
                      backgroundColor: ThemeColors.accent,
                      border: `1px solid ${ThemeColors.accentBorder}`,
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "#ffffff",
                    }}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
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
            type="button"
            data-testid="load-project-cancel-button"
            onClick={onClose}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
