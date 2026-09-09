import { Vector3D } from "../../Common/Vector3D";
import { GridPlaneType, IViewStrategy } from "./ViewStrategy";

export type OrthographicAxis = "+X" | "-X" | "+Y" | "-Y" | "+Z" | "-Z";

export class PositiveXViewStrategy implements IViewStrategy {
  public getViewDirection(): Vector3D {
    return new Vector3D(1, 0, 0);
  }

  public getUpDirection(): Vector3D {
    return new Vector3D(0, 1, 0);
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
  public getViewDirection(): Vector3D {
    return new Vector3D(-1, 0, 0);
  }

  public getUpDirection(): Vector3D {
    return new Vector3D(0, 1, 0);
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
  public getViewDirection(): Vector3D {
    return new Vector3D(0, 1, 0);
  }

  public getUpDirection(): Vector3D {
    return new Vector3D(0, 0, -1);
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
  public getViewDirection(): Vector3D {
    return new Vector3D(0, -1, 0);
  }

  public getUpDirection(): Vector3D {
    return new Vector3D(0, 0, 1);
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
  public getViewDirection(): Vector3D {
    return new Vector3D(0, 0, 1);
  }

  public getUpDirection(): Vector3D {
    return new Vector3D(0, 1, 0);
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
  public getViewDirection(): Vector3D {
    return new Vector3D(0, 0, -1);
  }

  public getUpDirection(): Vector3D {
    return new Vector3D(0, 1, 0);
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
  public createStrategy(axisIdentifier: OrthographicAxis): IViewStrategy {
    switch (axisIdentifier) {
      case "+X":
        return new PositiveXViewStrategy();
      case "-X":
        return new NegativeXViewStrategy();
      case "+Y":
        return new PositiveYViewStrategy();
      case "-Y":
        return new NegativeYViewStrategy();
      case "+Z":
        return new PositiveZViewStrategy();
      case "-Z":
        return new NegativeZViewStrategy();
    }
  }
}
