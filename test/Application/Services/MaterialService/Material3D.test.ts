import { describe, it, expect } from "vitest";
import { Material3D } from "../../../../src/Application/Services/MaterialService/Material3D";

describe("Material3D", () => {
  it("should create material with default properties", () => {
    const material = new Material3D({
      id: "mat_1",
      name: "Default Material",
    });

    expect(material.id).toBe("mat_1");
    expect(material.name).toBe("Default Material");
    expect(material.baseColor).toBe("#cccccc");
    expect(material.roughness).toBe(0.5);
    expect(material.metalness).toBe(0.0);
    expect(material.imageUrl).toBeNull();
    expect(material.hasImage()).toBe(false);
  });

  it("should clamp roughness and metalness between 0 and 1", () => {
    const materialHigh = new Material3D({
      id: "mat_high",
      name: "High Clamped",
      roughness: 1.5,
      metalness: 2.0,
    });
    expect(materialHigh.roughness).toBe(1.0);
    expect(materialHigh.metalness).toBe(1.0);

    const materialLow = new Material3D({
      id: "mat_low",
      name: "Low Clamped",
      roughness: -0.5,
      metalness: -1.0,
    });
    expect(materialLow.roughness).toBe(0.0);
    expect(materialLow.metalness).toBe(0.0);
  });

  it("should detect when image is set or absent", () => {
    const materialWithImage = new Material3D({
      id: "mat_img",
      name: "Image Material",
      imageUrl: "data:image/png;base64,abc",
    });
    expect(materialWithImage.hasImage()).toBe(true);

    const materialWithEmpty = new Material3D({
      id: "mat_empty",
      name: "Empty Image",
      imageUrl: "   ",
    });
    expect(materialWithEmpty.hasImage()).toBe(false);
  });

  it("should return updated instances with immutability helpers", () => {
    const initial = new Material3D({
      id: "mat_init",
      name: "Initial",
      baseColor: "#111111",
      roughness: 0.2,
      metalness: 0.8,
      imageUrl: null,
    });

    const updatedName = initial.withName("Updated Name");
    expect(updatedName.name).toBe("Updated Name");
    expect(initial.name).toBe("Initial");

    const updatedColor = initial.withBaseColor("#222222");
    expect(updatedColor.baseColor).toBe("#222222");

    const updatedRoughness = initial.withRoughness(0.9);
    expect(updatedRoughness.roughness).toBe(0.9);

    const updatedMetalness = initial.withMetalness(0.4);
    expect(updatedMetalness.metalness).toBe(0.4);

    const updatedImage = initial.withImage(
      "data:image/png;base64,xyz",
      "custom_decal.png"
    );
    expect(updatedImage.imageUrl).toBe("data:image/png;base64,xyz");
    expect(updatedImage.imageFileName).toBe("custom_decal.png");
    expect(updatedImage.hasImage()).toBe(true);

    const updatedImageFileNameOnly = initial.withImageFileName("new_name.png");
    expect(updatedImageFileNameOnly.imageFileName).toBe("new_name.png");

    const updatedExtra = initial.withExtraProperties(["map_Bump normal.png", "illum 2"]);
    expect(updatedExtra.extraProperties).toEqual(["map_Bump normal.png", "illum 2"]);

    const cloned = initial.clone();
    expect(cloned).not.toBe(initial);
    expect(cloned.id).toBe(initial.id);
    expect(cloned.name).toBe(initial.name);
    expect(cloned.extraProperties).toEqual(initial.extraProperties);
  });
});
