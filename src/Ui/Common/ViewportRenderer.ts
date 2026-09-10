import * as THREE from "three";
import { MeshGeometry } from "../../Application/Services/ModelService/MeshGeometry";
import { RenderMode } from "../../Application/Services/RenderModeService/RenderModeService";
import { CameraStateService } from "../../Application/Services/CameraService/CameraStateService";
import { GridPlaneType } from "../../Application/Services/CameraService/ViewStrategy";
import { AXIS_COLORS } from "./AxisColors";

export class ViewportRenderer {
  private readonly canvasElement: HTMLCanvasElement;
  private readonly webGlRenderer: THREE.WebGLRenderer;
  private readonly sceneInstance: THREE.Scene;
  private readonly perspectiveCameraInstance: THREE.PerspectiveCamera;
  private readonly orthographicCameraInstance: THREE.OrthographicCamera;

  private surfaceMesh: THREE.Mesh;
  private wireframeLines: THREE.LineSegments;
  private vertexPoints: THREE.Points;
  private selectedPoints: THREE.Points;
  private gridHelperInstance: THREE.GridHelper | null = null;
  private axisLinesInstance: THREE.LineSegments | null = null;
  private isOrthographicViewActive: boolean = false;
  private isRendererDisposed: boolean = false;

  private currentModelGeometry: MeshGeometry | null = null;
  private currentSelectedIndices: readonly number[] = [];

  public constructor(canvasElement: HTMLCanvasElement) {
    this.canvasElement = canvasElement;

    this.webGlRenderer = new THREE.WebGLRenderer({
      canvas: this.canvasElement,
      antialias: true,
      alpha: true,
    });
    this.webGlRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.sceneInstance = new THREE.Scene();

    this.perspectiveCameraInstance = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      1000
    );
    this.orthographicCameraInstance = new THREE.OrthographicCamera(
      -1,
      1,
      1,
      -1,
      0.1,
      1000
    );

