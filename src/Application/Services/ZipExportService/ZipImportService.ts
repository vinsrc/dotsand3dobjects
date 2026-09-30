import { unzipSync } from "fflate";
import { DataUrlConverter } from "../../Common/DataUrlConverter";

export interface ExtractedZipPackage {
  readonly objFileName: string;
  readonly objContent: string;
  readonly mtlFileName: string | null;
  readonly mtlContent: string | null;
  readonly images: ReadonlyMap<string, { dataUrl: string; fileName: string }>;
}

export class ZipImportService {
  private readonly dataUrlConverter: DataUrlConverter;

  public constructor(dataUrlConverter?: DataUrlConverter) {
    this.dataUrlConverter = dataUrlConverter ?? new DataUrlConverter();
  }

  public extract(zipBytes: Uint8Array): ExtractedZipPackage {
    let unzippedEntries: Record<string, Uint8Array>;
    try {
      unzippedEntries = unzipSync(zipBytes);
    } catch (unzipError) {
      const message =
        unzipError instanceof Error
          ? unzipError.message
          : "Invalid ZIP archive";
      throw new Error(`Failed to extract ZIP archive: ${message}`);
    }

    const fileNames = Object.keys(unzippedEntries);
    if (fileNames.length === 0) {
      throw new Error("ZIP archive is empty");
    }

    let objEntryName: string | null = null;
    let mtlEntryName: string | null = null;
    const imageEntries = new Map<string, { dataUrl: string; fileName: string }>();

    for (const rawPath of fileNames) {
      const normalizedPath = rawPath.replace(/\\/g, "/");
      const lower = normalizedPath.toLowerCase();

      // Skip macOS metadata folders or hidden files
      if (lower.startsWith("__macosx/") || lower.includes("/.")) {
        continue;
      }

      if (lower.endsWith(".obj") && !objEntryName) {
        objEntryName = rawPath;
      } else if (lower.endsWith(".mtl") && !mtlEntryName) {
        mtlEntryName = rawPath;
      } else if (this.isImageFile(lower)) {
        const fileBytes = unzippedEntries[rawPath];
        if (fileBytes && fileBytes.byteLength > 0) {
          const mimeType = this.getMimeType(lower);
          const dataUrl = this.dataUrlConverter.toDataUrl(fileBytes, mimeType);
          const baseName = this.extractBaseName(normalizedPath);
          const entry = { dataUrl, fileName: baseName };

          // Index by exact path, normalized path, and base filename
          imageEntries.set(rawPath, entry);
          imageEntries.set(normalizedPath, entry);
          imageEntries.set(baseName, entry);
          imageEntries.set(baseName.toLowerCase(), entry);
        }
      }
    }

    if (!objEntryName) {
      throw new Error("No .obj file found in ZIP archive");
    }

    const objBytes = unzippedEntries[objEntryName] as Uint8Array;
    const textDecoder = new TextDecoder("utf-8");
    const objContent = textDecoder.decode(objBytes);
    const objBaseName = this.extractBaseName(objEntryName);

    let mtlContent: string | null = null;
    let mtlBaseName: string | null = null;
    if (mtlEntryName) {
      const mtlBytes = unzippedEntries[mtlEntryName];
      if (mtlBytes) {
        mtlContent = textDecoder.decode(mtlBytes);
        mtlBaseName = this.extractBaseName(mtlEntryName);
      }
    }

    return {
      objFileName: objBaseName,
      objContent,
      mtlFileName: mtlBaseName,
      mtlContent,
      images: imageEntries,
    };
  }

  private isImageFile(lowerPath: string): boolean {
    return (
      lowerPath.endsWith(".png") ||
      lowerPath.endsWith(".jpg") ||
      lowerPath.endsWith(".jpeg") ||
      lowerPath.endsWith(".webp") ||
      lowerPath.endsWith(".svg") ||
      lowerPath.endsWith(".gif") ||
      lowerPath.endsWith(".bmp")
    );
  }

  private getMimeType(lowerPath: string): string {
    if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
      return "image/jpeg";
    }
    if (lowerPath.endsWith(".webp")) {
      return "image/webp";
    }
    if (lowerPath.endsWith(".svg")) {
      return "image/svg+xml";
    }
    if (lowerPath.endsWith(".gif")) {
      return "image/gif";
    }
    if (lowerPath.endsWith(".bmp")) {
      return "image/bmp";
    }
    return "image/png";
  }

  private extractBaseName(path: string): string {
    const lastSlash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    return lastSlash !== -1 ? path.substring(lastSlash + 1) : path;
  }
}
