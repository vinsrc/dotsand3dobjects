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

    // Switching directly to -Y preserves the -Z up direction from +Y, setting azimuth to PI
    cameraService.setOrthographicAxis("-Y");
    expect(cameraService.isOrthographic()).toBe(true);
    expect(cameraService.getActiveStrategy().getAxisLabel()).toBe("-Y");
    expect(cameraService.getAzimuth()).toBe(Math.PI);
    expect(cameraService.getElevation()).toBeCloseTo(-Math.PI / 2 + 0.01, 5);

    // Explicit +Z up vector for -Y sets azimuth to 0
    cameraService.setOrthographicAxis("-Y", new Vector3D(0, 0, 1));
    expect(cameraService.getAzimuth()).toBe(0);

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

  it("should switch to closest orthographic view based on current view direction", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    // Initial perspective view: azimuth = PI/4 (45 deg), elevation = PI/6 (30 deg)
    // viewDirection is primarily +X and +Z
    const closestAxis = cameraService.switchToClosestOrthographicView();
    expect(cameraService.isOrthographic()).toBe(true);
    expect(["+X", "+Z"]).toContain(closestAxis);

    // Orbit towards +X: azimuth = PI/2, elevation = 0
    cameraService.orbit(0, 0); // switches to perspective
    cameraService.setOrthographicAxis("+X");
    cameraService.orbit(0.05, 0.02); // close to +X in perspective
    expect(cameraService.isOrthographic()).toBe(false);
    expect(cameraService.switchToClosestOrthographicView()).toBe("+X");
    expect(cameraService.isOrthographic()).toBe(true);
    expect(cameraService.getActiveStrategy().getAxisLabel()).toBe("+X");

    // Orbit towards +Y (high elevation)
    cameraService.orbit(0, Math.PI / 3);
    expect(cameraService.switchToClosestOrthographicView()).toBe("+Y");
    expect(cameraService.isOrthographic()).toBe(true);
    expect(cameraService.getActiveStrategy().getAxisLabel()).toBe("+Y");

    // Orbit towards -Y (negative elevation)
    cameraService.orbit(0, -Math.PI * 0.8);
    expect(cameraService.switchToClosestOrthographicView()).toBe("-Y");
    expect(cameraService.getActiveStrategy().getAxisLabel()).toBe("-Y");

    // When already in orthographic -Y, calling switch keeps it in -Y
    expect(cameraService.switchToClosestOrthographicView()).toBe("-Y");
  });

  it("should set face orthographic view and update target point if provided", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    cameraService.setFaceOrthographicView(
      3,
      new Vector3D(0, 0, 1),
      new Vector3D(5, 5, 0)
    );

    expect(cameraService.isOrthographic()).toBe(true);
    expect(cameraService.isFaceOrthographicView()).toBe(true);
    expect(cameraService.getActiveFaceIndex()).toBe(3);
    expect(cameraService.getActiveStrategy().getAxisLabel()).toBe("Face 3");
    expect(cameraService.getTargetPoint()).toEqual(new Vector3D(5, 5, 0));

    // When switched to standard orthographic axis
    cameraService.setOrthographicAxis("+Z");
    expect(cameraService.isFaceOrthographicView()).toBe(false);
    expect(cameraService.getActiveFaceIndex()).toBeNull();
  });

  it("should preserve closest up direction when switching to +Y from rotated perspective view", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    // Orbit to azimuth near PI (viewing from -Z towards +Z) with high elevation (looking down)
    // From this perspective, +Z is pointing towards screen up.
    cameraService.orbit(Math.PI * 0.75, Math.PI / 4);

    // Switch to orthographic +Y view (e.g. via gizmo or double click)
    cameraService.setOrthographicAxis("+Y");

    // Camera up direction should be +Z, not flipped to -Z
    expect(cameraService.getActiveStrategy().getUpDirection()).toEqual(
      new Vector3D(0, 0, 1)
    );
    expect(cameraService.getAzimuth()).toBeCloseTo(Math.PI, 2);
  });

  it("should preserve closest up direction when double clicking / setting face orthographic view on XZ face", () => {
    const factory = new OrthographicViewStrategyFactory();
    const cameraService = new CameraStateService(factory);

    // Orbit so that user is viewing upright with +Z up
    cameraService.orbit(Math.PI * 0.75, Math.PI / 4);

    // Double click horizontal face (normal = (0, 1, 0))
    cameraService.setFaceOrthographicView(1, new Vector3D(0, 1, 0));

    expect(cameraService.getActiveStrategy().getUpDirection()).toEqual(
      new Vector3D(0, 0, 1)
    );
    expect(cameraService.getAzimuth()).toBeCloseTo(Math.PI, 2);

    // Face pointing down along -Y
    cameraService.setFaceOrthographicView(2, new Vector3D(0, -1, 0));
    expect(cameraService.getActiveStrategy().getUpDirection()).toEqual(
      new Vector3D(0, 0, 1)
    );
  });
});

