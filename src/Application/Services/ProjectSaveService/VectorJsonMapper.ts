import { Vector3D } from "../../Common/Vector3D";
import { SerializedVector3D } from "./ProjectSaveDocument";

export class VectorJsonMapper {
  public toJson(vector: Vector3D): SerializedVector3D {
    return {
      x: vector.coordinateX,
      y: vector.coordinateY,
      z: vector.coordinateZ,
    };
  }

  public fromJson(serialized: SerializedVector3D): Vector3D {
    return new Vector3D(serialized.x, serialized.y, serialized.z);
  }
}
