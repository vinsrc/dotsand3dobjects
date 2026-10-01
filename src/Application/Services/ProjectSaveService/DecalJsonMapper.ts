import { DecalPlane } from "../DecalService/DecalPlane";
import { SerializedDecal } from "./ProjectSaveDocument";
import { VectorJsonMapper } from "./VectorJsonMapper";

export class DecalJsonMapper {
  public constructor(private readonly vectorJsonMapper: VectorJsonMapper) {}

  public toJson(decal: DecalPlane): SerializedDecal {
    return {
      id: decal.id,
      parentFaceIndex: decal.parentFaceIndex,
      center: this.vectorJsonMapper.toJson(decal.center),
      normal: this.vectorJsonMapper.toJson(decal.normal),
      size: decal.size,
      rotationAngle: decal.rotationAngle,
      vertices: [
        this.vectorJsonMapper.toJson(decal.vertices[0]),
        this.vectorJsonMapper.toJson(decal.vertices[1]),
        this.vectorJsonMapper.toJson(decal.vertices[2]),
        this.vectorJsonMapper.toJson(decal.vertices[3]),
      ],
      materialId: decal.materialId,
    };
  }

  public fromJson(serialized: SerializedDecal): DecalPlane {
    return new DecalPlane(
      serialized.id,
      serialized.parentFaceIndex,
      this.vectorJsonMapper.fromJson(serialized.center),
      this.vectorJsonMapper.fromJson(serialized.normal),
      serialized.size,
      serialized.rotationAngle,
      [
        this.vectorJsonMapper.fromJson(serialized.vertices[0]),
        this.vectorJsonMapper.fromJson(serialized.vertices[1]),
        this.vectorJsonMapper.fromJson(serialized.vertices[2]),
        this.vectorJsonMapper.fromJson(serialized.vertices[3]),
      ],
      serialized.materialId
    );
  }
}
