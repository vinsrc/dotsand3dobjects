import { ProjectSaveListItem, ProjectSaveRecord } from "./ProjectSaveDocument";

export interface ProjectSaveStorage {
  list(): readonly ProjectSaveListItem[];
  getById(saveId: string): ProjectSaveRecord | null;
  findByName(saveName: string): ProjectSaveRecord | null;
  put(record: ProjectSaveRecord): void;
}
