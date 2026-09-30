import * as THREE from "three";
import { MeshGeometry } from "../../Application/Services/ModelService/MeshGeometry";

interface IndicatorComponents {
  group: THREE.Group;
  frontGeometry: THREE.BufferGeometry;
  backGeometry: THREE.BufferGeometry;
  frontMaterial: THREE.Material;
  backMaterial: THREE.Material;
}

export class FaceNormalRenderer {
  private readonly sceneInstance: THREE.Scene;
  private readonly rootIndicatorGroup: THREE.Group;
  private readonly indicatorComponentsList: IndicatorComponents[] = [];
  private frontTexture: THREE.CanvasTexture | null = null;
  private backTexture: THREE.CanvasTexture | null = null;

  public constructor(scene: THREE.Scene) {
    this.sceneInstance = scene;
    this.rootIndicatorGroup = new THREE.Group();
    this.rootIndicatorGroup.name = "FaceNormalGroup";
    this.rootIndicatorGroup.renderOrder = 995;
    this.sceneInstance.add(this.rootIndicatorGroup);
  }

  public updateNormals(
    meshGeometry: MeshGeometry,
    selectedFaceIndices: readonly number[]
  ): void {
    this.clear();

    if (meshGeometry.isEmpty() || selectedFaceIndices.length === 0) {
      return;
    }

    const frontTexture = this.getOrCreateTexture("FRONT");
    const backTexture = this.getOrCreateTexture("BACK");

    for (const faceIndex of selectedFaceIndices) {
      if (faceIndex < 0 || faceIndex >= meshGeometry.faces.length) {
        continue;
      }

      const face = meshGeometry.faces[faceIndex];
      if (!face) {
        continue;
      }

      const normalVector = face.calculateNormal(meshGeometry.vertices);
      const centerPoint = face.calculateCenter(meshGeometry.vertices);

      const normalDirection = new THREE.Vector3(
        normalVector.coordinateX,
        normalVector.coordinateY,
        normalVector.coordinateZ
      );

      if (normalDirection.lengthSq() < 1e-6) {
        normalDirection.set(0, 1, 0);
      } else {
        normalDirection.normalize();
      }

      // Compute average radius from centroid to vertices for proportional badge sizing
      let totalDistance = 0;
      for (const vertexIndex of face.vertexIndices) {
        const vertex = meshGeometry.vertices[vertexIndex];
        if (vertex) {
          totalDistance += Math.hypot(
            vertex.coordinateX - centerPoint.coordinateX,
            vertex.coordinateY - centerPoint.coordinateY,
            vertex.coordinateZ - centerPoint.coordinateZ
          );
        }
      }
      const averageRadius =
        face.vertexIndices.length > 0
          ? totalDistance / face.vertexIndices.length
          : 1;

      // Badge dimensions (2:1 aspect ratio)
      const badgeWidth = Math.max(0.35, Math.min(1.2, averageRadius * 0.55));
      const badgeHeight = badgeWidth * 0.5;

      const frontGeometry = new THREE.PlaneGeometry(badgeWidth, badgeHeight);
      const backGeometry = new THREE.PlaneGeometry(badgeWidth, badgeHeight);

      const frontMaterialParams: THREE.MeshBasicMaterialParameters = {
        color: frontTexture ? 0xffffff : 0x2ecc71,
        transparent: true,
        side: THREE.FrontSide,
        depthTest: false,
      };
      if (frontTexture) {
        frontMaterialParams.map = frontTexture;
      }
      const frontMaterial = new THREE.MeshBasicMaterial(frontMaterialParams);

      const backMaterialParams: THREE.MeshBasicMaterialParameters = {
        color: backTexture ? 0xffffff : 0xe67e22,
        transparent: true,
        side: THREE.FrontSide,
        depthTest: false,
      };
      if (backTexture) {
        backMaterialParams.map = backTexture;
      }
      const backMaterial = new THREE.MeshBasicMaterial(backMaterialParams);

      const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
      frontMesh.position.set(0, 0, 0.005);
      frontMesh.renderOrder = 995;
      frontMesh.userData = { label: "FRONT", faceIndex };

      const backMesh = new THREE.Mesh(backGeometry, backMaterial);
      backMesh.position.set(0, 0, -0.005);
      backMesh.rotation.y = Math.PI; // Face opposite direction, text reads left-to-right when viewed from back
      backMesh.renderOrder = 995;
      backMesh.userData = { label: "BACK", faceIndex };

      const singleFaceGroup = new THREE.Group();
      singleFaceGroup.userData = {
        isFaceOrientationIndicator: true,
        isFaceNormalArrow: true, // For backwards compatibility
        faceIndex,
        normal: normalDirection.clone(),
      };
      singleFaceGroup.add(frontMesh);
      singleFaceGroup.add(backMesh);

      singleFaceGroup.position.set(
        centerPoint.coordinateX,
        centerPoint.coordinateY,
        centerPoint.coordinateZ
      );

      // Build right-handed orthonormal basis: X = right, Y = up, Z = normal
      const referenceUp =
        Math.abs(normalDirection.y) > 0.9
          ? new THREE.Vector3(0, 0, -1)
          : new THREE.Vector3(0, 1, 0);
      const rightVector = new THREE.Vector3()
        .crossVectors(referenceUp, normalDirection)
        .normalize();
      const upVector = new THREE.Vector3()
        .crossVectors(normalDirection, rightVector)
        .normalize();

      const basisMatrix = new THREE.Matrix4().makeBasis(
        rightVector,
        upVector,
        normalDirection
      );
      singleFaceGroup.quaternion.setFromRotationMatrix(basisMatrix);

      this.rootIndicatorGroup.add(singleFaceGroup);
      this.indicatorComponentsList.push({
        group: singleFaceGroup,
        frontGeometry,
        backGeometry,
        frontMaterial,
        backMaterial,
      });
    }
  }

