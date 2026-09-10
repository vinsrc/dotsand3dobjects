import { describe, it, expect } from "vitest";
import { ObjExporter } from "../../../../src/Application/Services/ModelService/ObjExporter";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";

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
});
