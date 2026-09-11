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
}
