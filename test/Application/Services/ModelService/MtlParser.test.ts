import { describe, it, expect } from "vitest";
import { MtlParser } from "../../../../src/Application/Services/ModelService/MtlParser";

describe("MtlParser", () => {
  const parser = new MtlParser();

  it("should parse multiple materials with standard PBR and basic properties", () => {
    const mtlContent = `
      # Material file
      newmtl Chrome
      Kd 0.9 0.9 0.9
      Pr 0.1
      Pm 0.95
      
      newmtl Wood
      Kd 0.6 0.4 0.2
      Pr 0.8
      Pm 0.05
      map_Kd textures/wood.png
    `;

    const materials = parser.parse(mtlContent);
    expect(materials).toHaveLength(2);

    expect(materials[0]?.name).toBe("Chrome");
    expect(materials[0]?.roughness).toBeCloseTo(0.1);
    expect(materials[0]?.metalness).toBeCloseTo(0.95);
    expect(materials[0]?.imageUrl).toBeNull();

    expect(materials[1]?.name).toBe("Wood");
    expect(materials[1]?.imageUrl).toBe("textures/wood.png");
    expect(materials[1]?.roughness).toBeCloseTo(0.8);
    expect(materials[1]?.metalness).toBeCloseTo(0.05);
  });

  it("should retain unhandled Blender properties in extraProperties verbatim", () => {
    const mtlContent = `
      newmtl SciFiMetal
      Kd 0.5 0.5 0.5
      map_Bump textures/normal.png
      norm textures/normal2.png
      bump textures/bump.png
      Ka 0.2 0.2 0.2
      Ks 0.8 0.8 0.8
      Ns 250
      illum 2
      d 0.9
      Tr 0.1
      Ke 0.1 0.0 0.0
    `;

    const materials = parser.parse(mtlContent);
    expect(materials).toHaveLength(1);
    const material = materials[0];
    expect(material).toBeDefined();
    expect(material?.extraProperties).toContain("map_Bump textures/normal.png");
    expect(material?.extraProperties).toContain("norm textures/normal2.png");
    expect(material?.extraProperties).toContain("bump textures/bump.png");
    expect(material?.extraProperties).toContain("Ka 0.2 0.2 0.2");
    expect(material?.extraProperties).toContain("Ks 0.8 0.8 0.8");
    expect(material?.extraProperties).toContain("Ns 250");
    expect(material?.extraProperties).toContain("illum 2");
    expect(material?.extraProperties).toContain("d 0.9");
    expect(material?.extraProperties).toContain("Tr 0.1");
    expect(material?.extraProperties).toContain("Ke 0.1 0.0 0.0");
  });

  it("should handle default name when newmtl line has no name", () => {
    const mtlContent = `
      newmtl
      Kd 0.5 0.5 0.5
    `;

    const materials = parser.parse(mtlContent);
    expect(materials).toHaveLength(1);
    expect(materials[0]?.name).toBe("Material");
  });

  it("should handle empty or whitespace map_Kd by keeping imageUrl as null", () => {
    const mtlContent = `
      newmtl BlankImage
      map_Kd   
    `;

    const materials = parser.parse(mtlContent);
    expect(materials[0]?.imageUrl).toBeNull();
  });

  it("should ignore comments, empty lines, and lines before the first newmtl", () => {
    const mtlContent = `
      # Header comment
      Kd 1 1 1
      
      # Another comment
      newmtl First
      Kd 0 0 0
    `;

    const materials = parser.parse(mtlContent);
    expect(materials).toHaveLength(1);
    expect(materials[0]?.name).toBe("First");
    expect(materials[0]?.baseColor).toBe("#000000");
  });

  it("should ignore invalid numbers for Pr and Pm", () => {
    const mtlContent = `
      newmtl InvalidNumbers
      Pr notANumber
      Pm invalid
    `;

    const materials = parser.parse(mtlContent);
    expect(materials[0]?.roughness).toBe(0.5);
    expect(materials[0]?.metalness).toBe(0.0);
  });

  it("should convert RGB floats to hex accurately and clamp values", () => {
    expect(parser.rgbFloatsToHex(1.0, 0.0, 0.0)).toBe("#ff0000");
    expect(parser.rgbFloatsToHex(0.0, 1.0, 0.0)).toBe("#00ff00");
    expect(parser.rgbFloatsToHex(0.0, 0.0, 1.0)).toBe("#0000ff");
    expect(parser.rgbFloatsToHex(2.0, -1.0, 0.5)).toBe("#ff0080");
    expect(parser.rgbFloatsToHex(Number.NaN, Number.NaN, Number.NaN)).toBe("#cccccc");
  });
});
