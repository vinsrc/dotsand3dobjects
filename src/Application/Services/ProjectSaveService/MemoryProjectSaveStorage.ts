import { ProjectSaveListItem, ProjectSaveRecord } from "./ProjectSaveDocument";
import { ProjectSaveStorage } from "./ProjectSaveStorage";

export class MemoryProjectSaveStorage implements ProjectSaveStorage {
  private readonly recordsById: Map<string, ProjectSaveRecord> = new Map();

  public list(): readonly ProjectSaveListItem[] {
    return Array.from(this.recordsById.values())
      .map((record) => ({
        id: record.id,
        name: record.name,
        savedAt: record.savedAt,
      }))
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt));
  }

  public getById(saveId: string): ProjectSaveRecord | null {
    return this.recordsById.get(saveId) ?? null;
  }

  public findByName(saveName: string): ProjectSaveRecord | null {
    const normalizedName = saveName.trim().toLowerCase();
    for (const record of this.recordsById.values()) {
      if (record.name.trim().toLowerCase() === normalizedName) {
        return record;
      }
    }
    return null;
  }

  public put(record: ProjectSaveRecord): void {
    this.recordsById.set(record.id, record);
  }
}
