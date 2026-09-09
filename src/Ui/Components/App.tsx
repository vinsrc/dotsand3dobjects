import React, { useMemo } from "react";
import { AppBootstrapper } from "../../Application/AppBootstrapper";
import { ApplicationProvider } from "../Common/AppContext";
import { ToolBar } from "./ToolBar";
import { ViewportCanvas } from "./ViewportCanvas";
import { AxisGizmo } from "./AxisGizmo";
import { ErrorModal } from "./ErrorModal";

export const App: React.FC = () => {
  const applicationInstances = useMemo(() => {
    return AppBootstrapper.createApplication();
  }, []);

  return (
    <ApplicationProvider controller={applicationInstances.appController}>
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
          position: "relative",
        }}
      >
        <ToolBar />
        <div
          style={{
            flex: 1,
            position: "relative",
            width: "100%",
            height: "calc(100vh - 48px)",
          }}
        >
          <ViewportCanvas />
          <AxisGizmo />
        </div>
        <ErrorModal />
      </div>
    </ApplicationProvider>
  );
};
