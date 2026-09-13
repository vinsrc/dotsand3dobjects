import React, { useState, useEffect, useRef } from "react";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { ThemeColors } from "../Common/Theme";

export const TransformDimensionDialog: React.FC = () => {
  const controller = useAppController();
  useApplicationState(["MODE_CHANGED"]);

  const currentMode = controller.getEditorModeService().getMode();
  const isDecalSelected = controller.isDecalSelected();

  const [dimX, setDimX] = useState<string>("0");
  const [dimY, setDimY] = useState<string>("0");
  const [dimZ, setDimZ] = useState<string>("0");
  const [decalSize, setDecalSize] = useState<string>("0");
  const [isUniform, setIsUniform] = useState<boolean>(true);

  const isInputFocusedRef = useRef<boolean>(false);

  const [dialogPosition, setDialogPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    startX: number;
    startY: number;
  } | null>(null);

  function formatNumber(val: number): string {
    return Number(val.toFixed(3)).toString();
  }

  const syncDimensionsFromModel = () => {
    if (isInputFocusedRef.current) {
      return;
    }
    if (controller.isDecalSelected()) {
      const size = controller.getSelectedDecalSize();
      if (size !== null) {
        setDecalSize(formatNumber(size));
      }
    } else {
      const dims = controller.getModelDimensions();
      setDimX(formatNumber(dims.x));
      setDimY(formatNumber(dims.y));
      setDimZ(formatNumber(dims.z));
    }
  };

  useEffect(() => {
    syncDimensionsFromModel();

    const notifier = controller.getStateNotifier();
    const unsubModel = notifier.subscribe("MODEL_CHANGED", syncDimensionsFromModel);
    const unsubDecals = notifier.subscribe("DECALS_CHANGED", syncDimensionsFromModel);
    const unsubUndoRedo = notifier.subscribe("UNDO_REDO_STATE_CHANGED", syncDimensionsFromModel);

    return () => {
      unsubModel();
      unsubDecals();
      unsubUndoRedo();
    };
  }, [controller]);

  if (currentMode !== "TRANSFORM") {
    return null;
  }

  const handleXChange = (val: string) => {
    setDimX(val);
    if (isUniform) {
      const currentDims = controller.getModelDimensions();
      const numX = parseFloat(val);
      if (!isNaN(numX) && numX > 0 && currentDims.x > 1e-6) {
        const ratio = numX / currentDims.x;
        setDimY(formatNumber(currentDims.y * ratio));
        setDimZ(formatNumber(currentDims.z * ratio));
      }
    }
  };

  const handleYChange = (val: string) => {
    setDimY(val);
    if (isUniform) {
      const currentDims = controller.getModelDimensions();
      const numY = parseFloat(val);
      if (!isNaN(numY) && numY > 0 && currentDims.y > 1e-6) {
        const ratio = numY / currentDims.y;
        setDimX(formatNumber(currentDims.x * ratio));
        setDimZ(formatNumber(currentDims.z * ratio));
      }
    }
  };

  const handleZChange = (val: string) => {
    setDimZ(val);
    if (isUniform) {
      const currentDims = controller.getModelDimensions();
      const numZ = parseFloat(val);
      if (!isNaN(numZ) && numZ > 0 && currentDims.z > 1e-6) {
        const ratio = numZ / currentDims.z;
        setDimX(formatNumber(currentDims.x * ratio));
        setDimY(formatNumber(currentDims.y * ratio));
      }
    }
  };

  const handleApply = () => {
    isInputFocusedRef.current = false;
    if (isDecalSelected) {
      const size = parseFloat(decalSize);
      if (!isNaN(size) && size > 0) {
        controller.setExactDecalSize(size);
      }
    } else {
      const targetX = parseFloat(dimX);
      const targetY = parseFloat(dimY);
      const targetZ = parseFloat(dimZ);
      if (
        !isNaN(targetX) &&
        !isNaN(targetY) &&
        !isNaN(targetZ) &&
        targetX > 0 &&
        targetY > 0 &&
        targetZ > 0
      ) {
        controller.setExactDimensions(targetX, targetY, targetZ);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleApply();
    }
  };

  const handleHeaderPointerDown = (event: React.PointerEvent) => {
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    const parent = (event.currentTarget as HTMLElement).parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      startX: rect.left,
      startY: rect.top,
    };
  };

  const handleHeaderPointerMove = (event: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const deltaX = event.clientX - dragStartRef.current.mouseX;
    const deltaY = event.clientY - dragStartRef.current.mouseY;
    setDialogPosition({
      x: dragStartRef.current.startX + deltaX,
      y: dragStartRef.current.startY + deltaY,
    });
  };

  const handleHeaderPointerUp = (event: React.PointerEvent) => {
    if (dragStartRef.current) {
      dragStartRef.current = null;
      try {
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
      } catch {
        // pointer capture released
      }
    }
  };

  const stylePosition: React.CSSProperties = dialogPosition
    ? {
        position: "fixed",
        left: `${dialogPosition.x}px`,
        top: `${dialogPosition.y}px`,
      }
    : { position: "absolute", top: "16px", right: "16px" };

  return (
    <div
      data-testid="transform-dimension-dialog"
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        ...stylePosition,
        zIndex: 60,
        backgroundColor: ThemeColors.panelBackground,
        border: `1px solid ${ThemeColors.border}`,
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
        minWidth: "170px",
        fontSize: "12px",
        color: ThemeColors.textPrimary,
        userSelect: "none",
      }}
    >
      <div
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        style={{
          backgroundColor: ThemeColors.panelHeaderBackground,
          padding: "7px 10px",
          borderTopLeftRadius: "7px",
          borderTopRightRadius: "7px",
          borderBottom: `1px solid ${ThemeColors.border}`,
          fontWeight: 600,
          cursor: "move",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{isDecalSelected ? "Decal Size" : "Dimensions"}</span>
      </div>

      <div
        style={{
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {isDecalSelected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "30px", color: ThemeColors.textSecondary }}>
              Size
            </span>
            <input
              data-testid="dimension-input-size"
              type="number"
              step="0.1"
              min="0.001"
              value={decalSize}
              onFocus={() => {
                isInputFocusedRef.current = true;
              }}
              onBlur={() => {
                isInputFocusedRef.current = false;
              }}
              onChange={(event) => setDecalSize(event.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: "75px",
                padding: "4px 6px",
                backgroundColor: ThemeColors.widget,
                border: `1px solid ${ThemeColors.border}`,
                borderRadius: "4px",
                color: ThemeColors.textPrimary,
                fontSize: "12px",
              }}
            />
            <span style={{ color: ThemeColors.textMuted, fontSize: "11px" }}>
              units
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{ width: "16px", fontWeight: "bold", color: "#e06c75" }}
              >
                X
              </span>
              <input
                data-testid="dimension-input-x"
                type="number"
                step="0.1"
                min="0.001"
                value={dimX}
                onFocus={() => {
                  isInputFocusedRef.current = true;
                }}
                onBlur={() => {
                  isInputFocusedRef.current = false;
                }}
                onChange={(event) => handleXChange(event.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  backgroundColor: ThemeColors.widget,
                  border: `1px solid ${ThemeColors.border}`,
                  borderRadius: "4px",
                  color: ThemeColors.textPrimary,
                  fontSize: "12px",
                }}
              />
              <span style={{ color: ThemeColors.textMuted, fontSize: "11px" }}>
                u
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{ width: "16px", fontWeight: "bold", color: "#98c379" }}
              >
                Y
              </span>
              <input
                data-testid="dimension-input-y"
                type="number"
                step="0.1"
                min="0.001"
                value={dimY}
                onFocus={() => {
                  isInputFocusedRef.current = true;
                }}
                onBlur={() => {
                  isInputFocusedRef.current = false;
                }}
                onChange={(event) => handleYChange(event.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  backgroundColor: ThemeColors.widget,
                  border: `1px solid ${ThemeColors.border}`,
                  borderRadius: "4px",
                  color: ThemeColors.textPrimary,
                  fontSize: "12px",
                }}
              />
              <span style={{ color: ThemeColors.textMuted, fontSize: "11px" }}>
                u
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{ width: "16px", fontWeight: "bold", color: "#61afef" }}
              >
                Z
              </span>
              <input
                data-testid="dimension-input-z"
                type="number"
                step="0.1"
                min="0.001"
                value={dimZ}
                onFocus={() => {
                  isInputFocusedRef.current = true;
                }}
                onBlur={() => {
                  isInputFocusedRef.current = false;
                }}
                onChange={(event) => handleZChange(event.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  backgroundColor: ThemeColors.widget,
                  border: `1px solid ${ThemeColors.border}`,
                  borderRadius: "4px",
                  color: ThemeColors.textPrimary,
                  fontSize: "12px",
                }}
              />
              <span style={{ color: ThemeColors.textMuted, fontSize: "11px" }}>
                u
              </span>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                marginTop: "2px",
                fontSize: "11px",
                color: ThemeColors.textSecondary,
              }}
            >
              <input
                data-testid="dimension-uniform-toggle"
                type="checkbox"
                checked={isUniform}
                onChange={(event) => setIsUniform(event.target.checked)}
              />
              <span>Uniform</span>
            </label>
          </>
        )}

        <button
          data-testid="dimension-apply-button"
          onClick={handleApply}
          style={{
            marginTop: "4px",
            padding: "5px 10px",
            backgroundColor: ThemeColors.accent,
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "12px",
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
};
