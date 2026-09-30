import { Vector3D } from "../../Common/Vector3D";
import { GridPlaneType, IViewStrategy } from "./ViewStrategy";

export type OrthographicAxis = "+X" | "-X" | "+Y" | "-Y" | "+Z" | "-Z";

export class PositiveXViewStrategy implements IViewStrategy {
  private readonly upDirection: Vector3D;

  public constructor(upDirection: Vector3D = new Vector3D(0, 1, 0)) {
    this.upDirection = upDirection;
  }

  public getViewDirection(): Vector3D {
    return new Vector3D(1, 0, 0);
  }

  public getUpDirection(): Vector3D {
    return this.upDirection;
  }

  public isOrthographic(): boolean {
    return true;
  }

  public getAxisLabel(): string {
    return "+X";
  }

  public getGridPlane(): GridPlaneType {
    return "YZ";
  }
}

export class NegativeXViewStrategy implements IViewStrategy {
  private readonly upDirection: Vector3D;

  public constructor(upDirection: Vector3D = new Vector3D(0, 1, 0)) {
    this.upDirection = upDirection;
  }

  public getViewDirection(): Vector3D {
    return new Vector3D(-1, 0, 0);
  }

  public getUpDirection(): Vector3D {
    return this.upDirection;
  }

  public isOrthographic(): boolean {
    return true;
  }

  public getAxisLabel(): string {
    return "-X";
  }

  public getGridPlane(): GridPlaneType {
    return "YZ";
  }
}

export class PositiveYViewStrategy implements IViewStrategy {
  private readonly upDirection: Vector3D;

  public constructor(upDirection: Vector3D = new Vector3D(0, 0, -1)) {
    this.upDirection = upDirection;
  }

  public getViewDirection(): Vector3D {
    return new Vector3D(0, 1, 0);
  }

  public getUpDirection(): Vector3D {
    return this.upDirection;
  }

  public isOrthographic(): boolean {
    return true;
  }

  public getAxisLabel(): string {
    return "+Y";
  }

  public getGridPlane(): GridPlaneType {
    return "XZ";
  }
}

export class NegativeYViewStrategy implements IViewStrategy {
  private readonly upDirection: Vector3D;

  public constructor(upDirection: Vector3D = new Vector3D(0, 0, 1)) {
    this.upDirection = upDirection;
  }

  public getViewDirection(): Vector3D {
    return new Vector3D(0, -1, 0);
  }

  public getUpDirection(): Vector3D {
    return this.upDirection;
  }

  public isOrthographic(): boolean {
    return true;
  }

  public getAxisLabel(): string {
    return "-Y";
  }

  public getGridPlane(): GridPlaneType {
    return "XZ";
  }
}

export class PositiveZViewStrategy implements IViewStrategy {
  private readonly upDirection: Vector3D;

  public constructor(upDirection: Vector3D = new Vector3D(0, 1, 0)) {
    this.upDirection = upDirection;
  }

  public getViewDirection(): Vector3D {
    return new Vector3D(0, 0, 1);
  }

  public getUpDirection(): Vector3D {
    return this.upDirection;
  }

  public isOrthographic(): boolean {
    return true;
  }

  public getAxisLabel(): string {
    return "+Z";
  }

  public getGridPlane(): GridPlaneType {
    return "XY";
  }
}

export class NegativeZViewStrategy implements IViewStrategy {
  private readonly upDirection: Vector3D;

  public constructor(upDirection: Vector3D = new Vector3D(0, 1, 0)) {
    this.upDirection = upDirection;
  }

  public getViewDirection(): Vector3D {
    return new Vector3D(0, 0, -1);
  }

  public getUpDirection(): Vector3D {
    return this.upDirection;
  }

  public isOrthographic(): boolean {
    return true;
  }

  public getAxisLabel(): string {
    return "-Z";
  }

  public getGridPlane(): GridPlaneType {
    return "XY";
  }
}

export class OrthographicViewStrategyFactory {
  public createStrategy(
    axisIdentifier: OrthographicAxis,
    upDirection?: Vector3D
  ): IViewStrategy {
    switch (axisIdentifier) {
      case "+X":
        return new PositiveXViewStrategy(upDirection);
      case "-X":
        return new NegativeXViewStrategy(upDirection);
      case "+Y":
        return new PositiveYViewStrategy(upDirection);
      case "-Y":
        return new NegativeYViewStrategy(upDirection);
      case "+Z":
        return new PositiveZViewStrategy(upDirection);
      case "-Z":
        return new NegativeZViewStrategy(upDirection);
    }
  }
}
