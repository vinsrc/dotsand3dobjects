import { zipSync } from "fflate";
import { ZipFileEntry } from "./ZipFileEntry";

export class ZipExportService {
  public buildZip(files: readonly ZipFileEntry[]): Uint8Array {
    const archiveContents: Record<string, Uint8Array> = {};
    for (const file of files) {
      archiveContents[file.fileName] = file.content;
    }
    return zipSync(archiveContents, { level: 6 });
  }
}