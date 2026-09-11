import { Material3D } from "../MaterialService/Material3D";

interface MutableMaterialData {
  id: string;
  name: string;
  baseColor: string;
  roughness: number;
  metalness: number;
  imageUrl: string | null;
  extraProperties: string[];
}

export class MtlParser {
  public parse(mtlContent: string): readonly Material3D[] {
    const parsedMaterials: Material3D[] = [];
    const lines = mtlContent.split(/\r?\n/);
    let activeMaterial: MutableMaterialData | null = null;

    const commitActiveMaterial = () => {
      if (activeMaterial) {
        parsedMaterials.push(
          new Material3D({
            id: activeMaterial.id,
            name: activeMaterial.name,
            baseColor: activeMaterial.baseColor,
            roughness: activeMaterial.roughness,
            metalness: activeMaterial.metalness,
            imageUrl: activeMaterial.imageUrl,
            extraProperties: activeMaterial.extraProperties,
          })
        );
      }
    };

    for (const rawLine of lines) {
      const trimmedLine = rawLine.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
        continue;
      }

      const tokens = trimmedLine.split(/\s+/);
      const commandKey = tokens[0]?.toLowerCase();

      if (commandKey === "newmtl") {
        commitActiveMaterial();
        const materialName = trimmedLine.substring("newmtl".length).trim();
        const generatedId = `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        activeMaterial = {
          id: generatedId,
          name: materialName.length > 0 ? materialName : "Material",
          baseColor: "#cccccc",
          roughness: 0.5,
          metalness: 0.0,
          imageUrl: null,
          extraProperties: [],
        };
      } else if (!activeMaterial) {
        continue;
      } else if (commandKey === "kd") {
        const redFloat = parseFloat(tokens[1] ?? "0.8");
        const greenFloat = parseFloat(tokens[2] ?? "0.8");
        const blueFloat = parseFloat(tokens[3] ?? "0.8");
        activeMaterial.baseColor = this.rgbFloatsToHex(
          redFloat,
          greenFloat,
          blueFloat
        );
      } else if (commandKey === "pr") {
        const roughnessFloat = parseFloat(tokens[1] ?? "0.5");
        if (!Number.isNaN(roughnessFloat)) {
          activeMaterial.roughness = Math.max(0, Math.min(1, roughnessFloat));
        }
      } else if (commandKey === "pm") {
        const metalnessFloat = parseFloat(tokens[1] ?? "0.0");
        if (!Number.isNaN(metalnessFloat)) {
          activeMaterial.metalness = Math.max(0, Math.min(1, metalnessFloat));
        }
      } else if (commandKey === "map_kd") {
        const imagePath = trimmedLine.substring("map_kd".length).trim();
        activeMaterial.imageUrl = imagePath.length > 0 ? imagePath : null;
      } else {
        // Retain any other property (e.g. map_Bump, norm, bump, Ka, Ks, Ns, d, Tr, illum, Ke)
        activeMaterial.extraProperties.push(trimmedLine);
      }
    }

    commitActiveMaterial();
    return parsedMaterials;
  }

  public rgbFloatsToHex(
    redFloat: number,
    greenFloat: number,
    blueFloat: number
  ): string {
    const clampedRed = Math.max(0, Math.min(1, Number.isNaN(redFloat) ? 0.8 : redFloat));
    const clampedGreen = Math.max(
      0,
      Math.min(1, Number.isNaN(greenFloat) ? 0.8 : greenFloat)
    );
    const clampedBlue = Math.max(
      0,
      Math.min(1, Number.isNaN(blueFloat) ? 0.8 : blueFloat)
    );

    const redByte = Math.round(clampedRed * 255)
      .toString(16)
      .padStart(2, "0");
    const greenByte = Math.round(clampedGreen * 255)
      .toString(16)
      .padStart(2, "0");
    const blueByte = Math.round(clampedBlue * 255)
      .toString(16)
      .padStart(2, "0");

    return `#${redByte}${greenByte}${blueByte}`;
  }
}
