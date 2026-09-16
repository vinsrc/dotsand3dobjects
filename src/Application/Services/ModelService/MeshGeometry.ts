import { Vector3D } from "../../Common/Vector3D";
import { Face3D } from "./Face3D";

export class MeshGeometry {
  public readonly vertices: readonly Vector3D[];
  public readonly faces: readonly Face3D[];
  public readonly explicitEdges: readonly [number, number][];
  private readonly wireframeEdges: readonly [number, number][];

  public constructor(
    vertices: readonly Vector3D[],
    faces: readonly Face3D[] = [],
    explicitEdges: readonly [number, number][] = []
  ) {
    this.vertices = [...vertices];
    this.faces = [...faces];
    this.explicitEdges = [...explicitEdges];
    this.wireframeEdges = this.buildUniqueEdges();
  }

  public static createEmpty(): MeshGeometry {
    return new MeshGeometry([]);
  }

  public isEmpty(): boolean {
    return this.vertices.length === 0;
  }

  public getVertexCount(): number {
    return this.vertices.length;
  }

  public getFaceCount(): number {
    return this.faces.length;
  }

  public getWireframeEdges(): readonly [number, number][] {
    return this.wireframeEdges;
  }

  public calculateBoundingBox(): {
    minimum: Vector3D;
    maximum: Vector3D;
  } {
    if (this.vertices.length === 0) {
      const zeroVector = new Vector3D(0, 0, 0);
      return { minimum: zeroVector, maximum: zeroVector };
    }

    let minCoordinateX = Infinity;
    let minCoordinateY = Infinity;
    let minCoordinateZ = Infinity;
    let maxCoordinateX = -Infinity;
    let maxCoordinateY = -Infinity;
    let maxCoordinateZ = -Infinity;

    for (const currentVertex of this.vertices) {
      if (currentVertex.coordinateX < minCoordinateX) {
        minCoordinateX = currentVertex.coordinateX;
      }
      if (currentVertex.coordinateY < minCoordinateY) {
        minCoordinateY = currentVertex.coordinateY;
      }
      if (currentVertex.coordinateZ < minCoordinateZ) {
        minCoordinateZ = currentVertex.coordinateZ;
      }

      if (currentVertex.coordinateX > maxCoordinateX) {
        maxCoordinateX = currentVertex.coordinateX;
      }
      if (currentVertex.coordinateY > maxCoordinateY) {
        maxCoordinateY = currentVertex.coordinateY;
      }
      if (currentVertex.coordinateZ > maxCoordinateZ) {
        maxCoordinateZ = currentVertex.coordinateZ;
      }
    }

    return {
      minimum: new Vector3D(minCoordinateX, minCoordinateY, minCoordinateZ),
      maximum: new Vector3D(maxCoordinateX, maxCoordinateY, maxCoordinateZ),
    };
  }

  public calculateCenter(): Vector3D {
    const boundingBox = this.calculateBoundingBox();
    return new Vector3D(
      (boundingBox.minimum.coordinateX + boundingBox.maximum.coordinateX) / 2,
      (boundingBox.minimum.coordinateY + boundingBox.maximum.coordinateY) / 2,
      (boundingBox.minimum.coordinateZ + boundingBox.maximum.coordinateZ) / 2
    );
  }

  public calculateFaceCenter(faceIndex: number): Vector3D {
    const targetFace = this.faces[faceIndex];
    if (!targetFace) {
      return this.calculateCenter();
    }
    return targetFace.calculateCenter(this.vertices);
  }

  public calculateBoundingRadius(): number {
    const centerPoint = this.calculateCenter();
    let maximumDistance = 0;

    for (const currentVertex of this.vertices) {
      const distanceToCenter = currentVertex.calculateDistanceTo(centerPoint);
      if (distanceToCenter > maximumDistance) {
        maximumDistance = distanceToCenter;
      }
    }

    return maximumDistance > 0 ? maximumDistance : 1;
  }

  public translate(offsetVector: Vector3D): MeshGeometry {
    const translatedVertices = this.vertices.map((currentVertex) =>
      currentVertex.add(offsetVector)
    );
    return new MeshGeometry(translatedVertices, this.faces, this.explicitEdges);
  }

  public rotateAroundAxis(
    centerPoint: Vector3D,
    axisDirection: Vector3D,
    angleRadians: number
  ): MeshGeometry {
    const normalizedAxis = axisDirection.normalize();
    const cosAngle = Math.cos(angleRadians);
    const sinAngle = Math.sin(angleRadians);

    const rotatedVertices = this.vertices.map((currentVertex) => {
      const relativeVector = currentVertex.subtract(centerPoint);
      const dotProduct = relativeVector.calculateDotProduct(normalizedAxis);
      const crossProduct = normalizedAxis.calculateCrossProduct(relativeVector);

      const rotatedX =
        relativeVector.coordinateX * cosAngle +
        crossProduct.coordinateX * sinAngle +
        normalizedAxis.coordinateX * dotProduct * (1 - cosAngle);
      const rotatedY =
        relativeVector.coordinateY * cosAngle +
        crossProduct.coordinateY * sinAngle +
        normalizedAxis.coordinateY * dotProduct * (1 - cosAngle);
      const rotatedZ =
        relativeVector.coordinateZ * cosAngle +
        crossProduct.coordinateZ * sinAngle +
        normalizedAxis.coordinateZ * dotProduct * (1 - cosAngle);

      return new Vector3D(
        centerPoint.coordinateX + rotatedX,
        centerPoint.coordinateY + rotatedY,
        centerPoint.coordinateZ + rotatedZ
      );
    });

    return new MeshGeometry(rotatedVertices, this.faces, this.explicitEdges);
  }

