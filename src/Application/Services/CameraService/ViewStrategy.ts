import { Vector3D } from "../../Common/Vector3D";

export type GridPlaneType = "XY" | "XZ" | "YZ" | "NONE";

export interface IViewStrategy {
  getViewDirection(): Vector3D;
  getUpDirection(): Vector3D;
  isOrthographic(): boolean;
  getAxisLabel(): string;
  getGridPlane(): GridPlaneType;
}
