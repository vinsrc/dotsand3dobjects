import { describe, it, expect } from "vitest";
import { CameraStateService } from "../../../../src/Application/Services/CameraService/CameraStateService";
import { OrthographicViewStrategyFactory } from "../../../../src/Application/Services/CameraService/OrthographicViewStrategy";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("CameraStateService", () => {
  it("should initialize with perspective strategy and default distance", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    expect(cameraService.isOrthographic()).toBe(false);
    expect(cameraService.getCameraDistance()).toBe(8.0);
    expect(cameraService.getTargetPoint().coordinateX).toBe(0);
    expect(cameraService.getAzimuth()).toBeCloseTo(Math.PI / 4);
  });

  it("should switch to orthographic axis strategy and synchronize azimuth and elevation", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    cameraService.setOrthographicAxis("+X");
    expect(cameraService.isOrthographic()).toBe(true);
    expect(cameraService.getActiveStrategy().getAxisLabel()).toBe("+X");
    expect(cameraService.getAzimuth()).toBe(Math.PI / 2);
    expect(cameraService.getElevation()).toBe(0);

    cameraService.setOrthographicAxis("-X");
    expect(cameraService.getAzimuth()).toBe(-Math.PI / 2);
    expect(cameraService.getElevation()).toBe(0);

    cameraService.setOrthographicAxis("+Y");
    expect(cameraService.getAzimuth()).toBe(0);
    expect(cameraService.getElevation()).toBeCloseTo(Math.PI / 2 - 0.01, 5);

    cameraService.setOrthographicAxis("-Y");
    expect(cameraService.isOrthographic()).toBe(true);
    expect(cameraService.getActiveStrategy().getAxisLabel()).toBe("-Y");
    expect(cameraService.getAzimuth()).toBe(0);
    expect(cameraService.getElevation()).toBeCloseTo(-Math.PI / 2 + 0.01, 5);

    cameraService.setOrthographicAxis("+Z");
    expect(cameraService.getAzimuth()).toBe(0);
    expect(cameraService.getElevation()).toBe(0);

    cameraService.setOrthographicAxis("-Z");
    expect(cameraService.getAzimuth()).toBe(Math.PI);
    expect(cameraService.getElevation()).toBe(0);

    // Orbiting after +Y continues seamlessly from top view
    cameraService.setOrthographicAxis("+Y");
    cameraService.orbit(0.1, -0.2);
    expect(cameraService.isOrthographic()).toBe(false);
    expect(cameraService.getAzimuth()).toBeCloseTo(0.1, 5);
    expect(cameraService.getElevation()).toBeCloseTo(Math.PI / 2 - 0.01 - 0.2, 5);
  });

  it("should handle zooming in and out with limits", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    const initialDistance = cameraService.getCameraDistance();
    cameraService.zoomIn(2);
    expect(cameraService.getCameraDistance()).toBe(initialDistance / 2);

    cameraService.zoomOut(2);
    expect(cameraService.getCameraDistance()).toBe(initialDistance);
  });

  it("should handle orbiting and constrain elevation", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    cameraService.orbit(0.5, 0.2);
    expect(cameraService.isOrthographic()).toBe(false);

    // Test extreme elevation clamping
    cameraService.orbit(0, 10);
    expect(cameraService.getElevation()).toBeLessThan(Math.PI / 2);

    cameraService.orbit(0, -20);
    expect(cameraService.getElevation()).toBeGreaterThan(-Math.PI / 2);
  });

  it("should update target point and fit to bounding radius", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    cameraService.setTargetPoint(new Vector3D(10, 20, 30));
    expect(cameraService.getTargetPoint().coordinateX).toBe(10);

    cameraService.fitToRadius(10);
    expect(cameraService.getCameraDistance()).toBe(25);
  });

  it("should pan target point along camera right and up directions", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    // Switch to orthographic +Z view (viewDirection = [0, 0, 1], up = [0, 1, 0], right = [-1, 0, 0])
    cameraService.setOrthographicAxis("+Z");
    cameraService.setTargetPoint(new Vector3D(0, 0, 0));

    cameraService.pan(2, 3);
    const updatedTarget = cameraService.getTargetPoint();
    expect(updatedTarget.coordinateX).toBeCloseTo(-2, 5);
    expect(updatedTarget.coordinateY).toBeCloseTo(3, 5);
    expect(updatedTarget.coordinateZ).toBeCloseTo(0, 5);
  });

  it("should center on specified point", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    cameraService.centerOn(new Vector3D(15, -20, 5));
    expect(cameraService.getTargetPoint().coordinateX).toBe(15);
    expect(cameraService.getTargetPoint().coordinateY).toBe(-20);
    expect(cameraService.getTargetPoint().coordinateZ).toBe(5);
  });
});
