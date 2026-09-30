import { describe, it, expect } from "vitest";
import { unzipSync } from "fflate";
import { ZipExportService } from "../../../../src/Application/Services/ZipExportService/ZipExportService";

describe("ZipExportService", () => {
  it("should build a zip archive containing all provided files with identical content", () => {
    const service = new ZipExportService();
    const contentBytes = (text: string): Uint8Array =>
      new TextEncoder().encode(text);

    const archive = service.buildZip([
      { fileName: "model.obj", content: contentBytes("# Wavefront\nv 0 0 0\n") },
      { fileName: "model.mtl", content: contentBytes("newmtl Mat\n") },
      {
        fileName: "decal.png",
        content: new Uint8Array([1, 2, 3, 4, 5]),
      },
    ]);

    expect(archive[0]).toBe(0x50); // 'P'
    expect(archive[1]).toBe(0x4b); // 'K'

    const unzipped = unzipSync(archive);
    expect(Object.keys(unzipped).sort()).toEqual(
      ["decal.png", "model.mtl", "model.obj"]
    );
    expect(new TextDecoder().decode(unzipped["model.obj"])).toBe(
      "# Wavefront\nv 0 0 0\n"
    );
    expect(new TextDecoder().decode(unzipped["model.mtl"])).toBe("newmtl Mat\n");
    expect(Array.from(unzipped["decal.png"])).toEqual([1, 2, 3, 4, 5]);
  });

  it("should build a valid empty zip archive when no files are provided", () => {
    const service = new ZipExportService();

    const archive = service.buildZip([]);

    expect(archive[0]).toBe(0x50);
    expect(archive[1]).toBe(0x4b);
    expect(Object.keys(unzipSync(archive))).toHaveLength(0);
  });
});