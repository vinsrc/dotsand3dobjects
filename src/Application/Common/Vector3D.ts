export class Vector3D {
  public readonly coordinateX: number;
  public readonly coordinateY: number;
  public readonly coordinateZ: number;

  public constructor(
    coordinateX: number,
    coordinateY: number,
    coordinateZ: number
  ) {
    this.coordinateX = coordinateX;
    this.coordinateY = coordinateY;
    this.coordinateZ = coordinateZ;
  }

  public add(otherVector: Vector3D): Vector3D {
    return new Vector3D(
      this.coordinateX + otherVector.coordinateX,
      this.coordinateY + otherVector.coordinateY,
      this.coordinateZ + otherVector.coordinateZ
    );
  }

  public subtract(otherVector: Vector3D): Vector3D {
    return new Vector3D(
      this.coordinateX - otherVector.coordinateX,
      this.coordinateY - otherVector.coordinateY,
      this.coordinateZ - otherVector.coordinateZ
    );
  }

  public scaleBy(scalarValue: number): Vector3D {
    return new Vector3D(
      this.coordinateX * scalarValue,
      this.coordinateY * scalarValue,
      this.coordinateZ * scalarValue
    );
  }

  public calculateMagnitude(): number {
    const sumOfSquares =
      this.coordinateX * this.coordinateX +
      this.coordinateY * this.coordinateY +
      this.coordinateZ * this.coordinateZ;
    return Math.sqrt(sumOfSquares);
  }

  public normalize(): Vector3D {
    const magnitude = this.calculateMagnitude();
    const minimumThreshold = 0.000001;
    if (magnitude < minimumThreshold) {
      return new Vector3D(0, 0, 0);
    }
    return new Vector3D(
      this.coordinateX / magnitude,
      this.coordinateY / magnitude,
      this.coordinateZ / magnitude
    );
  }

  public calculateDotProduct(otherVector: Vector3D): number {
    return (
      this.coordinateX * otherVector.coordinateX +
      this.coordinateY * otherVector.coordinateY +
      this.coordinateZ * otherVector.coordinateZ
    );
  }

  public calculateCrossProduct(otherVector: Vector3D): Vector3D {
    const crossX =
      this.coordinateY * otherVector.coordinateZ -
      this.coordinateZ * otherVector.coordinateY;
    const crossY =
      this.coordinateZ * otherVector.coordinateX -
      this.coordinateX * otherVector.coordinateZ;
    const crossZ =
      this.coordinateX * otherVector.coordinateY -
      this.coordinateY * otherVector.coordinateX;
    return new Vector3D(crossX, crossY, crossZ);
  }

  public calculateDistanceTo(otherVector: Vector3D): number {
    return this.subtract(otherVector).calculateMagnitude();
  }

  public equals(otherVector: Vector3D, tolerance: number = 0.00001): boolean {
    const differenceX = Math.abs(this.coordinateX - otherVector.coordinateX);
    const differenceY = Math.abs(this.coordinateY - otherVector.coordinateY);
    const differenceZ = Math.abs(this.coordinateZ - otherVector.coordinateZ);
    return (
      differenceX <= tolerance &&
      differenceY <= tolerance &&
      differenceZ <= tolerance
    );
  }

  public toArray(): [number, number, number] {
    return [this.coordinateX, this.coordinateY, this.coordinateZ];
  }
}
