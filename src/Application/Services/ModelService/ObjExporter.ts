import { MeshGeometry } from "./MeshGeometry";
import { Material3D } from "../MaterialService/Material3D";

export class ObjExporter {
  public export(
    meshGeometry: MeshGeometry,
    materials?: readonly Material3D[]
  ): string {
    const outputLines: string[] = [
      "# Exported by WireframeVibe3D",
      "# Hard Surface Modeling App",
    ];

    const materialMap = new Map<string, Material3D>();
    if (materials) {
      for (const material of materials) {
        materialMap.set(material.id, material);
      }
    }

    const hasAssignedMaterials =
      materials &&
      materials.length > 0 &&
      meshGeometry.faces.some((face) => face.materialId !== null);

    if (hasAssignedMaterials) {
      outputLines.push("mtllib model.mtl");
    }

    for (const currentVertex of meshGeometry.vertices) {
      const coordinateX = currentVertex.coordinateX.toFixed(6);
      const coordinateY = currentVertex.coordinateY.toFixed(6);
      const coordinateZ = currentVertex.coordinateZ.toFixed(6);
      outputLines.push(`v ${coordinateX} ${coordinateY} ${coordinateZ}`);
    }

    const faceEdgeKeySet = new Set<string>();
    let activeMaterialId: string | null = null;

    for (const currentFace of meshGeometry.faces) {
      if (hasAssignedMaterials) {
        const faceMatId = currentFace.materialId;
        if (faceMatId !== activeMaterialId) {
          activeMaterialId = faceMatId;
          const assignedMat = faceMatId ? materialMap.get(faceMatId) : null;
          if (assignedMat) {
            const sanitizedName = assignedMat.name.replace(/\s+/g, "_");
            outputLines.push(`usemtl ${sanitizedName}`);
          } else {
            outputLines.push("usemtl default");
          }
        }
      }

      const vertexIndices = currentFace.vertexIndices;
      const vertexCount = vertexIndices.length;

      for (let currentIndex = 0; currentIndex < vertexCount; currentIndex += 1) {
        const nextIndex = (currentIndex + 1) % vertexCount;
        const startIndex = vertexIndices[currentIndex];
        const endIndex = vertexIndices[nextIndex];
        if (startIndex !== undefined && endIndex !== undefined) {
          const lowerIndex = Math.min(startIndex, endIndex);
          const higherIndex = Math.max(startIndex, endIndex);
          faceEdgeKeySet.add(`${lowerIndex}_${higherIndex}`);
        }
      }

      const oneBasedIndices = vertexIndices.map(
        (zeroBasedIndex) => zeroBasedIndex + 1
      );
      outputLines.push(`f ${oneBasedIndices.join(" ")}`);
    }

    for (const [startVertexIndex, endVertexIndex] of meshGeometry.getWireframeEdges()) {
      const lowerIndex = Math.min(startVertexIndex, endVertexIndex);
      const higherIndex = Math.max(startVertexIndex, endVertexIndex);
      if (!faceEdgeKeySet.has(`${lowerIndex}_${higherIndex}`)) {
        outputLines.push(`l ${startVertexIndex + 1} ${endVertexIndex + 1}`);
      }
    }

    return outputLines.join("\n");
  }

  public exportMtl(materials: readonly Material3D[]): string {
    const lines: string[] = [
      "# Materials exported by WireframeVibe3D",
      "# OBJ PBR Extensions",
    ];

    for (const material of materials) {
      const sanitizedName = material.name.replace(/\s+/g, "_");
      lines.push(`newmtl ${sanitizedName}`);
      const [r, g, b] = this.hexToRgbFloats(material.baseColor);
      lines.push(`Kd ${r.toFixed(6)} ${g.toFixed(6)} ${b.toFixed(6)}`);
      lines.push(`Pr ${material.roughness.toFixed(6)}`);
      lines.push(`Pm ${material.metalness.toFixed(6)}`);
      if (material.hasImage()) {
        lines.push(`map_Kd ${material.imageUrl ?? "texture.png"}`);
      }
      for (const extraProperty of material.extraProperties) {
        lines.push(extraProperty);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  private hexToRgbFloats(hexColor: string): [number, number, number] {
    const sanitized = hexColor.replace("#", "");
    const red = parseInt(sanitized.substring(0, 2), 16) / 255;
    const green = parseInt(sanitized.substring(2, 4), 16) / 255;
    const blue = parseInt(sanitized.substring(4, 6), 16) / 255;
    return [
      Number.isNaN(red) ? 0.8 : red,
      Number.isNaN(green) ? 0.8 : green,
      Number.isNaN(blue) ? 0.8 : blue,
    ];
  }
}
