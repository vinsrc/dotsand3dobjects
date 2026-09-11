import { Vector3D } from "../../Common/Vector3D";
import { GridPlaneType, IViewStrategy } from "./ViewStrategy";

export class FaceOrthographicViewStrategy implements IViewStrategy {
  private readonly viewDirection: Vector3D;
  private readonly upDirection: Vector3D;
  private readonly gridPlane: GridPlaneType;
  private readonly faceIndex: number;

  public constructor(
    faceIndex: number,
    faceNormal: Vector3D,
    upVector?: Vector3D
  ) {
    this.faceIndex = faceIndex;
    this.viewDirection = faceNormal.normalize();

    if (upVector) {
      this.upDirection = upVector.normalize();
    } else {
      const absoluteY = Math.abs(this.viewDirection.coordinateY);
      const referenceUp =
        absoluteY > 0.9 ? new Vector3D(0, 0, -1) : new Vector3D(0, 1, 0);
      const rightVector = referenceUp
        .calculateCrossProduct(this.viewDirection)
        .normalize();
      this.upDirection = this.viewDirection
        .calculateCrossProduct(rightVector)
        .normalize();
    }

    const absoluteX = Math.abs(this.viewDirection.coordinateX);
    const absoluteY = Math.abs(this.viewDirection.coordinateY);
    const absoluteZ = Math.abs(this.viewDirection.coordinateZ);

    if (absoluteX >= absoluteY && absoluteX >= absoluteZ) {
      this.gridPlane = "YZ";
    } else if (absoluteY >= absoluteX && absoluteY >= absoluteZ) {
      this.gridPlane = "XZ";
    } else {
      this.gridPlane = "XY";
    }
  }

  public getViewDirection(): Vector3D {
    return this.viewDirection;
  }

  public getUpDirection(): Vector3D {
    return this.upDirection;
  }

  public isOrthographic(): boolean {
    return true;
  }

  public getAxisLabel(): string {
    return `Face ${this.faceIndex}`;
  }

  public getGridPlane(): GridPlaneType {
    return this.gridPlane;
  }

  public getFaceIndex(): number {
    return this.faceIndex;
  }
}
