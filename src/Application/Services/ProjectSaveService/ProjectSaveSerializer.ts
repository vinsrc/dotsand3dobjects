import { MeshGeometry } from "../ModelService/MeshGeometry";
import { Material3D } from "../MaterialService/Material3D";
import { DecalPlane } from "../DecalService/DecalPlane";
import {
  PROJECT_SAVE_FORMAT_VERSION,
  ProjectSaveDocument,
} from "./ProjectSaveDocument";
import { VectorJsonMapper } from "./VectorJsonMapper";
import { MeshJsonMapper } from "./MeshJsonMapper";
import { MaterialJsonMapper } from "./MaterialJsonMapper";
import { DecalJsonMapper } from "./DecalJsonMapper";

export interface ProjectStateToSave {
  readonly mesh: MeshGeometry;
  readonly materials: readonly Material3D[];
  readonly selectedMaterialId: string | null;
  readonly decals: readonly DecalPlane[];
}

export interface RestoredProjectState {
  readonly mesh: MeshGeometry;
  readonly materials: readonly Material3D[];
  readonly selectedMaterialId: string | null;
  readonly decals: readonly DecalPlane[];
}

export class ProjectSaveSerializer {
  private readonly meshJsonMapper: MeshJsonMapper;
  private readonly materialJsonMapper: MaterialJsonMapper;
  private readonly decalJsonMapper: DecalJsonMapper;

  public constructor(
    meshJsonMapper?: MeshJsonMapper,
    materialJsonMapper?: MaterialJsonMapper,
    decalJsonMapper?: DecalJsonMapper
  ) {
    const vectorJsonMapper = new VectorJsonMapper();
    this.meshJsonMapper = meshJsonMapper ?? new MeshJsonMapper(vectorJsonMapper);
    this.materialJsonMapper = materialJsonMapper ?? new MaterialJsonMapper();
    this.decalJsonMapper =
      decalJsonMapper ?? new DecalJsonMapper(vectorJsonMapper);
  }

  public createDocument(
    saveName: string,
    savedAt: string,
    projectState: ProjectStateToSave
  ): ProjectSaveDocument {
    return {
      version: PROJECT_SAVE_FORMAT_VERSION,
      name: saveName,
      savedAt,
      mesh: this.meshJsonMapper.toJson(projectState.mesh),
      materials: projectState.materials.map((material) =>
        this.materialJsonMapper.toJson(material)
      ),
      selectedMaterialId: projectState.selectedMaterialId,
      decals: projectState.decals.map((decal) =>
        this.decalJsonMapper.toJson(decal)
      ),
    };
  }

  public restoreState(document: ProjectSaveDocument): RestoredProjectState {
    this.assertSupportedVersion(document.version);
    return {
      mesh: this.meshJsonMapper.fromJson(document.mesh),
      materials: document.materials.map((material) =>
        this.materialJsonMapper.fromJson(material)
      ),
      selectedMaterialId: document.selectedMaterialId,
      decals: document.decals.map((decal) =>
        this.decalJsonMapper.fromJson(decal)
      ),
    };
  }

  public parseDocument(jsonText: string): ProjectSaveDocument {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("The save file is not valid JSON");
    }
    if (!this.isDocument(parsed)) {
      throw new Error("The save file is missing required project data");
    }
    this.assertSupportedVersion(parsed.version);
    return parsed;
  }

  public toJson(document: ProjectSaveDocument): string {
    return JSON.stringify(document, null, 2);
  }

  private assertSupportedVersion(version: number): void {
    if (version !== PROJECT_SAVE_FORMAT_VERSION) {
      throw new Error("Unsupported save file version");
    }
  }

  private isDocument(value: unknown): value is ProjectSaveDocument {
    if (!value || typeof value !== "object") {
      return false;
    }
    const candidate = value as Partial<ProjectSaveDocument>;
    return (
      typeof candidate.version === "number" &&
      typeof candidate.name === "string" &&
      typeof candidate.savedAt === "string" &&
      candidate.mesh !== undefined &&
      Array.isArray(candidate.materials) &&
      Array.isArray(candidate.decals)
    );
  }
}
