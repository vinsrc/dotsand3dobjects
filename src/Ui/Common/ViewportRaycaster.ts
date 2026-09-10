import * as THREE from "three";
import { Vector3D } from "../../Application/Common/Vector3D";
import { GridPlaneType } from "../../Application/Services/CameraService/ViewStrategy";

export class ViewportRaycaster {
  private readonly temporaryVector: THREE.Vector3;

  public constructor() {
    this.temporaryVector = new THREE.Vector3();
  }

  public findNearestVertex(
    screenX: number,
    screenY: number,
    vertices: readonly Vector3D[],
    activeCamera: THREE.Camera,
    viewportWidth: number,
    viewportHeight: number,
    tolerancePixels: number = 25
  ): number | null {
    if (vertices.length === 0 || viewportWidth <= 0 || viewportHeight <= 0) {
      return null;
    }

    let closestVertexIndex: number | null = null;
    let closestDistanceSquared = tolerancePixels * tolerancePixels;

    for (let index = 0; index < vertices.length; index += 1) {
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

      if (distanceSquared < closestDistanceSquared) {
        closestDistanceSquared = distanceSquared;
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
    tolerancePixels: number = 20
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

      const distanceToEdge = this.distancePointToSegment(
        screenX,
        screenY,
        startScreenX,
        startScreenY,
        endScreenX,
        endScreenY
      );

      if (distanceToEdge < closestDistance) {
        closestDistance = distanceToEdge;
        closestEdge = [startIndex, endIndex];
      }
    }

    return closestEdge;
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

  private distancePointToSegment(
    pointX: number,
    pointY: number,
    segmentStartX: number,
    segmentStartY: number,
    segmentEndX: number,
    segmentEndY: number
  ): number {
    const segmentVectorX = segmentEndX - segmentStartX;
    const segmentVectorY = segmentEndY - segmentStartY;
    const segmentLengthSquared =
      segmentVectorX * segmentVectorX + segmentVectorY * segmentVectorY;

    if (segmentLengthSquared < 0.00001) {
      const deltaX = pointX - segmentStartX;
      const deltaY = pointY - segmentStartY;
      return Math.hypot(deltaX, deltaY);
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

    return Math.hypot(pointX - closestPointX, pointY - closestPointY);
  }
}
