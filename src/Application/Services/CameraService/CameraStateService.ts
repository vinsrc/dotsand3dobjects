import { Vector3D } from "../../Common/Vector3D";
import { IViewStrategy } from "./ViewStrategy";
import {
  OrthographicAxis,
  OrthographicViewStrategyFactory,
} from "./OrthographicViewStrategy";
import { PerspectiveViewStrategy } from "./PerspectiveViewStrategy";
import { OrthographicViewSelector } from "./OrthographicViewSelector";
import { FaceOrthographicViewStrategy } from "./FaceOrthographicViewStrategy";

export class CameraStateService {
  private readonly strategyFactory: OrthographicViewStrategyFactory;
  private readonly viewSelector: OrthographicViewSelector;
  private currentStrategy: IViewStrategy;
  private cameraDistance: number;
  private targetPoint: Vector3D;
  private azimuthRadians: number;
  private elevationRadians: number;

  public constructor(
    strategyFactory: OrthographicViewStrategyFactory,
    viewSelector: OrthographicViewSelector = new OrthographicViewSelector(),
    initialStrategy?: IViewStrategy
  ) {
    this.strategyFactory = strategyFactory;
    this.viewSelector = viewSelector;
    this.azimuthRadians = Math.PI / 4;
    this.elevationRadians = Math.PI / 6;
    this.currentStrategy =
      initialStrategy ??
      new PerspectiveViewStrategy(
        this.azimuthRadians,
        this.elevationRadians
      );
    this.cameraDistance = 8.0;
    this.targetPoint = new Vector3D(0, 0, 0);
  }

  public getActiveStrategy(): IViewStrategy {
    return this.currentStrategy;
  }

  public isOrthographic(): boolean {
    return this.currentStrategy.isOrthographic();
  }

  public isFaceOrthographicView(): boolean {
    return this.currentStrategy instanceof FaceOrthographicViewStrategy;
  }

  public getActiveFaceIndex(): number | null {
    if (this.currentStrategy instanceof FaceOrthographicViewStrategy) {
      return this.currentStrategy.getFaceIndex();
    }
    return null;
  }

  public getCameraDistance(): number {
    return this.cameraDistance;
  }

  public getTargetPoint(): Vector3D {
    return this.targetPoint;
  }

  public getAzimuth(): number {
    return this.azimuthRadians;
  }

  public getElevation(): number {
    return this.elevationRadians;
  }

  public setOrthographicAxis(
    axisIdentifier: OrthographicAxis,
    customUp?: Vector3D
  ): void {
    const currentUp = this.currentStrategy.getUpDirection();
    const upDirection =
      customUp ??
      this.viewSelector.findClosestUpDirection(axisIdentifier, currentUp);

    this.currentStrategy = this.strategyFactory.createStrategy(
      axisIdentifier,
      upDirection
    );

    switch (axisIdentifier) {
      case "+X":
        this.azimuthRadians = Math.PI / 2;
        this.elevationRadians = 0;
        break;
      case "-X":
        this.azimuthRadians = -Math.PI / 2;
        this.elevationRadians = 0;
        break;
      case "+Y": {
        const rawAzimuth = Math.atan2(
          -upDirection.coordinateX,
          -upDirection.coordinateZ
        );
        this.azimuthRadians = this.normalizeAzimuth(rawAzimuth);
        this.elevationRadians = Math.PI / 2 - 0.01;
        break;
      }
      case "-Y": {
        const rawAzimuth = Math.atan2(
          upDirection.coordinateX,
          upDirection.coordinateZ
        );
        this.azimuthRadians = this.normalizeAzimuth(rawAzimuth);
        this.elevationRadians = -Math.PI / 2 + 0.01;
        break;
      }
      case "+Z":
        this.azimuthRadians = 0;
        this.elevationRadians = 0;
        break;
      case "-Z":
        this.azimuthRadians = Math.PI;
        this.elevationRadians = 0;
        break;
    }
  }

