import React, { useMemo, useState } from "react";
import { AppBootstrapper } from "../../Application/AppBootstrapper";
import { ApplicationProvider } from "../Common/AppContext";
import { ToolBar } from "./ToolBar";
import { SideToolBar } from "./SideToolBar";
import { ViewportCanvas } from "./ViewportCanvas";
import { AxisGizmo } from "./AxisGizmo";
import { ErrorModal } from "./ErrorModal";
import { MaterialLibraryPanel } from "./MaterialLibraryPanel";
import { HelpModal } from "./HelpModal";
import { CustomizeUiModal } from "./CustomizeUiModal";

import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { ThemeColors } from "../Common/Theme";

const AppContent: React.FC = () => {
  const controller = useAppController();
  useApplicationState(["MATERIAL_PANEL_CHANGED", "UI_CUSTOMIZATION_CHANGED"]);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isCustomizeUiOpen, setIsCustomizeUiOpen] = useState<boolean>(false);

  const sideToolBarDock = controller
    .getUiCustomizationService()
    .getSideToolBarDock();
  const materialLibraryDock = controller.getMaterialService().getDockSide();

  return (
    <div
      data-testid="app-root"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: ThemeColors.textPrimary,
        backgroundColor: ThemeColors.appBackground,
        position: "relative",
      }}
    >
      <ToolBar
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenCustomizeUi={() => setIsCustomizeUiOpen(true)}
      />
      <div
        style={{
          flex: 1,
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "row",
        }}
      >
        {/* Left-docked components: SideToolBar is outermost (left-most) */}
        {sideToolBarDock === "left" && <SideToolBar />}
        {materialLibraryDock === "left" && <MaterialLibraryPanel />}

        <div
          style={{
            flex: 1,
            position: "relative",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <ViewportCanvas />
          <AxisGizmo />
        </div>

        {/* Right-docked components: SideToolBar is outermost (right-most) */}
        {materialLibraryDock === "right" && <MaterialLibraryPanel />}
        {sideToolBarDock === "right" && <SideToolBar />}
      </div>
      <ErrorModal />
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
      <CustomizeUiModal
        isOpen={isCustomizeUiOpen}
        onClose={() => setIsCustomizeUiOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  const applicationInstances = useMemo(() => {
    return AppBootstrapper.createApplication();
  }, []);

  return (
    <ApplicationProvider controller={applicationInstances.appController}>
      <AppContent />
    </ApplicationProvider>
  );
};
