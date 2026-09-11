import { describe, it, expect } from "vitest";
import { ObjExporter } from "../../../../src/Application/Services/ModelService/ObjExporter";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { Material3D } from "../../../../src/Application/Services/MaterialService/Material3D";

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
});