  public clear(): void {
    for (const item of this.indicatorComponentsList) {
      this.rootIndicatorGroup.remove(item.group);
      item.frontGeometry.dispose();
      item.backGeometry.dispose();
      item.frontMaterial.dispose();
      item.backMaterial.dispose();
    }
    this.indicatorComponentsList.length = 0;
  }

  public dispose(): void {
    this.clear();
    if (this.frontTexture) {
      this.frontTexture.dispose();
      this.frontTexture = null;
    }
    if (this.backTexture) {
      this.backTexture.dispose();
      this.backTexture = null;
    }
    this.sceneInstance.remove(this.rootIndicatorGroup);
  }

  public getArrowCount(): number {
    return this.indicatorComponentsList.length;
  }

  public getIndicatorCount(): number {
    return this.indicatorComponentsList.length;
  }

  public getArrowGroup(): THREE.Group {
    return this.rootIndicatorGroup;
  }

  private getOrCreateTexture(type: "FRONT" | "BACK"): THREE.CanvasTexture | null {
    if (type === "FRONT") {
      if (!this.frontTexture) {
        this.frontTexture = this.createBadgeTexture("FRONT");
      }
      return this.frontTexture;
    }

    if (!this.backTexture) {
      this.backTexture = this.createBadgeTexture("BACK");
    }
    return this.backTexture;
  }

  private createBadgeTexture(text: "FRONT" | "BACK"): THREE.CanvasTexture | null {
    if (typeof document === "undefined") {
      return null;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return null;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isFront = text === "FRONT";
      const padX = 24;
      const padY = 20;
      const radius = 40;
      const boxW = canvas.width - padX * 2;
      const boxH = canvas.height - padY * 2;

      ctx.save();

      // Rounded badge background
      ctx.beginPath();
      ctx.roundRect(padX, padY, boxW, boxH, radius);
      ctx.fillStyle = "rgba(18, 18, 22, 0.92)";
      ctx.fill();

      // Accent border
      ctx.lineWidth = 12;
      ctx.strokeStyle = isFront ? "#2ecc71" : "#f39c12";
      ctx.stroke();

      // Accent dot
      ctx.beginPath();
      ctx.arc(padX + 54, canvas.height / 2, 18, 0, Math.PI * 2);
      ctx.fillStyle = isFront ? "#2ecc71" : "#f39c12";
      ctx.fill();

      // Label text
      ctx.fillStyle = "#ffffff";
      ctx.font =
        "bold 96px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2 + 20, canvas.height / 2 + 4);

      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      return texture;
    } catch {
      return null;
    }
  }
}
