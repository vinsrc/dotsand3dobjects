import { Vector3D } from "../../Common/Vector3D";
import { GridPlaneType, IViewStrategy } from "./ViewStrategy";

export class PerspectiveViewStrategy implements IViewStrategy {
  private readonly azimuthRadians: number;
  private readonly elevationRadians: number;

  public constructor(
    azimuthRadians: number = Math.PI / 4,
    elevationRadians: number = Math.PI / 6
  ) {
    this.azimuthRadians = azimuthRadians;
    this.elevationRadians = elevationRadians;
  }

  public getViewDirection(): Vector3D {
    const horizontalDistance = Math.cos(this.elevationRadians);
    const coordinateX =
      horizontalDistance * Math.sin(this.azimuthRadians);
    const coordinateY = Math.sin(this.elevationRadians);
    const coordinateZ =
      horizontalDistance * Math.cos(this.azimuthRadians);

    return new Vector3D(coordinateX, coordinateY, coordinateZ).normalize();
  }

  public getUpDirection(): Vector3D {
    const horizontalScale = -Math.sin(this.elevationRadians);
    const coordinateX =
      horizontalScale * Math.sin(this.azimuthRadians);
    const coordinateY = Math.cos(this.elevationRadians);
    const coordinateZ =
      horizontalScale * Math.cos(this.azimuthRadians);

    return new Vector3D(coordinateX, coordinateY, coordinateZ).normalize();
  }

  public isOrthographic(): boolean {
    return false;
  }

  public getAxisLabel(): string {
    return "Perspective";
  }

  public getGridPlane(): GridPlaneType {
    return "NONE";
  }
}