  public scale(scalarFactor: number, centerPoint?: Vector3D): MeshGeometry {
    if (!centerPoint) {
      const scaledVertices = this.vertices.map((currentVertex) =>
        currentVertex.scaleBy(scalarFactor)
      );
      return new MeshGeometry(scaledVertices, this.faces, this.explicitEdges);
    }
    const scaledVertices = this.vertices.map((currentVertex) => {
      const relativeVector = currentVertex.subtract(centerPoint);
      return centerPoint.add(relativeVector.scaleBy(scalarFactor));
    });
    return new MeshGeometry(scaledVertices, this.faces, this.explicitEdges);
  }

  public scaleAxes(
    scaleX: number,
    scaleY: number,
    scaleZ: number,
    centerPoint?: Vector3D
  ): MeshGeometry {
    const center = centerPoint ?? this.calculateCenter();
    const scaledVertices = this.vertices.map((currentVertex) => {
      const relativeX = currentVertex.coordinateX - center.coordinateX;
      const relativeY = currentVertex.coordinateY - center.coordinateY;
      const relativeZ = currentVertex.coordinateZ - center.coordinateZ;
      return new Vector3D(
        center.coordinateX + relativeX * scaleX,
        center.coordinateY + relativeY * scaleY,
        center.coordinateZ + relativeZ * scaleZ
      );
    });
    return new MeshGeometry(scaledVertices, this.faces, this.explicitEdges);
  }

  public fitToDimension(targetMaxDimension: number = 2.0): MeshGeometry {
    if (this.vertices.length === 0) {
      return this;
    }

    const boundingBox = this.calculateBoundingBox();
    const extentX =
      boundingBox.maximum.coordinateX - boundingBox.minimum.coordinateX;
    const extentY =
      boundingBox.maximum.coordinateY - boundingBox.minimum.coordinateY;
    const extentZ =
      boundingBox.maximum.coordinateZ - boundingBox.minimum.coordinateZ;
    const currentMaxDimension = Math.max(extentX, extentY, extentZ);

    const centerPoint = this.calculateCenter();
    const centeringOffset = new Vector3D(
      -centerPoint.coordinateX,
      -centerPoint.coordinateY,
      -centerPoint.coordinateZ
    );
    const centeredGeometry = this.translate(centeringOffset);

    if (currentMaxDimension > 0.000001) {
      const scalingFactor = targetMaxDimension / currentMaxDimension;
      return centeredGeometry.scale(scalingFactor);
    }

    return centeredGeometry;
  }

  private buildUniqueEdges(): readonly [number, number][] {
    const edgeKeySet = new Set<string>();
    const uniqueEdgeList: [number, number][] = [];

    for (const currentFace of this.faces) {
      const vertexIndices = currentFace.vertexIndices;
      const vertexCount = vertexIndices.length;

      for (
        let currentIndex = 0;
        currentIndex < vertexCount;
        currentIndex += 1
      ) {
        const nextIndex = (currentIndex + 1) % vertexCount;
        const startVertexIndex = vertexIndices[currentIndex];
        const endVertexIndex = vertexIndices[nextIndex];

        if (
          startVertexIndex !== undefined &&
          endVertexIndex !== undefined
        ) {
          const lowerIndex = Math.min(startVertexIndex, endVertexIndex);
          const higherIndex = Math.max(startVertexIndex, endVertexIndex);
          const edgeIdentifier = `${lowerIndex}_${higherIndex}`;

          if (!edgeKeySet.has(edgeIdentifier)) {
            edgeKeySet.add(edgeIdentifier);
            uniqueEdgeList.push([lowerIndex, higherIndex]);
          }
        }
      }
    }

    for (const [startVertexIndex, endVertexIndex] of this.explicitEdges) {
      if (
        startVertexIndex >= 0 &&
        startVertexIndex < this.vertices.length &&
        endVertexIndex >= 0 &&
        endVertexIndex < this.vertices.length &&
        startVertexIndex !== endVertexIndex
      ) {
        const lowerIndex = Math.min(startVertexIndex, endVertexIndex);
        const higherIndex = Math.max(startVertexIndex, endVertexIndex);
        const edgeIdentifier = `${lowerIndex}_${higherIndex}`;

        if (!edgeKeySet.has(edgeIdentifier)) {
          edgeKeySet.add(edgeIdentifier);
          uniqueEdgeList.push([lowerIndex, higherIndex]);
        }
      }
    }

    return uniqueEdgeList;
  }

  public assignMaterialToFaces(
    faceIndices: readonly number[],
    materialId: string | null
  ): MeshGeometry {
    const targetFaceSet = new Set(faceIndices);
    const updatedFaces = this.faces.map((face, index) => {
      if (targetFaceSet.has(index)) {
        return face.withMaterialId(materialId);
      }
      return face;
    });

    return new MeshGeometry(this.vertices, updatedFaces, this.explicitEdges);
  }

  public reverseFacesWinding(faceIndices: readonly number[]): MeshGeometry {
    if (faceIndices.length === 0) {
      return this;
    }

    const targetIndicesSet = new Set(
      faceIndices.filter(
        (targetIndex) => targetIndex >= 0 && targetIndex < this.faces.length
      )
    );

    if (targetIndicesSet.size === 0) {
      return this;
    }

    const updatedFaces = this.faces.map((face, index) => {
      if (targetIndicesSet.has(index)) {
        return face.withReversedVertices();
      }
      return face;
    });

    return new MeshGeometry(this.vertices, updatedFaces, this.explicitEdges);
  }

  public reverseFaceWinding(faceIndex: number): MeshGeometry {
    return this.reverseFacesWinding([faceIndex]);
  }
}
