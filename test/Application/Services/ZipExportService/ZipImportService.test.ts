import { describe, it, expect } from "vitest";
import { zipSync } from "fflate";
import { ZipImportService } from "../../../../src/Application/Services/ZipExportService/ZipImportService";
import { DataUrlConverter } from "../../../../src/Application/Common/DataUrlConverter";

describe("ZipImportService", () => {
  const dataUrlConverter = new DataUrlConverter();
  const service = new ZipImportService(dataUrlConverter);

  const encodeText = (text: string): Uint8Array =>
    new TextEncoder().encode(text);

  it("should extract obj, mtl, and images from a zip package", () => {
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]);
    const zipBytes = zipSync({
      "model.obj": encodeText("v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n"),
      "model.mtl": encodeText("newmtl TestMat\nmap_Kd texture.png\n"),
      "texture.png": pngBytes,
    });

    const result = service.extract(zipBytes);

    expect(result.objFileName).toBe("model.obj");
    expect(result.objContent).toContain("v 0 0 0");
    expect(result.mtlFileName).toBe("model.mtl");
    expect(result.mtlContent).toContain("newmtl TestMat");
    expect(result.images.has("texture.png")).toBe(true);
    expect(result.images.get("texture.png")?.dataUrl).toContain("data:image/png;base64,");
  });

  it("should extract zip with only obj and no mtl or images", () => {
    const zipBytes = zipSync({
      "mesh.obj": encodeText("v 0 0 0\n"),
    });

    const result = service.extract(zipBytes);

    expect(result.objFileName).toBe("mesh.obj");
    expect(result.objContent).toBe("v 0 0 0\n");
    expect(result.mtlFileName).toBeNull();
    expect(result.mtlContent).toBeNull();
    expect(result.images.size).toBe(0);
  });

  it("should extract images across multiple formats and index by basename", () => {
    const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const webpBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
    const svgBytes = encodeText("<svg></svg>");

    const zipBytes = zipSync({
      "assets/mesh.obj": encodeText("v 0 0 0\n"),
      "assets/textures/diffuse.jpg": jpgBytes,
      "assets/textures/sticker.webp": webpBytes,
      "assets/icon.svg": svgBytes,
    });

    const result = service.extract(zipBytes);

    expect(result.objFileName).toBe("mesh.obj");
    expect(result.images.has("diffuse.jpg")).toBe(true);
    expect(result.images.get("diffuse.jpg")?.dataUrl).toContain("data:image/jpeg;base64,");
    expect(result.images.has("sticker.webp")).toBe(true);
    expect(result.images.get("sticker.webp")?.dataUrl).toContain("data:image/webp;base64,");
    expect(result.images.has("icon.svg")).toBe(true);
    expect(result.images.get("icon.svg")?.dataUrl).toContain("data:image/svg+xml;base64,");
  });

  it("should ignore __MACOSX metadata and dot files", () => {
    const zipBytes = zipSync({
      "__MACOSX/._model.obj": encodeText("junk"),
      ".DS_Store": encodeText("junk"),
      "model.obj": encodeText("v 1 1 1\n"),
    });

    const result = service.extract(zipBytes);

    expect(result.objFileName).toBe("model.obj");
    expect(result.objContent).toBe("v 1 1 1\n");
  });

  it("should throw error when archive is empty", () => {
    const emptyZip = zipSync({});

    expect(() => service.extract(emptyZip)).toThrow("empty");
  });

  it("should throw error when archive has no .obj file", () => {
    const zipWithoutObj = zipSync({
      "notes.txt": encodeText("hello"),
      "material.mtl": encodeText("newmtl Foo"),
    });

    expect(() => service.extract(zipWithoutObj)).toThrow("No .obj file found");
  });

  it("should throw error for corrupt/invalid zip data", () => {
    const corruptBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

    expect(() => service.extract(corruptBytes)).toThrow("Failed to extract ZIP archive");
  });
});
