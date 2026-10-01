import {
  ProjectSaveListItem,
  ProjectSaveRecord,
} from "./ProjectSaveDocument";
import { ProjectSaveStorage } from "./ProjectSaveStorage";
import {
  ProjectSaveSerializer,
  ProjectStateToSave,
  RestoredProjectState,
} from "./ProjectSaveSerializer";

export interface ImportedProjectSave {
  readonly name: string;
  readonly state: RestoredProjectState;
}

export class ProjectSaveService {
  private readonly storage: ProjectSaveStorage;
  private readonly serializer: ProjectSaveSerializer;
  private readonly idFactory: () => string;
  private readonly clock: () => string;
  private activeSaveId: string | null = null;
  private activeSaveName: string | null = null;

  public constructor(
    storage: ProjectSaveStorage,
    serializer?: ProjectSaveSerializer,
    idFactory?: () => string,
    clock?: () => string
  ) {
    this.storage = storage;
    this.serializer = serializer ?? new ProjectSaveSerializer();
    this.idFactory =
      idFactory ??
      (() => `save_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
    this.clock = clock ?? (() => new Date().toISOString());
  }

  public needsSaveName(): boolean {
    return this.activeSaveName === null || this.activeSaveName.trim().length === 0;
  }

  public getActiveSaveName(): string | null {
    return this.activeSaveName;
  }

  public listSaves(): readonly ProjectSaveListItem[] {
    return this.storage.list();
  }

  public save(
    projectState: ProjectStateToSave,
    saveName?: string
  ): ProjectSaveRecord {
    const resolvedName = (saveName ?? this.activeSaveName ?? "").trim();
    if (resolvedName.length === 0) {
      throw new Error("A save name is required");
    }

    const savedAt = this.clock();
    const document = this.serializer.createDocument(
      resolvedName,
      savedAt,
      projectState
    );
    const existingId = this.resolveExistingSaveId(resolvedName);
    const record: ProjectSaveRecord = {
      id: existingId ?? this.idFactory(),
      name: resolvedName,
      savedAt,
      document,
    };
    this.storage.put(record);
    this.activeSaveId = record.id;
    this.activeSaveName = resolvedName;
    return record;
  }

  public loadById(saveId: string): RestoredProjectState {
    const record = this.storage.getById(saveId);
    if (!record) {
      throw new Error("Saved project was not found");
    }
    const restoredState = this.serializer.restoreState(record.document);
    this.activeSaveId = record.id;
    this.activeSaveName = record.name;
    return restoredState;
  }

  public exportJson(projectState: ProjectStateToSave, saveName?: string): string {
    const resolvedName = (saveName ?? this.activeSaveName ?? "untitled").trim();
    const document = this.serializer.createDocument(
      resolvedName.length > 0 ? resolvedName : "untitled",
      this.clock(),
      projectState
    );
    return this.serializer.toJson(document);
  }

  public importJson(jsonText: string): ImportedProjectSave {
    const document = this.serializer.parseDocument(jsonText);
    const restoredState = this.serializer.restoreState(document);
    this.adoptImportedSave(document.name);
    return {
      name: document.name,
      state: restoredState,
    };
  }

  public clearActiveSave(): void {
    this.activeSaveId = null;
    this.activeSaveName = null;
  }

  private resolveExistingSaveId(saveName: string): string | null {
    if (this.activeSaveId) {
      const activeRecord = this.storage.getById(this.activeSaveId);
      if (activeRecord) {
        return activeRecord.id;
      }
    }
    return this.storage.findByName(saveName)?.id ?? null;
  }

  private adoptImportedSave(saveName: string): void {
    const trimmedName = saveName.trim();
    this.activeSaveName = trimmedName.length > 0 ? trimmedName : null;
    this.activeSaveId = this.activeSaveName
      ? this.storage.findByName(this.activeSaveName)?.id ?? null
      : null;
  }
}
