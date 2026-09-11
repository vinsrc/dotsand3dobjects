import * as THREE from "three";
import { MeshGeometry } from "../../Application/Services/ModelService/MeshGeometry";
import { RenderMode } from "../../Application/Services/RenderModeService/RenderModeService";
import { CameraStateService } from "../../Application/Services/CameraService/CameraStateService";
import { GridPlaneType } from "../../Application/Services/CameraService/ViewStrategy";
import { AXIS_COLORS } from "./AxisColors";
import { Material3D } from "../../Application/Services/MaterialService/Material3D";

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
  private currentSelectedFaceIndex: number | null = null;
  private currentSelectedFaceIndices: readonly number[] = [];
  private currentMaterials: readonly Material3D[] = [];
  private readonly defaultSurfaceMaterial: THREE.MeshStandardMaterial;
  private dynamicMaterials: THREE.MeshStandardMaterial[] = [];
  private readonly loadedTextures: Map<string, THREE.Texture> = new Map();
  private selectedFaceMesh: THREE.Mesh;
  private activeAxisLabel: string = "";

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

    this.defaultSurfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    this.surfaceMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      this.defaultSurfaceMaterial
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

    this.selectedFaceMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthTest: true,
      })
    );
    this.selectedFaceMesh.renderOrder = 2;
    this.sceneInstance.add(this.selectedFaceMesh);

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

  public getActiveAxisLabel(): string {
    return this.activeAxisLabel;
  }

  public getSelectedFaceIndex(): number | null {
    return this.currentSelectedFaceIndex;
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

  public updateMaterials(materials: readonly Material3D[]): void {
    if (this.isRendererDisposed) {
      return;
    }
    this.currentMaterials = materials;
    if (this.currentModelGeometry) {
      const previousSurfaceGeometry = this.surfaceMesh.geometry;
      this.surfaceMesh.geometry = this.buildSurfaceGeometry(
        this.currentModelGeometry
      );
      previousSurfaceGeometry.dispose();
      this.render();
    }
  }

  public updateModel(
    meshGeometry: MeshGeometry,
    materials?: readonly Material3D[]
  ): void {
    if (this.isRendererDisposed) {
      return;
    }

    if (materials !== undefined) {
      this.currentMaterials = materials;
    }

    this.currentModelGeometry = meshGeometry;

    const previousSurfaceGeometry = this.surfaceMesh.geometry;
    const previousWireframeGeometry = this.wireframeLines.geometry;
    const previousVertexPointsGeometry = this.vertexPoints.geometry;
    const previousSelectedGeometry = this.selectedPoints.geometry;
    const previousSelectedFaceGeometry = this.selectedFaceMesh.geometry;

    this.surfaceMesh.geometry = this.buildSurfaceGeometry(meshGeometry);
    this.wireframeLines.geometry = this.buildWireframeGeometry(meshGeometry);
    this.vertexPoints.geometry = this.buildVertexPointsGeometry(meshGeometry);
    this.selectedPoints.geometry = this.buildSelectedPointsGeometry(
      meshGeometry,
      this.currentSelectedIndices
    );
    this.selectedFaceMesh.geometry = this.buildSelectedFaceGeometry(
      meshGeometry,
      this.currentSelectedFaceIndices
    );

    previousSurfaceGeometry.dispose();
    previousWireframeGeometry.dispose();
    previousVertexPointsGeometry.dispose();
    previousSelectedGeometry.dispose();
    previousSelectedFaceGeometry.dispose();

    this.render();
  }

  public updateSelection(
    selectedIndices: readonly number[],
    _activeIndex: number | null,
    selectedFaceIndexOrIndices: number | readonly number[] | null = null
  ): void {
    if (this.isRendererDisposed) {
      return;
    }

    this.currentSelectedIndices = selectedIndices;
    if (selectedFaceIndexOrIndices === null) {
      this.currentSelectedFaceIndices = [];
      this.currentSelectedFaceIndex = null;
    } else if (typeof selectedFaceIndexOrIndices === "number") {
      this.currentSelectedFaceIndices = [selectedFaceIndexOrIndices];
      this.currentSelectedFaceIndex = selectedFaceIndexOrIndices;
    } else {
      this.currentSelectedFaceIndices = selectedFaceIndexOrIndices;
      this.currentSelectedFaceIndex =
        selectedFaceIndexOrIndices.length > 0
          ? (selectedFaceIndexOrIndices[0] as number)
          : null;
    }

    if (this.currentModelGeometry) {
      const previousSelectedGeometry = this.selectedPoints.geometry;
      this.selectedPoints.geometry = this.buildSelectedPointsGeometry(
        this.currentModelGeometry,
        this.currentSelectedIndices
      );
      previousSelectedGeometry.dispose();

      const previousSelectedFaceGeometry = this.selectedFaceMesh.geometry;
      this.selectedFaceMesh.geometry = this.buildSelectedFaceGeometry(
        this.currentModelGeometry,
        this.currentSelectedFaceIndices
      );
      previousSelectedFaceGeometry.dispose();

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
    this.activeAxisLabel = activeStrategy.getAxisLabel();
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
    this.defaultSurfaceMaterial.dispose();
    for (const dynamicMaterial of this.dynamicMaterials) {
      dynamicMaterial.dispose();
    }
    this.dynamicMaterials = [];
    for (const texture of this.loadedTextures.values()) {
      texture.dispose();
    }
    this.loadedTextures.clear();

    this.wireframeLines.geometry.dispose();
    (this.wireframeLines.material as THREE.Material).dispose();

    this.vertexPoints.geometry.dispose();
    (this.vertexPoints.material as THREE.Material).dispose();

    this.selectedPoints.geometry.dispose();
    (this.selectedPoints.material as THREE.Material).dispose();

    this.selectedFaceMesh.geometry.dispose();
    (this.selectedFaceMesh.material as THREE.Material).dispose();

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

  private getTexture(imageUrl: string): THREE.Texture {
    let texture = this.loadedTextures.get(imageUrl);
    if (!texture) {
      const textureLoader = new THREE.TextureLoader();
      texture = textureLoader.load(imageUrl, () => {
        if (!this.isRendererDisposed) {
          this.render();
        }
      });
      this.loadedTextures.set(imageUrl, texture);
    }
    return texture;
  }

  private buildSurfaceGeometry(
    meshGeometry: MeshGeometry
  ): THREE.BufferGeometry {
    const surfaceBufferGeometry = new THREE.BufferGeometry();

    const materialIndexMap = new Map<string, number>();
    const createdMaterials: THREE.MeshStandardMaterial[] = [];

    for (
      let materialIndex = 0;
      materialIndex < this.currentMaterials.length;
      materialIndex += 1
    ) {
      const currentMaterial = this.currentMaterials[materialIndex];
      materialIndexMap.set(currentMaterial.id, materialIndex + 1);

      if (currentMaterial.hasImage() && currentMaterial.imageUrl) {
        const texture = this.getTexture(currentMaterial.imageUrl);
        createdMaterials.push(
          new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.5,
            metalness: 0.0,
            flatShading: true,
            side: THREE.DoubleSide,
          })
        );
      } else {
        createdMaterials.push(
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(currentMaterial.baseColor),
            roughness: currentMaterial.roughness,
            metalness: currentMaterial.metalness,
            flatShading: true,
            side: THREE.DoubleSide,
          })
        );
      }
    }

    for (const dynamicMaterial of this.dynamicMaterials) {
      dynamicMaterial.dispose();
    }
    this.dynamicMaterials = createdMaterials;

    if (this.dynamicMaterials.length > 0) {
      this.surfaceMesh.material = [
        this.defaultSurfaceMaterial,
        ...this.dynamicMaterials,
      ];
    } else {
      this.surfaceMesh.material = this.defaultSurfaceMaterial;
    }

    if (meshGeometry.isEmpty()) {
      return surfaceBufferGeometry;
    }

    const surfacePositions: number[] = [];
    const surfaceUvs: number[] = [];
    let currentVertexOffset = 0;

    for (const currentFace of meshGeometry.faces) {
      const triangulatedFaces = currentFace.triangulate();
      const faceVertices = currentFace.vertexIndices
        .map((vertexIndex) => meshGeometry.vertices[vertexIndex])
        .filter(Boolean);

      let minPlanarU = Infinity;
      let maxPlanarU = -Infinity;
      let minPlanarV = Infinity;
      let maxPlanarV = -Infinity;

      let planeProjectionMode: "xy" | "yz" | "xz" = "xy";
      if (faceVertices.length >= 3) {
        const firstVertex = faceVertices[0];
        const secondVertex = faceVertices[1];
        const thirdVertex = faceVertices[2];
        const vector1X = secondVertex.coordinateX - firstVertex.coordinateX;
        const vector1Y = secondVertex.coordinateY - firstVertex.coordinateY;
        const vector1Z = secondVertex.coordinateZ - firstVertex.coordinateZ;
        const vector2X = thirdVertex.coordinateX - firstVertex.coordinateX;
        const vector2Y = thirdVertex.coordinateY - firstVertex.coordinateY;
        const vector2Z = thirdVertex.coordinateZ - firstVertex.coordinateZ;

        const normalX = vector1Y * vector2Z - vector1Z * vector2Y;
        const normalY = vector1Z * vector2X - vector1X * vector2Z;
        const normalZ = vector1X * vector2Y - vector1Y * vector2X;

        const absoluteNormalX = Math.abs(normalX);
        const absoluteNormalY = Math.abs(normalY);
        const absoluteNormalZ = Math.abs(normalZ);

        if (
          absoluteNormalZ >= absoluteNormalX &&
          absoluteNormalZ >= absoluteNormalY
        ) {
          planeProjectionMode = "xy";
        } else if (
          absoluteNormalX >= absoluteNormalY &&
          absoluteNormalX >= absoluteNormalZ
        ) {
          planeProjectionMode = "yz";
        } else {
          planeProjectionMode = "xz";
        }
      }

      for (const vertex of faceVertices) {
        let planarCoordinateU = vertex.coordinateX;
        let planarCoordinateV = vertex.coordinateY;
        if (planeProjectionMode === "yz") {
          planarCoordinateU = vertex.coordinateY;
          planarCoordinateV = vertex.coordinateZ;
        } else if (planeProjectionMode === "xz") {
          planarCoordinateU = vertex.coordinateX;
          planarCoordinateV = vertex.coordinateZ;
        }
        if (planarCoordinateU < minPlanarU) minPlanarU = planarCoordinateU;
        if (planarCoordinateU > maxPlanarU) maxPlanarU = planarCoordinateU;
        if (planarCoordinateV < minPlanarV) minPlanarV = planarCoordinateV;
        if (planarCoordinateV > maxPlanarV) maxPlanarV = planarCoordinateV;
      }

      const planarRangeU =
        maxPlanarU - minPlanarU > 1e-6 ? maxPlanarU - minPlanarU : 1;
      const planarRangeV =
        maxPlanarV - minPlanarV > 1e-6 ? maxPlanarV - minPlanarV : 1;

      let faceVertexCount = 0;
      for (const triangleFace of triangulatedFaces) {
        for (const vertexIndex of triangleFace.vertexIndices) {
          const currentVertex = meshGeometry.vertices[vertexIndex];
          if (currentVertex) {
            surfacePositions.push(
              currentVertex.coordinateX,
              currentVertex.coordinateY,
              currentVertex.coordinateZ
            );

            let planarCoordinateU = currentVertex.coordinateX;
            let planarCoordinateV = currentVertex.coordinateY;
            if (planeProjectionMode === "yz") {
              planarCoordinateU = currentVertex.coordinateY;
              planarCoordinateV = currentVertex.coordinateZ;
            } else if (planeProjectionMode === "xz") {
              planarCoordinateU = currentVertex.coordinateX;
              planarCoordinateV = currentVertex.coordinateZ;
            }

            const uvCoordinateU = (planarCoordinateU - minPlanarU) / planarRangeU;
            const uvCoordinateV = (planarCoordinateV - minPlanarV) / planarRangeV;
            surfaceUvs.push(uvCoordinateU, uvCoordinateV);
            faceVertexCount += 1;
          }
        }
      }

      const materialGroupIndex =
        currentFace.materialId && materialIndexMap.has(currentFace.materialId)
          ? (materialIndexMap.get(currentFace.materialId) as number)
          : 0;

      if (this.dynamicMaterials.length > 0 && faceVertexCount > 0) {
        surfaceBufferGeometry.addGroup(
          currentVertexOffset,
          faceVertexCount,
          materialGroupIndex
        );
      }
      currentVertexOffset += faceVertexCount;
    }

    surfaceBufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(surfacePositions, 3)
    );
    surfaceBufferGeometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(surfaceUvs, 2)
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

  private buildSelectedFaceGeometry(
    meshGeometry: MeshGeometry,
    selectedFaceIndices: readonly number[]
  ): THREE.BufferGeometry {
    const faceGeometry = new THREE.BufferGeometry();
    if (meshGeometry.isEmpty() || selectedFaceIndices.length === 0) {
      return faceGeometry;
    }

    const positions: number[] = [];
    for (const selectedFaceIndex of selectedFaceIndices) {
      if (
        selectedFaceIndex < 0 ||
        selectedFaceIndex >= meshGeometry.faces.length
      ) {
        continue;
      }

      const face = meshGeometry.faces[selectedFaceIndex];
      const baseVertex = meshGeometry.vertices[face.vertexIndices[0]];
      for (
        let triangleIndex = 1;
        triangleIndex < face.vertexIndices.length - 1;
        triangleIndex += 1
      ) {
        const secondVertex =
          meshGeometry.vertices[face.vertexIndices[triangleIndex]];
        const thirdVertex =
          meshGeometry.vertices[face.vertexIndices[triangleIndex + 1]];
        if (baseVertex && secondVertex && thirdVertex) {
          positions.push(
            baseVertex.coordinateX,
            baseVertex.coordinateY,
            baseVertex.coordinateZ,
            secondVertex.coordinateX,
            secondVertex.coordinateY,
            secondVertex.coordinateZ,
            thirdVertex.coordinateX,
            thirdVertex.coordinateY,
            thirdVertex.coordinateZ
          );
        }
      }
    }

    faceGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    faceGeometry.computeVertexNormals();
    return faceGeometry;
  }
}
