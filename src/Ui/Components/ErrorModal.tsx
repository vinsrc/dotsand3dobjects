import React, { useState, useEffect } from "react";
import { useAppController } from "../Common/AppContext";
import { ThemeColors } from "../Common/Theme";

export const ErrorModal: React.FC = () => {
  const controller = useAppController();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = controller
      .getStateNotifier()
      .subscribe("ERROR_OCCURRED", (payload) => {
        const messageText =
          typeof payload === "string" ? payload : "Unsupported error";
        setErrorMessage(messageText);
      });

    return () => {
      unsubscribe();
    };
  }, [controller]);

  if (!errorMessage) {
    return null;
  }

  const handleDismiss = () => {
    setErrorMessage(null);
  };

  return (
    <div
      data-testid="error-dialog"
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
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: ThemeColors.surface,
          color: ThemeColors.textPrimary,
          padding: "24px 32px",
          borderRadius: "8px",
          boxShadow: `0 8px 24px ${ThemeColors.shadow}`,
          maxWidth: "400px",
          width: "90%",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            color: ThemeColors.danger,
            fontSize: "1.25rem",
          }}
        >
          Error
        </h3>
        <p
          data-testid="error-message"
          style={{
            margin: "0 0 20px 0",
            fontSize: "1rem",
            color: ThemeColors.textSecondary,
          }}
        >
          {errorMessage}
        </p>
        <button
          data-testid="error-dismiss-button"
          onClick={handleDismiss}
          style={{
            backgroundColor: ThemeColors.accent,
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "8px 20px",
            fontSize: "0.95rem",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};
