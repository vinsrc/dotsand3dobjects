import { describe, it, expect } from "vitest";
import { ObjParser } from "../../../../src/Application/Services/ModelService/ObjParser";
import { ModelFactory } from "../../../../src/Application/Services/ModelService/ModelFactory";

describe("ObjParser", () => {
  const modelFactory = new ModelFactory();
  const objParser = new ObjParser(modelFactory);

  it("should validate file extension and throw Unsupported error for non-obj files", () => {
    expect(() => objParser.validateFileName("model.stl")).toThrow(
      "Unsupported error"
    );
    expect(() => objParser.validateFileName("model.txt")).toThrow(
      "Unsupported error"
    );
    expect(() => objParser.validateFileName("model.gltf")).toThrow(
      "Unsupported error"
    );
    expect(() => objParser.validateFileName("model.fbx")).toThrow(
      "Unsupported error"
    );
    expect(() => objParser.validateFileName("model.OBJ")).not.toThrow();
    expect(() => objParser.validateFileName("model.obj")).not.toThrow();
  });

  it("should parse standard OBJ vertices and faces", () => {
    const objData = `
      # Test Box
      v 0.0 0.0 0.0
      v 1.0 0.0 0.0
      v 1.0 1.0 0.0
      v 0.0 1.0 0.0
      f 1 2 3
      f 1 3 4
    `;

    const mesh = objParser.parse(objData, "test.obj");
    expect(mesh.getVertexCount()).toBe(4);
    expect(mesh.getFaceCount()).toBe(2);
    expect(mesh.vertices[0]?.coordinateX).toBe(0);
    expect(mesh.vertices[1]?.coordinateX).toBe(1);
    expect(mesh.faces[0]?.vertexIndices).toEqual([0, 1, 2]);
    expect(mesh.faces[1]?.vertexIndices).toEqual([0, 2, 3]);
  });

  it("should handle vertex texture and normal index formatting in faces (e.g. 1/1/1 or 1//1)", () => {
    const objData = `
      v 0.0 0.0 0.0
      v 1.0 0.0 0.0
      v 1.0 1.0 0.0
      f 1/1/1 2/2/2 3/3/3
    `;

    const mesh = objParser.parse(objData);
    expect(mesh.getVertexCount()).toBe(3);
    expect(mesh.getFaceCount()).toBe(1);
    expect(mesh.faces[0]?.vertexIndices).toEqual([0, 1, 2]);
  });

  it("should handle negative relative indices in faces", () => {
    const objData = `
      v 0.0 0.0 0.0
      v 1.0 0.0 0.0
      v 1.0 1.0 0.0
      f -3 -2 -1
    `;

    const mesh = objParser.parse(objData);
    expect(mesh.getVertexCount()).toBe(3);
    expect(mesh.getFaceCount()).toBe(1);
    expect(mesh.faces[0]?.vertexIndices).toEqual([0, 1, 2]);
  });

  it("should ignore invalid tokens and comments", () => {
    const objData = `
      # comment
      o SampleObject
      s 1
      v 1.0 2.0 3.0
      v notANumber 0 0
      f notANumber
    `;

    const mesh = objParser.parse(objData);
    expect(mesh.getVertexCount()).toBe(1);
    expect(mesh.getFaceCount()).toBe(0);
  });

  it("should parse line elements (l v1 v2) into explicit edges", () => {
    const objData = `
      v 0 0 0
      v 1 0 0
      v 1 1 0
      l 1 2 3
      l -3 -1
    `;

    const mesh = objParser.parse(objData);
    expect(mesh.getVertexCount()).toBe(3);
    expect(mesh.explicitEdges.length).toBe(3); // (0,1), (1,2) from l 1 2 3, and (0,2) from l -3 -1
    expect(mesh.getWireframeEdges().length).toBe(3);
  });

  it("should parse usemtl statements and assign materialId to faces", () => {
    const objData = `
      v 0 0 0
      v 1 0 0
      v 1 1 0
      v 0 1 0
      usemtl WoodFloor
      f 1 2 3
      usemtl BrickWall
      f 1 3 4
    `;

    const mesh = objParser.parse(objData);
    expect(mesh.faces[0]?.materialId).toBe("WoodFloor");
    expect(mesh.faces[1]?.materialId).toBe("BrickWall");
  });

  it("should match usemtl statements against provided Material3D list and use material id", () => {
    const objData = `
      v 0 0 0
      v 1 0 0
      v 1 1 0
      usemtl Shiny_Gold
      f 1 2 3
    `;

    const mockMaterial = {
      id: "mat_unique_123",
      name: "Shiny Gold",
    } as any;

    const mesh = objParser.parse(objData, "model.obj", [mockMaterial]);
    expect(mesh.faces[0]?.materialId).toBe("mat_unique_123");
  });
});
