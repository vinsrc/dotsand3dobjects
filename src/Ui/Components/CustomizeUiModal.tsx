import React, { useState, useEffect } from "react";
import { useAppController } from "../Common/AppContext";
import { DockSide } from "../../Application/Services/UiCustomizationService/UiCustomizationService";
import { ThemeColors } from "../Common/Theme";

export interface CustomizeUiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomizeUiModal: React.FC<CustomizeUiModalProps> = ({
  isOpen,
  onClose,
}) => {
  const controller = useAppController();
  const customizationService = controller.getUiCustomizationService();

  const [sideToolBarDock, setSideToolBarDock] = useState<DockSide>("right");
  const [materialLibraryDock, setMaterialLibraryDock] =
    useState<DockSide>("right");

  useEffect(() => {
    if (isOpen) {
      const settings = customizationService.getSettings();
      setSideToolBarDock(settings.sideToolBarDock);
      setMaterialLibraryDock(settings.materialLibraryDock);
    }
  }, [isOpen, customizationService]);

  if (!isOpen) {
    return null;
  }

  const isSideToolBarOn = sideToolBarDock === "right";
  const isMaterialLibraryOn = materialLibraryDock === "right";

  const handleToggleSideToolBar = () => {
    setSideToolBarDock((current) => (current === "right" ? "left" : "right"));
  };

  const handleToggleMaterialLibrary = () => {
    setMaterialLibraryDock((current) =>
      current === "right" ? "left" : "right"
    );
  };

  const handleSave = () => {
    controller.saveUiCustomization(sideToolBarDock, materialLibraryDock);
    onClose();
  };

  const toggleButtonStyle = (isActive: boolean): React.CSSProperties => ({
    position: "relative",
    width: "48px",
    height: "26px",
    backgroundColor: isActive ? ThemeColors.accent : ThemeColors.widget,
    borderRadius: "13px",
    border: "none",
    cursor: "pointer",
    padding: 0,
    outline: "none",
    transition: "background-color 0.2s ease",
  });

  const toggleKnobStyle = (isActive: boolean): React.CSSProperties => ({
    position: "absolute",
    top: "3px",
    left: isActive ? "25px" : "3px",
    width: "20px",
    height: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "50%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    transition: "left 0.2s ease",
  });

  return (
    <div
      data-testid="customize-ui-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: ThemeColors.backdrop,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        data-testid="customize-ui-modal"
        style={{
          backgroundColor: ThemeColors.surface,
          borderRadius: "8px",
          width: "440px",
          maxWidth: "90vw",
          display: "flex",
          flexDirection: "column",
          boxShadow: `0 8px 32px ${ThemeColors.shadow}`,
          overflow: "hidden",
        }}
        onClick={(event) => event.stopPropagation()}
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
            style={{ margin: 0, fontSize: "17px", color: ThemeColors.textPrimary }}
          >
            Customize UI
          </h2>
          <button
            data-testid="customize-ui-modal-close-icon"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: ThemeColors.textSecondary,
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Side Tool Bar Field */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: ThemeColors.textPrimary,
              }}
            >
              Side Tool Bar:
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: !isSideToolBarOn
                    ? ThemeColors.accentLight
                    : ThemeColors.textMuted,
                  fontWeight: !isSideToolBarOn ? 600 : 400,
                  cursor: "pointer",
                }}
                onClick={() => setSideToolBarDock("left")}
              >
                Left Side
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isSideToolBarOn}
                data-testid="side-toolbar-toggle-button"
                onClick={handleToggleSideToolBar}
                style={toggleButtonStyle(isSideToolBarOn)}
                title={`Dock to ${isSideToolBarOn ? "Right Side" : "Left Side"}`}
              >
                <div style={toggleKnobStyle(isSideToolBarOn)} />
              </button>
              <span
                style={{
                  fontSize: "13px",
                  color: isSideToolBarOn
                    ? ThemeColors.accentLight
                    : ThemeColors.textMuted,
                  fontWeight: isSideToolBarOn ? 600 : 400,
                  cursor: "pointer",
                }}
                onClick={() => setSideToolBarDock("right")}
              >
                Right Side
              </span>
            </div>
          </div>

          {/* Material Library Field */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: ThemeColors.textPrimary,
              }}
            >
              Material Library:
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: !isMaterialLibraryOn
                    ? ThemeColors.accentLight
                    : ThemeColors.textMuted,
                  fontWeight: !isMaterialLibraryOn ? 600 : 400,
                  cursor: "pointer",
                }}
                onClick={() => setMaterialLibraryDock("left")}
              >
                Left Side
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isMaterialLibraryOn}
                data-testid="material-library-toggle-button"
                onClick={handleToggleMaterialLibrary}
                style={toggleButtonStyle(isMaterialLibraryOn)}
                title={`Dock to ${isMaterialLibraryOn ? "Right Side" : "Left Side"}`}
              >
                <div style={toggleKnobStyle(isMaterialLibraryOn)} />
              </button>
              <span
                style={{
                  fontSize: "13px",
                  color: isMaterialLibraryOn
                    ? ThemeColors.accentLight
                    : ThemeColors.textMuted,
                  fontWeight: isMaterialLibraryOn ? 600 : 400,
                  cursor: "pointer",
                }}
                onClick={() => setMaterialLibraryDock("right")}
              >
                Right Side
              </span>
            </div>
          </div>
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
            data-testid="customize-ui-close-button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: ThemeColors.widget,
              border: `1px solid ${ThemeColors.borderStrong}`,
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              color: ThemeColors.textPrimary,
            }}
          >
            Close
          </button>
          <button
            data-testid="customize-ui-save-button"
            onClick={handleSave}
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
      </div>
    </div>
  );
};
