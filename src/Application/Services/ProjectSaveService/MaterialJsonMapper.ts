import { Material3D } from "../MaterialService/Material3D";
import { SerializedMaterial } from "./ProjectSaveDocument";

export class MaterialJsonMapper {
  public toJson(material: Material3D): SerializedMaterial {
    return {
      id: material.id,
      name: material.name,
      baseColor: material.baseColor,
      roughness: material.roughness,
      metalness: material.metalness,
      imageUrl: material.imageUrl,
      imageFileName: material.imageFileName,
      extraProperties: [...material.extraProperties],
    };
  }

  public fromJson(serialized: SerializedMaterial): Material3D {
    return new Material3D({
      id: serialized.id,
      name: serialized.name,
      baseColor: serialized.baseColor,
      roughness: serialized.roughness,
      metalness: serialized.metalness,
      imageUrl: serialized.imageUrl,
      imageFileName: serialized.imageFileName,
      extraProperties: serialized.extraProperties,
    });
  }
}
