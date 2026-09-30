import * as THREE from "three";
import { Vector3D } from "../../Application/Common/Vector3D";
import { Face3D } from "../../Application/Services/ModelService/Face3D";
import { MeshGeometry } from "../../Application/Services/ModelService/MeshGeometry";
import { GridPlaneType } from "../../Application/Services/CameraService/ViewStrategy";
import { MeshOcclusionChecker } from "./MeshOcclusionChecker";

export class ViewportRaycaster {
  private readonly temporaryVector: THREE.Vector3;
  private readonly occlusionChecker: MeshOcclusionChecker;

  public constructor(
    occlusionChecker: MeshOcclusionChecker = new MeshOcclusionChecker()
  ) {
    this.temporaryVector = new THREE.Vector3();
    this.occlusionChecker = occlusionChecker;
  }

  public getOcclusionChecker(): MeshOcclusionChecker {
    return this.occlusionChecker;
  }

  public findNearestVertex(
    screenX: number,
    screenY: number,
    vertices: readonly Vector3D[],
    activeCamera: THREE.Camera,
    viewportWidth: number,
    viewportHeight: number,
    tolerancePixels: number = 25,
    candidateIndices?: readonly number[] | null,
    meshGeometry?: MeshGeometry,
    isShaded: boolean = false
  ): number | null {
    if (vertices.length === 0 || viewportWidth <= 0 || viewportHeight <= 0) {
      return null;
    }

    let closestVertexIndex: number | null = null;
    let closestDistanceSquared = tolerancePixels * tolerancePixels;
    let closestNdcZ = 1.0;

    const indicesToIterate =
      candidateIndices !== null && candidateIndices !== undefined
        ? candidateIndices
        : Array.from({ length: vertices.length }, (_, index) => index);

    for (const index of indicesToIterate) {
      const vertex = vertices[index];
      if (!vertex) {
        continue;
      }

      this.temporaryVector.set(
        vertex.coordinateX,
        vertex.coordinateY,
        vertex.coordinateZ
      );
      this.temporaryVector.project(activeCamera);

      // Check if point is behind camera in perspective
      if (this.temporaryVector.z > 1.0) {
        continue;
      }

      const projectedScreenX =
        ((this.temporaryVector.x + 1) * viewportWidth) / 2;
      const projectedScreenY =
        ((-this.temporaryVector.y + 1) * viewportHeight) / 2;

      const deltaX = screenX - projectedScreenX;
      const deltaY = screenY - projectedScreenY;
      const distanceSquared = deltaX * deltaX + deltaY * deltaY;

      if (distanceSquared > tolerancePixels * tolerancePixels) {
        continue;
      }

      if (
        isShaded &&
        meshGeometry &&
        this.occlusionChecker.isVertexOccluded(
          index,
          vertex,
          meshGeometry,
          activeCamera
        )
      ) {
        continue;
      }

      const isSignificantlyCloserDistance =
        distanceSquared < closestDistanceSquared - 0.25;
      const isApproximatelySameDistance =
        Math.abs(distanceSquared - closestDistanceSquared) <= 0.25;
      const isCloserToCameraDepth = this.temporaryVector.z < closestNdcZ;

      if (
        isSignificantlyCloserDistance ||
        (isApproximatelySameDistance && isCloserToCameraDepth)
      ) {
        closestDistanceSquared = distanceSquared;
        closestNdcZ = this.temporaryVector.z;
        closestVertexIndex = index;
      }
    }

    return closestVertexIndex;
  }

  public findNearestEdge(
    screenX: number,
    screenY: number,
    edges: readonly [number, number][],
    vertices: readonly Vector3D[],
    activeCamera: THREE.Camera,
    viewportWidth: number,
    viewportHeight: number,
    tolerancePixels: number = 20,
    meshGeometry?: MeshGeometry,
    isShaded: boolean = false
  ): [number, number] | null {
    if (edges.length === 0 || viewportWidth <= 0 || viewportHeight <= 0) {
      return null;
    }

    let closestEdge: [number, number] | null = null;
    let closestDistance = tolerancePixels;

    for (const [startIndex, endIndex] of edges) {
      const startVertex = vertices[startIndex];
      const endVertex = vertices[endIndex];
      if (!startVertex || !endVertex) {
        continue;
      }

      this.temporaryVector.set(
        startVertex.coordinateX,
        startVertex.coordinateY,
        startVertex.coordinateZ
      );
      this.temporaryVector.project(activeCamera);
      const startScreenX = ((this.temporaryVector.x + 1) * viewportWidth) / 2;
      const startScreenY = ((-this.temporaryVector.y + 1) * viewportHeight) / 2;

      this.temporaryVector.set(
        endVertex.coordinateX,
        endVertex.coordinateY,
        endVertex.coordinateZ
      );
      this.temporaryVector.project(activeCamera);
      const endScreenX = ((this.temporaryVector.x + 1) * viewportWidth) / 2;
      const endScreenY = ((-this.temporaryVector.y + 1) * viewportHeight) / 2;

      const { distance: distanceToEdge, parameter: projectionParam } =
        this.distancePointToSegmentWithParam(
          screenX,
          screenY,
          startScreenX,
          startScreenY,
          endScreenX,
          endScreenY
        );

      if (distanceToEdge >= closestDistance) {
        continue;
      }

      if (isShaded && meshGeometry) {
        const pointOnEdge = startVertex.add(
          endVertex.subtract(startVertex).scaleBy(projectionParam)
        );
        if (
          this.occlusionChecker.isEdgeOccluded(
            [startIndex, endIndex],
            pointOnEdge,
            meshGeometry,
            activeCamera
          )
        ) {
          continue;
        }
      }

      closestDistance = distanceToEdge;
      closestEdge = [startIndex, endIndex];
    }

    return closestEdge;
  }

