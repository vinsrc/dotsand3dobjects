import { Vector3D } from "../../Common/Vector3D";

export class DecalPlane {
  public readonly id: string;
  public readonly parentFaceIndex: number;
  public readonly center: Vector3D;
  public readonly normal: Vector3D;
  public readonly size: number;
  public readonly rotationAngle: number;
  public readonly vertices: readonly [Vector3D, Vector3D, Vector3D, Vector3D];
  public readonly materialId: string | null;

  public constructor(
    id: string,
    parentFaceIndex: number,
    center: Vector3D,
    normal: Vector3D,
    size: number,
    rotationAngle: number,
    vertices: readonly [Vector3D, Vector3D, Vector3D, Vector3D],
    materialId: string | null = null
  ) {
    this.id = id;
    this.parentFaceIndex = parentFaceIndex;
    this.center = center;
    this.normal = normal.normalize();
    this.size = size;
    this.rotationAngle = rotationAngle;
    this.vertices = vertices;
    this.materialId = materialId;
  }

  public static createFromFace(
    id: string,
    parentFaceIndex: number,
    faceVertices: readonly Vector3D[],
    sizeFraction: number = 0.6,
    normalOffset: number = 0.005
  ): DecalPlane {
    if (faceVertices.length < 3) {
      throw new Error("Cannot create decal plane: face has fewer than 3 vertices");
    }

    // Centroid of the face
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    for (const v of faceVertices) {
      sumX += v.coordinateX;
      sumY += v.coordinateY;
      sumZ += v.coordinateZ;
    }
    const faceCenter = new Vector3D(
      sumX / faceVertices.length,
      sumY / faceVertices.length,
      sumZ / faceVertices.length
    );

    // Normal calculation via Newell's method
    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;
    const vertexCount = faceVertices.length;
    for (let index = 0; index < vertexCount; index += 1) {
      const current = faceVertices[index] as Vector3D;
      const next = faceVertices[(index + 1) % vertexCount] as Vector3D;
      normalX += (current.coordinateY - next.coordinateY) * (current.coordinateZ + next.coordinateZ);
      normalY += (current.coordinateZ - next.coordinateZ) * (current.coordinateX + next.coordinateX);
      normalZ += (current.coordinateX - next.coordinateX) * (current.coordinateY + next.coordinateY);
    }
    let faceNormal = new Vector3D(normalX, normalY, normalZ);
    if (faceNormal.calculateMagnitude() < 0.0001) {
      faceNormal = new Vector3D(0, 0, 1);
    }
    const unitNormal = faceNormal.normalize();

    // Determine scale from average distance to vertices
    let totalDist = 0;
    for (const v of faceVertices) {
      totalDist += v.subtract(faceCenter).calculateMagnitude();
    }
    const averageRadius = totalDist / faceVertices.length;
    const decalHalfSize = Math.max(0.2, averageRadius * sizeFraction);

    // Coordinate frame on the face plane: tangent basis U and V
    let basisU = faceVertices[0]?.subtract(faceCenter) ?? new Vector3D(1, 0, 0);
    // Project basisU onto plane perpendicular to unitNormal
    const normalProjection = unitNormal.scaleBy(basisU.calculateDotProduct(unitNormal));
    basisU = basisU.subtract(normalProjection);
    if (basisU.calculateMagnitude() < 0.0001) {
      const arbitrary = Math.abs(unitNormal.coordinateX) < 0.9 ? new Vector3D(1, 0, 0) : new Vector3D(0, 1, 0);
      basisU = arbitrary.calculateCrossProduct(unitNormal);
    }
    const unitBasisU = basisU.normalize();
    const unitBasisV = unitNormal.calculateCrossProduct(unitBasisU).normalize();

    // Offset center slightly along normal to sit cleanly like a sticker
    const stickerCenter = faceCenter.add(unitNormal.scaleBy(normalOffset));

    // Compute quad vertices
    const halfU = unitBasisU.scaleBy(decalHalfSize);
    const halfV = unitBasisV.scaleBy(decalHalfSize);

    // Quad vertices in counter-clockwise order relative to normal
    const v0 = stickerCenter.subtract(halfU).subtract(halfV);
    const v1 = stickerCenter.add(halfU).subtract(halfV);
    const v2 = stickerCenter.add(halfU).add(halfV);
    const v3 = stickerCenter.subtract(halfU).add(halfV);

    return new DecalPlane(
      id,
      parentFaceIndex,
      stickerCenter,
      unitNormal,
      decalHalfSize * 2,
      0,
      [v0, v1, v2, v3],
      null
    );
  }

  public withMaterialId(materialId: string | null): DecalPlane {
    return new DecalPlane(
      this.id,
      this.parentFaceIndex,
      this.center,
      this.normal,
      this.size,
      this.rotationAngle,
      this.vertices,
      materialId
    );
  }

  public translate(offset: Vector3D): DecalPlane {
    const newCenter = this.center.add(offset);
    const newVertices = [
      this.vertices[0].add(offset),
      this.vertices[1].add(offset),
      this.vertices[2].add(offset),
      this.vertices[3].add(offset),
    ] as const;

    return new DecalPlane(
      this.id,
      this.parentFaceIndex,
      newCenter,
      this.normal,
      this.size,
      this.rotationAngle,
      newVertices,
      this.materialId
    );
  }

  public rotate(angleRadians: number, rotationAxis?: Vector3D): DecalPlane {
    const axis = (rotationAxis ?? this.normal).normalize();
    const cosAngle = Math.cos(angleRadians);
    const sinAngle = Math.sin(angleRadians);

    const rotateVertex = (vertex: Vector3D): Vector3D => {
      const relative = vertex.subtract(this.center);
      // Rodrigues rotation formula: v*cos + (k x v)*sin + k*(k.v)*(1-cos)
      const term1 = relative.scaleBy(cosAngle);
      const term2 = axis.calculateCrossProduct(relative).scaleBy(sinAngle);
      const dot = axis.calculateDotProduct(relative);
      const term3 = axis.scaleBy(dot * (1 - cosAngle));
      const rotatedRelative = term1.add(term2).add(term3);
      return this.center.add(rotatedRelative);
    };

    const newVertices = [
      rotateVertex(this.vertices[0]),
      rotateVertex(this.vertices[1]),
      rotateVertex(this.vertices[2]),
      rotateVertex(this.vertices[3]),
    ] as const;

    return new DecalPlane(
      this.id,
      this.parentFaceIndex,
      this.center,
      this.normal,
      this.size,
      this.rotationAngle + angleRadians,
      newVertices,
      this.materialId
    );
  }

  public calculateCenter(): Vector3D {
    return this.center;
  }

  public calculateNormal(): Vector3D {
    return this.normal;
  }

  public isChildOfFace(faceIndex: number): boolean {
    return this.parentFaceIndex === faceIndex;
  }
}
