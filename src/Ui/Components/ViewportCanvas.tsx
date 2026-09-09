import React, { useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAppController } from "../Common/AppContext";
import { useApplicationState } from "../Common/UseApplicationState";
import { MeshViewer } from "./MeshViewer";
import { GridPlane } from "./GridPlane";

const CameraSynchronizer: React.FC = () => {
  const controller = useAppController();
  const { camera, size } = useThree();

  const cameraService = controller.getCameraStateService();
  const activeStrategy = cameraService.getActiveStrategy();
  const isOrthographic = cameraService.isOrthographic();
  const cameraDistance = cameraService.getCameraDistance();
  const targetPoint = cameraService.getTargetPoint();
  const viewDirection = activeStrategy.getViewDirection();
  const upDirection = activeStrategy.getUpDirection();

  useEffect(() => {
    const positionX =
      targetPoint.coordinateX + viewDirection.coordinateX * cameraDistance;
    const positionY =
      targetPoint.coordinateY + viewDirection.coordinateY * cameraDistance;
    const positionZ =
      targetPoint.coordinateZ + viewDirection.coordinateZ * cameraDistance;

    camera.position.set(positionX, positionY, positionZ);
    camera.up.set(
      upDirection.coordinateX,
      upDirection.coordinateY,
      upDirection.coordinateZ
    );
    camera.lookAt(
      targetPoint.coordinateX,
      targetPoint.coordinateY,
      targetPoint.coordinateZ
    );

    if (camera instanceof THREE.OrthographicCamera) {
      const aspectRatio = size.width / (size.height || 1);
      const frustumHeight = cameraDistance;
      const frustumWidth = frustumHeight * aspectRatio;

      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.PerspectiveCamera) {
      camera.updateProjectionMatrix();
    }
  }, [
    camera,
    size,
    isOrthographic,
    cameraDistance,
    targetPoint,
    viewDirection,
    upDirection,
  ]);

  return null;
};

export const ViewportCanvas: React.FC = () => {
  const controller = useAppController();
  useApplicationState(["VIEW_CHANGED", "MODEL_CHANGED", "RENDER_MODE_CHANGED"]);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchDistanceRef = useRef<number | null>(null);

  const modelService = controller.getModelService();
  const cameraService = controller.getCameraStateService();
  const renderModeService = controller.getRenderModeService();

  const currentModel = modelService.getCurrentModel();
  const renderMode = renderModeService.getRenderMode();
  const isOrthographic = cameraService.isOrthographic();
  const gridPlane = cameraService.getActiveStrategy().getGridPlane();

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      controller.zoomIn();
    } else if (event.deltaY > 0) {
      controller.zoomOut();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      const firstTouch = event.touches[0];
      const secondTouch = event.touches[1];
      if (firstTouch && secondTouch) {
        const deltaX = firstTouch.clientX - secondTouch.clientX;
        const deltaY = firstTouch.clientY - secondTouch.clientY;
        touchDistanceRef.current = Math.hypot(deltaX, deltaY);
      }
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && touchDistanceRef.current !== null) {
      event.preventDefault();
      const firstTouch = event.touches[0];
      const secondTouch = event.touches[1];
      if (firstTouch && secondTouch) {
        const deltaX = firstTouch.clientX - secondTouch.clientX;
        const deltaY = firstTouch.clientY - secondTouch.clientY;
        const currentDistance = Math.hypot(deltaX, deltaY);
        const distanceDifference = currentDistance - touchDistanceRef.current;

        const gestureThreshold = 10;
        if (Math.abs(distanceDifference) > gestureThreshold) {
          if (distanceDifference > 0) {
            controller.zoomIn();
          } else {
            controller.zoomOut();
          }
          touchDistanceRef.current = currentDistance;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      data-testid="viewport-canvas-container"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        flex: 1,
        width: "100%",
        height: "calc(100vh - 48px)",
        position: "relative",
        backgroundColor: "#f5f5f5",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <Canvas
        orthographic={isOrthographic}
        camera={
          isOrthographic
            ? { position: [0, 0, 10], zoom: 1, near: 0.1, far: 1000 }
            : { position: [5, 5, 5], fov: 45, near: 0.1, far: 1000 }
        }
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 15]} intensity={1.2} />
        <directionalLight position={[-10, -10, -10]} intensity={0.4} />

        <CameraSynchronizer />
        <GridPlane gridPlane={gridPlane} isOrthographic={isOrthographic} />
        <MeshViewer meshGeometry={currentModel} renderMode={renderMode} />
      </Canvas>
    </div>
  );
};
