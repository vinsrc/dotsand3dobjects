import { describe, it, expect } from "vitest";
import { ObjExporter } from "../../../../src/Application/Services/ModelService/ObjExporter";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { Material3D } from "../../../../src/Application/Services/MaterialService/Material3D";
import { DecalPlane } from "../../../../src/Application/Services/DecalService/DecalPlane";

describe("ObjExporter", () => {
  it("should export MeshGeometry to standard Wavefront OBJ format text", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ];
    const faces = [new Face3D([0, 1, 2])];
    const mesh = new MeshGeometry(vertices, faces);

    const exporter = new ObjExporter();
    const exportedText = exporter.export(mesh);

    expect(exportedText).toContain("v 0.000000 0.000000 0.000000");
    expect(exportedText).toContain("v 1.000000 0.000000 0.000000");
    expect(exportedText).toContain("v 0.000000 1.000000 0.000000");
    expect(exportedText).toContain("f 1 2 3");
  });

  it("should export standalone edges not in faces as line elements", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(2, 0, 0),
    ];
    const explicitEdges: [number, number][] = [[0, 1], [1, 2]];
    const mesh = new MeshGeometry(vertices, [], explicitEdges);

    const exporter = new ObjExporter();
    const exportedText = exporter.export(mesh);

    expect(exportedText).toContain("l 1 2");
    expect(exportedText).toContain("l 2 3");
  });

  it("should export OBJ with mtllib and usemtl when materials are assigned to faces", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
      new Vector3D(1, 1, 0),
    ];
    const faces = [
      new Face3D([0, 1, 2], "mat_1"),
      new Face3D([1, 3, 2], null),
    ];
    const mesh = new MeshGeometry(vertices, faces);

    const materials = [
      new Material3D({
        id: "mat_1",
        name: "Red Plastic",
        baseColor: "#ff0000",
        roughness: 0.2,
        metalness: 0.1,
      }),
    ];

    const exporter = new ObjExporter();
    const exportedObj = exporter.export(mesh, materials);

    expect(exportedObj).toContain("mtllib model.mtl");
    expect(exportedObj).toContain("usemtl Red_Plastic");
    expect(exportedObj).toContain("usemtl default");
  });

  it("should export MTL file with PBR extensions and image map", () => {
    const materials = [
      new Material3D({
        id: "mat_color",
        name: "Shiny Gold",
        baseColor: "#ffd700",
        roughness: 0.15,
        metalness: 0.95,
      }),
      new Material3D({
        id: "mat_image",
        name: "Wood Decal",
        imageUrl: "wood.png",
      }),
      new Material3D({
        id: "mat_invalid_hex",
        name: "Fallback",
        baseColor: "invalid",
      }),
    ];

    const exporter = new ObjExporter();
    const exportedMtl = exporter.exportMtl(materials);

    expect(exportedMtl).toContain("newmtl Shiny_Gold");
    expect(exportedMtl).toContain("Pr 0.150000");
    expect(exportedMtl).toContain("Pm 0.950000");

    expect(exportedMtl).toContain("newmtl Wood_Decal");
    expect(exportedMtl).toContain("map_Kd wood.png");

    expect(exportedMtl).toContain("newmtl Fallback");
  });

  it("should preserve extraProperties verbatim when exporting MTL", () => {
    const materials = [
      new Material3D({
        id: "mat_extra",
        name: "BlenderMaterial",
        baseColor: "#808080",
        roughness: 0.3,
        metalness: 0.1,
        extraProperties: [
          "map_Bump textures/normal.png",
          "norm textures/normal2.png",
          "bump textures/bump.png",
          "Ka 0.1 0.1 0.1",
          "Ks 0.5 0.5 0.5",
          "Ns 200",
          "illum 2",
        ],
      }),
    ];

    const exporter = new ObjExporter();
    const exportedMtl = exporter.exportMtl(materials);

    expect(exportedMtl).toContain("newmtl BlenderMaterial");
    expect(exportedMtl).toContain("map_Bump textures/normal.png");
    expect(exportedMtl).toContain("norm textures/normal2.png");
    expect(exportedMtl).toContain("bump textures/bump.png");
    expect(exportedMtl).toContain("Ka 0.1 0.1 0.1");
    expect(exportedMtl).toContain("Ks 0.5 0.5 0.5");
    expect(exportedMtl).toContain("Ns 200");
    expect(exportedMtl).toContain("illum 2");
  });

  it("should reference imageFileName in map_Kd without base64 data when material has base64 imageUrl", () => {
    const base64Png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const materials = [
      new Material3D({
        id: "mat_custom_image",
        name: "StickerMaterial",
        imageUrl: base64Png,
        imageFileName: "my_decal.png",
      }),
    ];

    const exporter = new ObjExporter();
    const exportedMtl = exporter.exportMtl(materials, "model");

    expect(exportedMtl).toContain("newmtl StickerMaterial");
    expect(exportedMtl).toContain("map_Kd my_decal.png");
    expect(exportedMtl).not.toContain("data:image");
    expect(exportedMtl).not.toContain("base64");
  });

  it("should fallback to model.<ext> derived from MIME type when imageFileName is not set", () => {
    const base64Jpg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/";
    const materials = [
      new Material3D({
        id: "mat_jpg",
        name: "PhotoMat",
        imageUrl: base64Jpg,
      }),
    ];

    const exporter = new ObjExporter();
    const exportedMtl = exporter.exportMtl(materials, "model");

    expect(exportedMtl).toContain("map_Kd model.jpg");
    expect(exportedMtl).not.toContain("data:image");
    expect(exportedMtl).not.toContain("base64");
  });

  it("should export images with matching filenames and dataUrls via exportImages", () => {
    const base64Png = "data:image/png;base64,abc123png";
    const materials = [
      new Material3D({
        id: "mat_img_1",
        name: "Decal1",
        imageUrl: base64Png,
        imageFileName: "custom_texture.png",
      }),
      new Material3D({
        id: "mat_no_img",
        name: "PlainColor",
        baseColor: "#ff0000",
      }),
    ];

    const exporter = new ObjExporter();
    const exportedImages = exporter.exportImages(materials, "model");

    expect(exportedImages).toHaveLength(1);
    expect(exportedImages[0].fileName).toBe("custom_texture.png");
    expect(exportedImages[0].dataUrl).toBe(base64Png);
  });

  it("should export decal plane vertices, texture coords, groups, and material in OBJ", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(1, 1, 0),
      new Vector3D(0, 1, 0),
    ];
    const faces = [new Face3D([0, 1, 2, 3], "mat_face")];
    const mesh = new MeshGeometry(vertices, faces);

    const stickerMaterial = new Material3D({
      id: "mat_sticker",
      name: "Sticker Tex",
      imageUrl: "data:image/png;base64,ABC",
      imageFileName: "sticker.png",
    });
    const faceMaterial = new Material3D({
      id: "mat_face",
      name: "FaceMat",
      baseColor: "#cccccc",
    });

    const decal = new DecalPlane(
      "decal_1",
      0,
      new Vector3D(0.5, 0.5, 0.01),
      new Vector3D(0, 0, 1),
      0.4,
      0,
      [
        new Vector3D(0.3, 0.3, 0.01),
        new Vector3D(0.7, 0.3, 0.01),
        new Vector3D(0.7, 0.7, 0.01),
        new Vector3D(0.3, 0.7, 0.01),
      ],
      "mat_sticker"
    );

    const exporter = new ObjExporter();
    const exportedObj = exporter.export(
      mesh,
      [faceMaterial, stickerMaterial],
      [decal],
      "model"
    );

    // Should include mtllib
    expect(exportedObj).toContain("mtllib model.mtl");

    // Should include original mesh vertices (4) + decal vertices (4) = 8 total
    const vertexLines = exportedObj.split("\n").filter((l: string) => l.startsWith("v "));
    expect(vertexLines).toHaveLength(8);

    // Should include decal quad vertices
    expect(exportedObj).toContain("v 0.300000 0.300000 0.010000");
    expect(exportedObj).toContain("v 0.700000 0.700000 0.010000");

    // Should include texture coordinates
    expect(exportedObj).toContain("vt 0.000000 0.000000");
    expect(exportedObj).toContain("vt 1.000000 1.000000");

    // Should include group for the decal
    expect(exportedObj).toContain("g decal_1");

    // Should include usemtl for decal material
    expect(exportedObj).toContain("usemtl Sticker_Tex");

    // Should include face with vertex/texcoord indices for decal
    expect(exportedObj).toContain("f 5/1 6/2 7/3 8/4");
  });

  it("should export decal planes without materials gracefully", () => {
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ];
    const faces = [new Face3D([0, 1, 2])];
    const mesh = new MeshGeometry(vertices, faces);

    const decal = new DecalPlane(
      "decal_2",
      0,
      new Vector3D(0.3, 0.3, 0.005),
      new Vector3D(0, 0, 1),
      0.2,
      0,
      [
        new Vector3D(0.2, 0.2, 0.005),
        new Vector3D(0.4, 0.2, 0.005),
        new Vector3D(0.4, 0.4, 0.005),
        new Vector3D(0.2, 0.4, 0.005),
      ],
      null
    );

    const exporter = new ObjExporter();
    const exportedObj = exporter.export(mesh, [], [decal], "model");

    // No materials assigned, no mtllib
    expect(exportedObj).not.toContain("mtllib");

    // Should still export decal vertices
    const vertexLines = exportedObj.split("\n").filter((l: string) => l.startsWith("v "));
    expect(vertexLines).toHaveLength(7); // 3 mesh + 4 decal

    // Should include group for the decal
    expect(exportedObj).toContain("g decal_2");

    // Should include face for the decal quad (offset by mesh vertex count)
    expect(exportedObj).toContain("f 4/1 5/2 6/3 7/4");
  });
});
