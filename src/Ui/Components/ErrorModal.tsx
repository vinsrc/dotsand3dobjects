import React, { useState, useEffect } from "react";
import { useAppController } from "../Common/AppContext";

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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          color: "#222222",
          padding: "24px 32px",
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          maxWidth: "400px",
          width: "90%",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            color: "#d32f2f",
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
            color: "#444444",
          }}
        >
          {errorMessage}
        </p>
        <button
          data-testid="error-dismiss-button"
          onClick={handleDismiss}
          style={{
            backgroundColor: "#2196f3",
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