    this.surfaceMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.7,
        metalness: 0.1,
        flatShading: true,
        side: THREE.DoubleSide,
      })
    );
    this.sceneInstance.add(this.surfaceMesh);

    this.wireframeLines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.35,
      })
    );
    this.sceneInstance.add(this.wireframeLines);

    this.vertexPoints = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0x222222,
        size: 7,
        sizeAttenuation: false,
        depthTest: false,
      })
    );
    this.vertexPoints.renderOrder = 998;
    this.sceneInstance.add(this.vertexPoints);

    this.selectedPoints = new THREE.Points(
      new THREE.BufferGeometry(),
      new THREE.PointsMaterial({
        color: 0xff6600,
        size: 13,
        sizeAttenuation: false,
        depthTest: false,
      })
    );
    this.selectedPoints.renderOrder = 999;
    this.sceneInstance.add(this.selectedPoints);

    this.setupLighting();
    this.setupGridHelper();
    this.setupAxesHelper();
    (this.canvasElement as unknown as { __viewportRenderer?: ViewportRenderer }).__viewportRenderer = this;
    (window as unknown as { THREE?: typeof THREE }).THREE = THREE;
  }

  public getAxisLines(): THREE.LineSegments | null {
    return this.axisLinesInstance;
  }

  public getCurrentModel(): MeshGeometry | null {
    return this.currentModelGeometry;
  }

  public render(): void {
    if (this.isRendererDisposed) {
      return;
    }

    const activeCamera = this.getActiveCamera();
    this.webGlRenderer.render(this.sceneInstance, activeCamera);
  }

  public getActiveCamera(): THREE.Camera {
    return this.isOrthographicViewActive
      ? this.orthographicCameraInstance
      : this.perspectiveCameraInstance;
  }

  public updateModel(meshGeometry: MeshGeometry): void {
    if (this.isRendererDisposed) {
      return;
    }

    this.currentModelGeometry = meshGeometry;

    const previousSurfaceGeometry = this.surfaceMesh.geometry;
    const previousWireframeGeometry = this.wireframeLines.geometry;
    const previousVertexPointsGeometry = this.vertexPoints.geometry;
    const previousSelectedGeometry = this.selectedPoints.geometry;

    this.surfaceMesh.geometry = this.buildSurfaceGeometry(meshGeometry);
    this.wireframeLines.geometry = this.buildWireframeGeometry(meshGeometry);
    this.vertexPoints.geometry = this.buildVertexPointsGeometry(meshGeometry);
    this.selectedPoints.geometry = this.buildSelectedPointsGeometry(
      meshGeometry,
      this.currentSelectedIndices
    );

    previousSurfaceGeometry.dispose();
    previousWireframeGeometry.dispose();
    previousVertexPointsGeometry.dispose();
    previousSelectedGeometry.dispose();

    this.render();
  }

  public updateSelection(
    selectedIndices: readonly number[],
    _activeIndex: number | null
  ): void {
    if (this.isRendererDisposed) {
      return;
    }

    this.currentSelectedIndices = selectedIndices;

    if (this.currentModelGeometry) {
      const previousSelectedGeometry = this.selectedPoints.geometry;
      this.selectedPoints.geometry = this.buildSelectedPointsGeometry(
        this.currentModelGeometry,
        this.currentSelectedIndices
      );
      previousSelectedGeometry.dispose();
      this.render();
    }
  }

  public updateRenderMode(renderMode: RenderMode): void {
    if (this.isRendererDisposed) {
      return;
    }

    const wireframeMaterial = this.wireframeLines
      .material as THREE.LineBasicMaterial;

    if (renderMode === "FLAT_SHADED") {
      this.surfaceMesh.visible = true;
      this.wireframeLines.visible = true;
      wireframeMaterial.color.set(0x444444);
      wireframeMaterial.transparent = true;
      wireframeMaterial.opacity = 0.35;
    } else {
      this.surfaceMesh.visible = false;
      this.wireframeLines.visible = true;
      wireframeMaterial.color.set(0x111111);
      wireframeMaterial.transparent = false;
      wireframeMaterial.opacity = 1.0;
    }

    wireframeMaterial.needsUpdate = true;
    this.render();
  }

  public updateCamera(
    cameraService: CameraStateService,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    if (this.isRendererDisposed) {
      return;
    }

    const activeStrategy = cameraService.getActiveStrategy();
    this.isOrthographicViewActive = cameraService.isOrthographic();

    const cameraDistance = cameraService.getCameraDistance();
    const targetPoint = cameraService.getTargetPoint();
    const viewDirection = activeStrategy.getViewDirection();
    const upDirection = activeStrategy.getUpDirection();

    const positionX =
      targetPoint.coordinateX + viewDirection.coordinateX * cameraDistance;
    const positionY =
      targetPoint.coordinateY + viewDirection.coordinateY * cameraDistance;
    const positionZ =
      targetPoint.coordinateZ + viewDirection.coordinateZ * cameraDistance;

    const safeHeight = viewportHeight > 0 ? viewportHeight : 1;
    const aspectRatio = viewportWidth / safeHeight;

    if (this.isOrthographicViewActive) {
      const frustumHeight = cameraDistance;
      const frustumWidth = frustumHeight * aspectRatio;

      this.orthographicCameraInstance.left = -frustumWidth / 2;
      this.orthographicCameraInstance.right = frustumWidth / 2;
      this.orthographicCameraInstance.top = frustumHeight / 2;
      this.orthographicCameraInstance.bottom = -frustumHeight / 2;

      this.orthographicCameraInstance.position.set(
        positionX,
        positionY,
        positionZ
      );
      this.orthographicCameraInstance.up.set(
        upDirection.coordinateX,
        upDirection.coordinateY,
        upDirection.coordinateZ
      );
      this.orthographicCameraInstance.lookAt(
        targetPoint.coordinateX,
        targetPoint.coordinateY,
        targetPoint.coordinateZ
      );
      this.orthographicCameraInstance.updateProjectionMatrix();
    } else {
      this.perspectiveCameraInstance.aspect = aspectRatio;
      this.perspectiveCameraInstance.position.set(
        positionX,
        positionY,
        positionZ
      );
      this.perspectiveCameraInstance.up.set(
        upDirection.coordinateX,
        upDirection.coordinateY,
        upDirection.coordinateZ
      );
      this.perspectiveCameraInstance.lookAt(
        targetPoint.coordinateX,
        targetPoint.coordinateY,
        targetPoint.coordinateZ
      );
      this.perspectiveCameraInstance.updateProjectionMatrix();
    }

    this.updateGrid(activeStrategy.getGridPlane(), this.isOrthographicViewActive);
    this.render();
  }

  public updateGrid(
    gridPlane: GridPlaneType,
    isOrthographic: boolean
  ): void {
    if (this.isRendererDisposed || !this.gridHelperInstance) {
      return;
    }

    if (!isOrthographic || gridPlane === "NONE") {
      this.gridHelperInstance.visible = false;
      return;
    }

    this.gridHelperInstance.visible = true;

    switch (gridPlane) {
      case "XY":
        this.gridHelperInstance.rotation.set(Math.PI / 2, 0, 0);
        break;
      case "YZ":
        this.gridHelperInstance.rotation.set(0, 0, Math.PI / 2);
        break;
      case "XZ":
      default:
        this.gridHelperInstance.rotation.set(0, 0, 0);
        break;
    }
  }

  public resize(viewportWidth: number, viewportHeight: number): void {
    if (this.isRendererDisposed || viewportWidth <= 0 || viewportHeight <= 0) {
      return;
    }

    this.webGlRenderer.setSize(viewportWidth, viewportHeight, false);
    this.render();
  }

  public dispose(): void {
    if (this.isRendererDisposed) {
      return;
    }

    this.isRendererDisposed = true;

    this.surfaceMesh.geometry.dispose();
    (this.surfaceMesh.material as THREE.Material).dispose();

    this.wireframeLines.geometry.dispose();
    (this.wireframeLines.material as THREE.Material).dispose();

    this.vertexPoints.geometry.dispose();
    (this.vertexPoints.material as THREE.Material).dispose();

    this.selectedPoints.geometry.dispose();
    (this.selectedPoints.material as THREE.Material).dispose();

    if (this.gridHelperInstance) {
      this.gridHelperInstance.geometry.dispose();
      if (Array.isArray(this.gridHelperInstance.material)) {
        for (const materialInstance of this.gridHelperInstance.material) {
          materialInstance.dispose();
        }
      } else {
        this.gridHelperInstance.material.dispose();
      }
    }

    if (this.axisLinesInstance) {
      this.axisLinesInstance.geometry.dispose();
      (this.axisLinesInstance.material as THREE.Material).dispose();
      this.axisLinesInstance = null;
    }

    this.webGlRenderer.dispose();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.sceneInstance.add(ambientLight);

    const primaryDirectionalLight = new THREE.DirectionalLight(
      0xffffff,
      1.2
    );
    primaryDirectionalLight.position.set(10, 20, 15);
    this.sceneInstance.add(primaryDirectionalLight);

    const secondaryDirectionalLight = new THREE.DirectionalLight(
      0xffffff,
      0.4
    );
    secondaryDirectionalLight.position.set(-10, -10, -10);
    this.sceneInstance.add(secondaryDirectionalLight);
  }

  private setupGridHelper(): void {
    const gridSize = 100;
    const gridDivisions = 100; // 100 / 100 = 1.0 unit cell spacing
    this.gridHelperInstance = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0x888888,
      0xd0d0d0
    );
    this.gridHelperInstance.position.set(0, 0, 0);
    this.gridHelperInstance.visible = false;
    this.sceneInstance.add(this.gridHelperInstance);
  }

  private setupAxesHelper(): void {
    const axisExtent = 100;
    const linePositions: number[] = [
      // X axis: positive ray (0 to axisExtent)
      0, 0, 0, axisExtent, 0, 0,
      // X axis: negative ray (-axisExtent to 0)
      -axisExtent, 0, 0, 0, 0, 0,

      // Y axis: positive ray (0 to axisExtent)
      0, 0, 0, 0, axisExtent, 0,
      // Y axis: negative ray (-axisExtent to 0)
      0, -axisExtent, 0, 0, 0, 0,

      // Z axis: positive ray (0 to axisExtent)
      0, 0, 0, 0, 0, axisExtent,
      // Z axis: negative ray (-axisExtent to 0)
      0, 0, -axisExtent, 0, 0, 0,
    ];

    const positiveColorX = new THREE.Color(AXIS_COLORS.positiveX);
    const negativeColorX = new THREE.Color(AXIS_COLORS.negativeX);
    const positiveColorY = new THREE.Color(AXIS_COLORS.positiveY);
    const negativeColorY = new THREE.Color(AXIS_COLORS.negativeY);
    const positiveColorZ = new THREE.Color(AXIS_COLORS.positiveZ);
    const negativeColorZ = new THREE.Color(AXIS_COLORS.negativeZ);

    const lineColors: number[] = [
      // X+ ray
      positiveColorX.r, positiveColorX.g, positiveColorX.b,
      positiveColorX.r, positiveColorX.g, positiveColorX.b,
      // X- ray
      negativeColorX.r, negativeColorX.g, negativeColorX.b,
      negativeColorX.r, negativeColorX.g, negativeColorX.b,

      // Y+ ray
      positiveColorY.r, positiveColorY.g, positiveColorY.b,
      positiveColorY.r, positiveColorY.g, positiveColorY.b,
      // Y- ray
      negativeColorY.r, negativeColorY.g, negativeColorY.b,
      negativeColorY.r, negativeColorY.g, negativeColorY.b,

      // Z+ ray
      positiveColorZ.r, positiveColorZ.g, positiveColorZ.b,
      positiveColorZ.r, positiveColorZ.g, positiveColorZ.b,
      // Z- ray
      negativeColorZ.r, negativeColorZ.g, negativeColorZ.b,
      negativeColorZ.r, negativeColorZ.g, negativeColorZ.b,
    ];

    const axisBufferGeometry = new THREE.BufferGeometry();
    axisBufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
    axisBufferGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(lineColors, 3)
    );

    const axisLineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    this.axisLinesInstance = new THREE.LineSegments(
      axisBufferGeometry,
      axisLineMaterial
    );
    this.axisLinesInstance.renderOrder = 1;
    this.sceneInstance.add(this.axisLinesInstance);
  }

  private buildSurfaceGeometry(
    meshGeometry: MeshGeometry
  ): THREE.BufferGeometry {
    const surfaceBufferGeometry = new THREE.BufferGeometry();

    if (meshGeometry.isEmpty()) {
      return surfaceBufferGeometry;
    }

    const surfacePositions: number[] = [];

    for (const currentFace of meshGeometry.faces) {
      const triangulatedFaces = currentFace.triangulate();
      for (const triangleFace of triangulatedFaces) {
        for (const vertexIndex of triangleFace.vertexIndices) {
          const currentVertex = meshGeometry.vertices[vertexIndex];
          if (currentVertex) {
            surfacePositions.push(
              currentVertex.coordinateX,
              currentVertex.coordinateY,
              currentVertex.coordinateZ
            );
          }
        }
      }
    }

    surfaceBufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(surfacePositions, 3)
    );
    surfaceBufferGeometry.computeVertexNormals();

    return surfaceBufferGeometry;
  }

  private buildWireframeGeometry(
    meshGeometry: MeshGeometry
  ): THREE.BufferGeometry {
    const wireframeBufferGeometry = new THREE.BufferGeometry();

    if (meshGeometry.isEmpty()) {
      return wireframeBufferGeometry;
    }

    const wireframePositions: number[] = [];
    const wireframeEdges = meshGeometry.getWireframeEdges();

    for (const [startVertexIndex, endVertexIndex] of wireframeEdges) {
      const startVertex = meshGeometry.vertices[startVertexIndex];
      const endVertex = meshGeometry.vertices[endVertexIndex];

      if (startVertex && endVertex) {
        wireframePositions.push(
          startVertex.coordinateX,
          startVertex.coordinateY,
          startVertex.coordinateZ,
          endVertex.coordinateX,
          endVertex.coordinateY,
          endVertex.coordinateZ
        );
      }
    }

    wireframeBufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(wireframePositions, 3)
    );

    return wireframeBufferGeometry;
  }

  private buildVertexPointsGeometry(
    meshGeometry: MeshGeometry
  ): THREE.BufferGeometry {
    const pointsBufferGeometry = new THREE.BufferGeometry();

    if (meshGeometry.isEmpty()) {
      return pointsBufferGeometry;
    }

    const positions: number[] = [];
    for (const currentVertex of meshGeometry.vertices) {
      positions.push(
        currentVertex.coordinateX,
        currentVertex.coordinateY,
        currentVertex.coordinateZ
      );
    }

    pointsBufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    return pointsBufferGeometry;
  }

  private buildSelectedPointsGeometry(
    meshGeometry: MeshGeometry,
    selectedIndices: readonly number[]
  ): THREE.BufferGeometry {
    const pointsBufferGeometry = new THREE.BufferGeometry();

    if (meshGeometry.isEmpty() || selectedIndices.length === 0) {
      return pointsBufferGeometry;
    }

    const positions: number[] = [];
    for (const index of selectedIndices) {
      const selectedVertex = meshGeometry.vertices[index];
      if (selectedVertex) {
        positions.push(
          selectedVertex.coordinateX,
          selectedVertex.coordinateY,
          selectedVertex.coordinateZ
        );
      }
    }

    pointsBufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );

    return pointsBufferGeometry;
  }
}
