import { describe, it, expect } from "vitest";
import { ModelFactory } from "../../../../src/Application/Services/ModelService/ModelFactory";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../../src/Application/Services/ModelService/Face3D";

describe("ModelFactory", () => {
  it("should create MeshGeometry from raw vertex and face data", () => {
    const factory = new ModelFactory();
    const vertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ];
    const faces = [new Face3D([0, 1, 2])];
    const mesh = factory.createFromRawData(vertices, faces);

    expect(mesh.getVertexCount()).toBe(3);
    expect(mesh.getFaceCount()).toBe(1);
  });

  it("should create starter cube with 8 vertices and 6 quad faces", () => {
    const factory = new ModelFactory();
    const cube = factory.createStarterCube(4);

    expect(cube.getVertexCount()).toBe(8);
    expect(cube.getFaceCount()).toBe(6);
    expect(cube.getWireframeEdges().length).toBe(12);

    const boundingBox = cube.calculateBoundingBox();
    expect(boundingBox.minimum.coordinateX).toBe(-2);
    expect(boundingBox.maximum.coordinateX).toBe(2);
  });
});