  public findNearestFace(
    screenX: number,
    screenY: number,
    meshGeometry: MeshGeometry,
    activeCamera: THREE.Camera,
    viewportWidth: number,
    viewportHeight: number,
    isShaded: boolean = false
  ): number | null {
    const faces = meshGeometry.faces;
    const vertices = meshGeometry.vertices;
    if (
      faces.length === 0 ||
      vertices.length === 0 ||
      viewportWidth <= 0 ||
      viewportHeight <= 0
    ) {
      return null;
    }

    const ndcX = (screenX / viewportWidth) * 2 - 1;
    const ndcY = -(screenY / viewportHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), activeCamera);

    let closestFaceIndex: number | null = null;
    let closestDistance = Infinity;

    const triangleVectorA = new THREE.Vector3();
    const triangleVectorB = new THREE.Vector3();
    const triangleVectorC = new THREE.Vector3();
    const intersectionPoint = new THREE.Vector3();

    for (let faceIndex = 0; faceIndex < faces.length; faceIndex += 1) {
      const face = faces[faceIndex];
      if (!face) {
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

        triangleVectorA.set(
          vertexA.coordinateX,
          vertexA.coordinateY,
          vertexA.coordinateZ
        );
        triangleVectorB.set(
          vertexB.coordinateX,
          vertexB.coordinateY,
          vertexB.coordinateZ
        );
        triangleVectorC.set(
          vertexC.coordinateX,
          vertexC.coordinateY,
          vertexC.coordinateZ
        );

        const hit = raycaster.ray.intersectTriangle(
          triangleVectorA,
          triangleVectorB,
          triangleVectorC,
          false,
          intersectionPoint
        );

        if (hit) {
          const distanceToCamera =
            raycaster.ray.origin.distanceTo(intersectionPoint);
          if (distanceToCamera < closestDistance) {
            closestDistance = distanceToCamera;
            closestFaceIndex = faceIndex;
          }
        }
      }
    }

    return closestFaceIndex;
  }

  public unprojectToGridPlane(
    screenX: number,
    screenY: number,
    activeCamera: THREE.Camera,
    gridPlane: GridPlaneType,
    viewportWidth: number,
    viewportHeight: number,
    targetPoint: Vector3D
  ): Vector3D | null {
    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return null;
    }

    // Convert screen coordinates to Normalized Device Coordinates (-1 to +1)
    const ndcX = (screenX / viewportWidth) * 2 - 1;
    const ndcY = -(screenY / viewportHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), activeCamera);

    let planeNormal = new THREE.Vector3(0, 1, 0);
    let planePoint = new THREE.Vector3(
      targetPoint.coordinateX,
      targetPoint.coordinateY,
      targetPoint.coordinateZ
    );

    switch (gridPlane) {
      case "XY":
        planeNormal = new THREE.Vector3(0, 0, 1);
        break;
      case "YZ":
        planeNormal = new THREE.Vector3(1, 0, 0);
        break;
      case "XZ":
      default:
        planeNormal = new THREE.Vector3(0, 1, 0);
        break;
    }

    const mathPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      planeNormal,
      planePoint
    );

    const intersectionTarget = new THREE.Vector3();
    const intersection = raycaster.ray.intersectPlane(
      mathPlane,
      intersectionTarget
    );

    if (!intersection) {
      return null;
    }

    return new Vector3D(
      intersection.x,
      intersection.y,
      intersection.z
    );
  }

  private distancePointToSegmentWithParam(
    pointX: number,
    pointY: number,
    segmentStartX: number,
    segmentStartY: number,
    segmentEndX: number,
    segmentEndY: number
  ): { distance: number; parameter: number } {
    const segmentVectorX = segmentEndX - segmentStartX;
    const segmentVectorY = segmentEndY - segmentStartY;
    const segmentLengthSquared =
      segmentVectorX * segmentVectorX + segmentVectorY * segmentVectorY;

    if (segmentLengthSquared < 0.00001) {
      const deltaX = pointX - segmentStartX;
      const deltaY = pointY - segmentStartY;
      return { distance: Math.hypot(deltaX, deltaY), parameter: 0 };
    }

    const projectionParameter = Math.max(
      0,
      Math.min(
        1,
        ((pointX - segmentStartX) * segmentVectorX +
          (pointY - segmentStartY) * segmentVectorY) /
          segmentLengthSquared
      )
    );

    const closestPointX = segmentStartX + projectionParameter * segmentVectorX;
    const closestPointY = segmentStartY + projectionParameter * segmentVectorY;

    return {
      distance: Math.hypot(pointX - closestPointX, pointY - closestPointY),
      parameter: projectionParameter,
    };
  }

  private distancePointToSegment(
    pointX: number,
    pointY: number,
    segmentStartX: number,
    segmentStartY: number,
    segmentEndX: number,
    segmentEndY: number
  ): number {
    return this.distancePointToSegmentWithParam(
      pointX,
      pointY,
      segmentStartX,
      segmentStartY,
      segmentEndX,
      segmentEndY
    ).distance;
  }
}
