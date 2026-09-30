import * as THREE from "three";
import { Vector3D } from "../../Application/Common/Vector3D";
import { Face3D } from "../../Application/Services/ModelService/Face3D";
import { MeshGeometry } from "../../Application/Services/ModelService/MeshGeometry";

export class MeshOcclusionChecker {
  private readonly cameraDirectionVector: THREE.Vector3;
  private readonly rayOriginVector: THREE.Vector3;
  private readonly rayDirectionVector: THREE.Vector3;
  private readonly hitPointVector: THREE.Vector3;
  private readonly triangleVertexA: THREE.Vector3;
  private readonly triangleVertexB: THREE.Vector3;
  private readonly triangleVertexC: THREE.Vector3;
  private readonly occlusionRay: THREE.Ray;

  public constructor() {
    this.cameraDirectionVector = new THREE.Vector3();
    this.rayOriginVector = new THREE.Vector3();
    this.rayDirectionVector = new THREE.Vector3();
    this.hitPointVector = new THREE.Vector3();
    this.triangleVertexA = new THREE.Vector3();
    this.triangleVertexB = new THREE.Vector3();
    this.triangleVertexC = new THREE.Vector3();
    this.occlusionRay = new THREE.Ray();
  }

  public isVertexOccluded(
    vertexIndex: number,
    vertex: Vector3D,
    meshGeometry: MeshGeometry,
    camera: THREE.Camera
  ): boolean {
    if (meshGeometry.faces.length === 0) {
      return false;
    }

    const distToCamera = this.computeRayTowardsCamera(
      vertex.coordinateX,
      vertex.coordinateY,
      vertex.coordinateZ,
      camera
    );

    return this.checkRayIntersectsOtherFaces(
      meshGeometry,
      distToCamera,
      (face) => face.vertexIndices.includes(vertexIndex)
    );
  }

  public isEdgeOccluded(
    edge: readonly [number, number],
    pointOnEdge: Vector3D,
    meshGeometry: MeshGeometry,
    camera: THREE.Camera
  ): boolean {
    if (meshGeometry.faces.length === 0) {
      return false;
    }

    const distToCamera = this.computeRayTowardsCamera(
      pointOnEdge.coordinateX,
      pointOnEdge.coordinateY,
      pointOnEdge.coordinateZ,
      camera
    );

    const firstIndex = edge[0];
    const secondIndex = edge[1];
    return this.checkRayIntersectsOtherFaces(
      meshGeometry,
      distToCamera,
      (face) =>
        face.vertexIndices.includes(firstIndex) &&
        face.vertexIndices.includes(secondIndex)
    );
  }

  public isFaceFacingCamera(
    face: Face3D,
    meshGeometry: MeshGeometry,
    camera: THREE.Camera
  ): boolean {
    const normal = face.calculateNormal(meshGeometry.vertices);
    const center = face.calculateCenter(meshGeometry.vertices);

    if (camera instanceof THREE.PerspectiveCamera) {
      this.rayDirectionVector.set(
        camera.position.x - center.coordinateX,
        camera.position.y - center.coordinateY,
        camera.position.z - center.coordinateZ
      );
    } else {
      camera.getWorldDirection(this.cameraDirectionVector);
      this.rayDirectionVector.copy(this.cameraDirectionVector).negate();
    }

    const dotProduct =
      normal.coordinateX * this.rayDirectionVector.x +
      normal.coordinateY * this.rayDirectionVector.y +
      normal.coordinateZ * this.rayDirectionVector.z;

    return dotProduct > 0.0001;
  }

  private computeRayTowardsCamera(
    worldX: number,
    worldY: number,
    worldZ: number,
    camera: THREE.Camera
  ): number {
    let distanceToCamera = Infinity;

    if (camera instanceof THREE.PerspectiveCamera) {
      this.rayDirectionVector.set(
        camera.position.x - worldX,
        camera.position.y - worldY,
        camera.position.z - worldZ
      );
      distanceToCamera = this.rayDirectionVector.length();
      if (distanceToCamera > 0.00001) {
        this.rayDirectionVector.divideScalar(distanceToCamera);
      } else {
        this.rayDirectionVector.set(0, 1, 0);
      }
    } else {
      camera.getWorldDirection(this.cameraDirectionVector);
      this.rayDirectionVector.copy(this.cameraDirectionVector).negate().normalize();
      distanceToCamera = 10000;
    }

    // Step slightly towards the camera to avoid false self-intersection on the origin point
    this.rayOriginVector.set(
      worldX + this.rayDirectionVector.x * 0.005,
      worldY + this.rayDirectionVector.y * 0.005,
      worldZ + this.rayDirectionVector.z * 0.005
    );

    this.occlusionRay.set(this.rayOriginVector, this.rayDirectionVector);
    return distanceToCamera;
  }

  private checkRayIntersectsOtherFaces(
    meshGeometry: MeshGeometry,
    maxDistance: number,
    shouldSkipFace: (face: Face3D) => boolean
  ): boolean {
    const vertices = meshGeometry.vertices;
    const faces = meshGeometry.faces;

    for (const face of faces) {
      if (shouldSkipFace(face)) {
        continue;
      }

      const triangles = face.triangulate();
      for (const triangle of triangles) {
        const indexA = triangle.vertexIndices[0];
        const indexB = triangle.vertexIndices[1];
        const indexC = triangle.vertexIndices[2];

        if (
          indexA === undefined ||
          indexB === undefined ||
          indexC === undefined
        ) {
          continue;
        }

        const vertexA = vertices[indexA];
        const vertexB = vertices[indexB];
        const vertexC = vertices[indexC];

        if (!vertexA || !vertexB || !vertexC) {
          continue;
        }

        this.triangleVertexA.set(
          vertexA.coordinateX,
          vertexA.coordinateY,
          vertexA.coordinateZ
        );
        this.triangleVertexB.set(
          vertexB.coordinateX,
          vertexB.coordinateY,
          vertexB.coordinateZ
        );
        this.triangleVertexC.set(
          vertexC.coordinateX,
          vertexC.coordinateY,
          vertexC.coordinateZ
        );

        const hit = this.occlusionRay.intersectTriangle(
          this.triangleVertexA,
          this.triangleVertexB,
          this.triangleVertexC,
          false,
          this.hitPointVector
        );

        if (hit) {
          const hitDistance = this.rayOriginVector.distanceTo(
            this.hitPointVector
          );
          if (hitDistance < maxDistance - 0.01) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
