import { Vector3D } from "../../Common/Vector3D";
import { IViewStrategy } from "./ViewStrategy";
import {
  OrthographicAxis,
  OrthographicViewStrategyFactory,
} from "./OrthographicViewStrategy";
import { PerspectiveViewStrategy } from "./PerspectiveViewStrategy";

export class CameraStateService {
  private readonly strategyFactory: OrthographicViewStrategyFactory;
  private currentStrategy: IViewStrategy;
  private cameraDistance: number;
  private targetPoint: Vector3D;
  private azimuthRadians: number;
  private elevationRadians: number;

  public constructor(
    strategyFactory: OrthographicViewStrategyFactory,
    initialStrategy?: IViewStrategy
  ) {
    this.strategyFactory = strategyFactory;
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

  public setOrthographicAxis(axisIdentifier: OrthographicAxis): void {
    this.currentStrategy =
      this.strategyFactory.createStrategy(axisIdentifier);
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
