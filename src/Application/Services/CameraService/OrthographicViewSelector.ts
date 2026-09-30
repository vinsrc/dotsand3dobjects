import { Vector3D } from "../../Common/Vector3D";
import { OrthographicAxis } from "./OrthographicViewStrategy";

interface AxisCandidate {
  readonly axis: OrthographicAxis;
  readonly direction: Vector3D;
}

export class OrthographicViewSelector {
  private readonly axisCandidates: readonly AxisCandidate[];

  public constructor() {
    this.axisCandidates = [
      { axis: "+X", direction: new Vector3D(1, 0, 0) },
      { axis: "-X", direction: new Vector3D(-1, 0, 0) },
      { axis: "+Y", direction: new Vector3D(0, 1, 0) },
      { axis: "-Y", direction: new Vector3D(0, -1, 0) },
      { axis: "+Z", direction: new Vector3D(0, 0, 1) },
      { axis: "-Z", direction: new Vector3D(0, 0, -1) },
    ];
  }

  public findClosestAxis(viewDirection: Vector3D): OrthographicAxis {
    let closestAxis: OrthographicAxis = "+Z";
    let maximumDotProduct = -Infinity;

    for (const candidate of this.axisCandidates) {
      const dotProduct =
        viewDirection.coordinateX * candidate.direction.coordinateX +
        viewDirection.coordinateY * candidate.direction.coordinateY +
        viewDirection.coordinateZ * candidate.direction.coordinateZ;

      if (dotProduct > maximumDotProduct) {
        maximumDotProduct = dotProduct;
        closestAxis = candidate.axis;
      }
    }

    return closestAxis;
  }

  public findClosestUpDirection(
    axisIdentifier: OrthographicAxis,
    currentUpDirection: Vector3D
  ): Vector3D {
    let candidateList: readonly Vector3D[];
    let defaultUp: Vector3D;

    switch (axisIdentifier) {
      case "+Y":
        defaultUp = new Vector3D(0, 0, -1);
        candidateList = [
          new Vector3D(0, 0, -1),
          new Vector3D(0, 0, 1),
          new Vector3D(-1, 0, 0),
          new Vector3D(1, 0, 0),
        ];
        break;
      case "-Y":
        defaultUp = new Vector3D(0, 0, 1);
        candidateList = [
          new Vector3D(0, 0, 1),
          new Vector3D(0, 0, -1),
          new Vector3D(-1, 0, 0),
          new Vector3D(1, 0, 0),
        ];
        break;
      case "+X":
      case "-X":
        defaultUp = new Vector3D(0, 1, 0);
        candidateList = [
          new Vector3D(0, 1, 0),
          new Vector3D(0, -1, 0),
          new Vector3D(0, 0, 1),
          new Vector3D(0, 0, -1),
        ];
        break;
      case "+Z":
      case "-Z":
      default:
        defaultUp = new Vector3D(0, 1, 0);
        candidateList = [
          new Vector3D(0, 1, 0),
          new Vector3D(0, -1, 0),
          new Vector3D(1, 0, 0),
          new Vector3D(-1, 0, 0),
        ];
        break;
    }

    let maximumDotProduct = -Infinity;
    let closestCandidate = defaultUp;

    for (const candidate of candidateList) {
      const dotProduct = currentUpDirection.calculateDotProduct(candidate);
      if (dotProduct > maximumDotProduct) {
        maximumDotProduct = dotProduct;
        closestCandidate = candidate;
      }
    }

    return maximumDotProduct > 0.05 ? closestCandidate : defaultUp;
  }

  public findClosestFaceUpDirection(
    faceNormal: Vector3D,
    currentUpDirection: Vector3D
  ): Vector3D {
    const normalizedNormal = faceNormal.normalize();
    const absoluteX = Math.abs(normalizedNormal.coordinateX);
    const absoluteY = Math.abs(normalizedNormal.coordinateY);
    const absoluteZ = Math.abs(normalizedNormal.coordinateZ);

    if (absoluteY > 0.9) {
      const axisId: OrthographicAxis =
        normalizedNormal.coordinateY > 0 ? "+Y" : "-Y";
      return this.findClosestUpDirection(axisId, currentUpDirection);
    }

    if (absoluteX > 0.9) {
      const axisId: OrthographicAxis =
        normalizedNormal.coordinateX > 0 ? "+X" : "-X";
      return this.findClosestUpDirection(axisId, currentUpDirection);
    }

    if (absoluteZ > 0.9) {
      const axisId: OrthographicAxis =
        normalizedNormal.coordinateZ > 0 ? "+Z" : "-Z";
      return this.findClosestUpDirection(axisId, currentUpDirection);
    }

    const dot = currentUpDirection.calculateDotProduct(normalizedNormal);
    const projectedVector = currentUpDirection.subtract(
      normalizedNormal.scaleBy(dot)
    );

    if (projectedVector.calculateMagnitude() > 0.05) {
      return projectedVector.normalize();
    }

    const referenceUp =
      absoluteY > 0.9 ? new Vector3D(0, 0, -1) : new Vector3D(0, 1, 0);
    const rightVector = referenceUp
      .calculateCrossProduct(normalizedNormal)
      .normalize();
    return normalizedNormal.calculateCrossProduct(rightVector).normalize();
  }
}

