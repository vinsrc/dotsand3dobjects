import { describe, it, expect } from "vitest";
import { MaterialJsonMapper } from "../../../../src/Application/Services/ProjectSaveService/MaterialJsonMapper";
import { Material3D } from "../../../../src/Application/Services/MaterialService/Material3D";

describe("MaterialJsonMapper", () => {
  const mapper = new MaterialJsonMapper();

  it("should serialize and deserialize Material3D correctly", () => {
    const material = new Material3D({
      id: "mat_test",
      name: "Test Material",
      baseColor: "#ff0000",
      roughness: 0.4,
      metalness: 0.8,
      imageUrl: "data:image/png;base64,abc",
      imageFileName: "texture.png",
      extraProperties: ["Ka 0 0 0", "d 1.0"],
    });

    const json = mapper.toJson(material);
    expect(json.id).toBe("mat_test");
    expect(json.name).toBe("Test Material");
    expect(json.baseColor).toBe("#ff0000");
    expect(json.roughness).toBe(0.4);
    expect(json.metalness).toBe(0.8);
    expect(json.imageUrl).toBe("data:image/png;base64,abc");
    expect(json.imageFileName).toBe("texture.png");
    expect(json.extraProperties).toEqual(["Ka 0 0 0", "d 1.0"]);

    const restored = mapper.fromJson(json);
    expect(restored.id).toBe("mat_test");
    expect(restored.name).toBe("Test Material");
    expect(restored.baseColor).toBe("#ff0000");
    expect(restored.roughness).toBe(0.4);
    expect(restored.metalness).toBe(0.8);
    expect(restored.imageUrl).toBe("data:image/png;base64,abc");
    expect(restored.imageFileName).toBe("texture.png");
    expect(restored.extraProperties).toEqual(["Ka 0 0 0", "d 1.0"]);
  });
});