  public switchToClosestOrthographicView(): OrthographicAxis {
    const currentDirection = this.currentStrategy.getViewDirection();
    const closestAxis = this.viewSelector.findClosestAxis(currentDirection);
    this.setOrthographicAxis(closestAxis);
    return closestAxis;
  }

  public setFaceOrthographicView(
    faceIndex: number,
    faceNormal: Vector3D,
    faceCenter?: Vector3D,
    customUp?: Vector3D
  ): void {
    const currentUp = this.currentStrategy.getUpDirection();
    const bestUpDirection =
      customUp ??
      this.viewSelector.findClosestFaceUpDirection(faceNormal, currentUp);

    const strategy = new FaceOrthographicViewStrategy(
      faceIndex,
      faceNormal,
      bestUpDirection
    );
    this.currentStrategy = strategy;
    if (faceCenter) {
      this.targetPoint = faceCenter;
    }
    const normal = strategy.getViewDirection();
    this.elevationRadians = Math.asin(
      Math.max(-1, Math.min(1, normal.coordinateY))
    );
    const cosElevation = Math.cos(this.elevationRadians);
    if (Math.abs(cosElevation) > 0.001) {
      this.azimuthRadians = Math.atan2(
        normal.coordinateX,
        normal.coordinateZ
      );
    } else if (normal.coordinateY > 0) {
      const rawAzimuth = Math.atan2(
        -bestUpDirection.coordinateX,
        -bestUpDirection.coordinateZ
      );
      this.azimuthRadians = this.normalizeAzimuth(rawAzimuth);
    } else {
      const rawAzimuth = Math.atan2(
        bestUpDirection.coordinateX,
        bestUpDirection.coordinateZ
      );
      this.azimuthRadians = this.normalizeAzimuth(rawAzimuth);
    }
  }

  private normalizeAzimuth(rawAzimuth: number): number {
    if (Math.abs(rawAzimuth) < 1e-10) {
      return 0;
    }
    if (Math.abs(rawAzimuth - (-Math.PI)) < 1e-10) {
      return Math.PI;
    }
    return rawAzimuth;
  }

  public orbit(deltaAzimuth: number, deltaElevation: number): void {
    this.azimuthRadians += deltaAzimuth;
    this.elevationRadians += deltaElevation;

    // Constrain elevation angle to avoid gimbal lock
    const maximumElevation = Math.PI / 2 - 0.01;
    const minimumElevation = -Math.PI / 2 + 0.01;

    if (this.elevationRadians > maximumElevation) {
      this.elevationRadians = maximumElevation;
    } else if (this.elevationRadians < minimumElevation) {
      this.elevationRadians = minimumElevation;
    }

    this.currentStrategy = new PerspectiveViewStrategy(
      this.azimuthRadians,
      this.elevationRadians
    );
  }

  public zoomIn(scaleFactor: number = 1.15): void {
    const minimumDistance = 0.5;
    const newDistance = this.cameraDistance / scaleFactor;
    this.cameraDistance = Math.max(minimumDistance, newDistance);
  }

  public zoomOut(scaleFactor: number = 1.15): void {
    const maximumDistance = 500.0;
    const newDistance = this.cameraDistance * scaleFactor;
    this.cameraDistance = Math.min(maximumDistance, newDistance);
  }

  public setTargetPoint(newTarget: Vector3D): void {
    this.targetPoint = newTarget;
  }

  public fitToRadius(boundingRadius: number): void {
    const safeRadius = Math.max(1, boundingRadius);
    this.cameraDistance = safeRadius * 2.5;
  }

  public pan(deltaRight: number, deltaUp: number): void {
    const activeStrategy = this.getActiveStrategy();
    const viewDirection = activeStrategy.getViewDirection();
    const upDirection = activeStrategy.getUpDirection();

    const rightVector = viewDirection
      .calculateCrossProduct(upDirection)
      .normalize();

    const rightOffset = rightVector.scaleBy(deltaRight);
    const upOffset = upDirection.scaleBy(deltaUp);

    this.targetPoint = this.targetPoint.add(rightOffset).add(upOffset);
  }

  public centerOn(newCenterPoint: Vector3D): void {
    this.targetPoint = newCenterPoint;
  }
}
