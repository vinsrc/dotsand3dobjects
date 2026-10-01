export const PROJECT_SAVE_FORMAT_VERSION = 1;

export interface SerializedVector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface SerializedFace {
  readonly vertexIndices: readonly number[];
  readonly materialId: string | null;
}

export interface SerializedMesh {
  readonly vertices: readonly SerializedVector3D[];
  readonly faces: readonly SerializedFace[];
  readonly explicitEdges: readonly [number, number][];
}

export interface SerializedMaterial {
  readonly id: string;
  readonly name: string;
  readonly baseColor: string;
  readonly roughness: number;
  readonly metalness: number;
  readonly imageUrl: string | null;
  readonly imageFileName: string | null;
  readonly extraProperties: readonly string[];
}

export interface SerializedDecal {
  readonly id: string;
  readonly parentFaceIndex: number;
  readonly center: SerializedVector3D;
  readonly normal: SerializedVector3D;
  readonly size: number;
  readonly rotationAngle: number;
  readonly vertices: readonly [
    SerializedVector3D,
    SerializedVector3D,
    SerializedVector3D,
    SerializedVector3D,
  ];
  readonly materialId: string | null;
}

export interface ProjectSaveDocument {
  readonly version: number;
  readonly name: string;
  readonly savedAt: string;
  readonly mesh: SerializedMesh;
  readonly materials: readonly SerializedMaterial[];
  readonly selectedMaterialId: string | null;
  readonly decals: readonly SerializedDecal[];
}

export interface ProjectSaveListItem {
  readonly id: string;
  readonly name: string;
  readonly savedAt: string;
}

export interface ProjectSaveRecord {
  readonly id: string;
  readonly name: string;
  readonly savedAt: string;
  readonly document: ProjectSaveDocument;
}
