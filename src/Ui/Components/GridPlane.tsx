import React, { useMemo } from "react";
import * as THREE from "three";
import { GridPlaneType } from "../../Application/Services/CameraService/ViewStrategy";

export interface GridPlaneProps {
  readonly gridPlane: GridPlaneType;
  readonly isOrthographic: boolean;
}

export const GridPlane: React.FC<GridPlaneProps> = ({
  gridPlane,
  isOrthographic,
}) => {
  const rotationEuler = useMemo<THREE.Euler>(() => {
    switch (gridPlane) {
      case "XY":
        return new THREE.Euler(Math.PI / 2, 0, 0);
      case "YZ":
        return new THREE.Euler(0, 0, Math.PI / 2);
      case "XZ":
      default:
        return new THREE.Euler(0, 0, 0);
    }
  }, [gridPlane]);

  // Grid is explicitly shown in orthographic view mode with 1 unit spacing
  if (!isOrthographic || gridPlane === "NONE") {
    return null;
  }

  const gridSize = 100;
  const gridDivisions = 100; // Each cell is 100 / 100 = 1.0 unit!

  return (
    <primitive
      object={
        new THREE.GridHelper(
          gridSize,
          gridDivisions,
          0x888888,
          0xd0d0d0
        )
      }
      rotation={rotationEuler}
      position={[0, 0, 0]}
    />
  );
};
