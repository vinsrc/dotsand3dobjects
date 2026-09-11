import React, { useState, useRef, useEffect } from "react";

export interface FileMenuProps {
  onLoadClick: () => void;
  onLoadMtlClick?: () => void;
  onExportClick: () => void;
  onCustomizeUiClick?: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({
  onLoadClick,
  onLoadMtlClick,
  onExportClick,
  onCustomizeUiClick,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggleMenu = () => {
    setIsOpen((previousState) => !previousState);
  };

  const handleItemClick = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const triggerButtonStyle: React.CSSProperties = {
    padding: "6px 12px",
    backgroundColor: isOpen ? "#e8e8e8" : "#ffffff",
    border: "1px solid #999999",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    color: "#333333",
    whiteSpace: "nowrap",
  };

  const dropdownContainerStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    backgroundColor: "#ffffff",
    border: "1px solid #c0c0c0",
    borderRadius: "4px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 1000,
    minWidth: "140px",
    display: "flex",
    flexDirection: "column",
    padding: "4px 0",
  };

  const getMenuItemStyle = (itemName: string): React.CSSProperties => ({
    padding: "8px 16px",
    textAlign: "left",
    backgroundColor: hoveredItem === itemName ? "#f0f0f0" : "transparent",
    border: "none",
    fontSize: "13px",
    fontWeight: 500,
    color: "#333333",
    cursor: "pointer",
    width: "100%",
    display: "block",
    boxSizing: "border-box",
  });

  return (
    <div
      ref={menuContainerRef}
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: isOpen ? 1000 : 1,
      }}
    >
      <button
        data-testid="file-menu-button"
        onClick={handleToggleMenu}
        style={triggerButtonStyle}
      >
        File
      </button>

      {isOpen && (
        <div data-testid="file-menu-dropdown" style={dropdownContainerStyle}>
          <button
            data-testid="load-obj-button"
            onClick={() => handleItemClick(onLoadClick)}
            onMouseEnter={() => setHoveredItem("load")}
            onMouseLeave={() => setHoveredItem(null)}
            style={getMenuItemStyle("load")}
          >
            Load .obj
          </button>
          <button
            data-testid="load-mtl-button"
            onClick={() =>
              handleItemClick(onLoadMtlClick ? onLoadMtlClick : onLoadClick)
            }
            onMouseEnter={() => setHoveredItem("load-mtl")}
            onMouseLeave={() => setHoveredItem(null)}
            style={getMenuItemStyle("load-mtl")}
          >
            Load .mtl
          </button>
          <button
            data-testid="export-obj-button"
            onClick={() => handleItemClick(onExportClick)}
            onMouseEnter={() => setHoveredItem("export")}
            onMouseLeave={() => setHoveredItem(null)}
            style={getMenuItemStyle("export")}
          >
            Export .obj
          </button>
          <button
            data-testid="customize-ui-button"
            onClick={() => handleItemClick(() => onCustomizeUiClick?.())}
            onMouseEnter={() => setHoveredItem("customize-ui")}
            onMouseLeave={() => setHoveredItem(null)}
            style={getMenuItemStyle("customize-ui")}
          >
            Customize UI
          </button>
        </div>
      )}
    </div>
  );
};
