import { ProjectSaveListItem, ProjectSaveRecord } from "./ProjectSaveDocument";
import { ProjectSaveStorage } from "./ProjectSaveStorage";

export class LocalStorageProjectSaveStorage implements ProjectSaveStorage {
  private readonly storageKey: string;

  public constructor(
    storageKey: string = "wireframevibe3d_project_saves"
  ) {
    this.storageKey = storageKey;
  }

  public list(): readonly ProjectSaveListItem[] {
    return this.readRecords()
      .map((record) => ({
        id: record.id,
        name: record.name,
        savedAt: record.savedAt,
      }))
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
  }

  public getById(saveId: string): ProjectSaveRecord | null {
    return this.readRecords().find((record) => record.id === saveId) ?? null;
  }

  public findByName(saveName: string): ProjectSaveRecord | null {
    const normalizedName = saveName.trim().toLowerCase();
    return (
      this.readRecords().find(
        (record) => record.name.trim().toLowerCase() === normalizedName
      ) ?? null
    );
  }

  public put(record: ProjectSaveRecord): void {
    try {
      if (typeof localStorage === "undefined") {
        throw new Error("Browser storage is not available");
      }
      const records = this.readRecords().filter(
        (existing) => existing.id !== record.id
      );
      records.push(record);
      localStorage.setItem(this.storageKey, JSON.stringify(records));
    } catch (caughtError) {
      if (
        caughtError instanceof Error &&
        caughtError.message === "Browser storage is not available"
      ) {
        throw caughtError;
      }
      throw new Error("Could not save the project to browser storage");
    }
  }

  private readRecords(): ProjectSaveRecord[] {
    try {
      if (typeof localStorage === "undefined") {
        return [];
      }
      const rawData = localStorage.getItem(this.storageKey);
      if (!rawData) {
        return [];
      }
      const parsed = JSON.parse(rawData);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(this.isRecord);
    } catch {
      return [];
    }
  }

  private isRecord(value: unknown): value is ProjectSaveRecord {
    if (!value || typeof value !== "object") {
      return false;
    }
    const candidate = value as Partial<ProjectSaveRecord>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.savedAt === "string" &&
      candidate.document !== undefined
    );
  }
}
