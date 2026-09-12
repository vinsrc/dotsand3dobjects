import { MeshGeometry } from "./MeshGeometry";
import { Material3D } from "../MaterialService/Material3D";
import { DecalPlane } from "../DecalService/DecalPlane";

export interface ExportedImageFile {
  readonly fileName: string;
  readonly dataUrl: string;
}

export class ObjExporter {
  public export(
    meshGeometry: MeshGeometry,
    materials?: readonly Material3D[],
    decals?: readonly DecalPlane[],
    baseModelName: string = "model"
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
      (meshGeometry.faces.some((face) => face.materialId !== null) ||
        (decals && decals.some((decal) => decal.materialId !== null)));

    if (hasAssignedMaterials) {
      outputLines.push(`mtllib ${baseModelName}.mtl`);
    }

    for (const currentVertex of meshGeometry.vertices) {
      const coordinateX = currentVertex.coordinateX.toFixed(6);
      const coordinateY = currentVertex.coordinateY.toFixed(6);
      const coordinateZ = currentVertex.coordinateZ.toFixed(6);
      outputLines.push(`v ${coordinateX} ${coordinateY} ${coordinateZ}`);
    }

    if (decals && decals.length > 0) {
      for (const decal of decals) {
        for (const currentVertex of decal.vertices) {
          const coordinateX = currentVertex.coordinateX.toFixed(6);
          const coordinateY = currentVertex.coordinateY.toFixed(6);
          const coordinateZ = currentVertex.coordinateZ.toFixed(6);
          outputLines.push(`v ${coordinateX} ${coordinateY} ${coordinateZ}`);
        }
      }
    }

    if (decals && decals.length > 0) {
      outputLines.push("vt 0.000000 0.000000");
      outputLines.push("vt 1.000000 0.000000");
      outputLines.push("vt 1.000000 1.000000");
      outputLines.push("vt 0.000000 1.000000");
    }

    const faceEdgeKeySet = new Set<string>();
    let activeMaterialId: string | null = null;

    outputLines.push("o MainModel");
    outputLines.push("g MainModel");

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

    if (decals && decals.length > 0) {
      const baseVertexOffset = meshGeometry.vertices.length;
      for (let decalIndex = 0; decalIndex < decals.length; decalIndex += 1) {
        const decal = decals[decalIndex] as DecalPlane;
        const startVertexIdx = baseVertexOffset + decalIndex * 4;
        const v0 = startVertexIdx + 1;
        const v1 = startVertexIdx + 2;
        const v2 = startVertexIdx + 3;
        const v3 = startVertexIdx + 4;

        outputLines.push(`o ${decal.id}`);
        outputLines.push(`g ${decal.id}`);

        if (hasAssignedMaterials) {
          const decalMatId = decal.materialId;
          if (decalMatId !== activeMaterialId) {
            activeMaterialId = decalMatId;
            const assignedMat = decalMatId ? materialMap.get(decalMatId) : null;
            if (assignedMat) {
              const sanitizedName = assignedMat.name.replace(/\s+/g, "_");
              outputLines.push(`usemtl ${sanitizedName}`);
            } else {
              outputLines.push("usemtl default");
            }
          }
        }

        outputLines.push(`f ${v0}/1 ${v1}/2 ${v2}/3 ${v3}/4`);
      }
    }

    return outputLines.join("\n");
  }

  public exportMtl(
    materials: readonly Material3D[],
    baseModelName: string = "model"
  ): string {
    const lines: string[] = [
      "# Materials exported by WireframeVibe3D",
      "# OBJ PBR Extensions",
    ];

    const materialsWithImages = materials.filter(
      (mat) => mat.hasImage() && mat.imageUrl !== null
    );
    const materialImageNameMap = new Map<string, string>();
    const usedFileNames = new Set<string>();

    for (let index = 0; index < materialsWithImages.length; index += 1) {
      const mat = materialsWithImages[index] as Material3D;
      let resolvedName = this.resolveImageFileName(mat, baseModelName);
      if (usedFileNames.has(resolvedName)) {
        const dotIndex = resolvedName.lastIndexOf(".");
        const base =
          dotIndex !== -1 ? resolvedName.substring(0, dotIndex) : resolvedName;
        const ext = dotIndex !== -1 ? resolvedName.substring(dotIndex) : ".png";
        resolvedName = `${base}_${index + 1}${ext}`;
      }
      usedFileNames.add(resolvedName);
      materialImageNameMap.set(mat.id, resolvedName);
    }

    for (const material of materials) {
      const sanitizedName = material.name.replace(/\s+/g, "_");
      lines.push(`newmtl ${sanitizedName}`);
      const [r, g, b] = this.hexToRgbFloats(material.baseColor);
      lines.push(`Kd ${r.toFixed(6)} ${g.toFixed(6)} ${b.toFixed(6)}`);
      lines.push(`Pr ${material.roughness.toFixed(6)}`);
      lines.push(`Pm ${material.metalness.toFixed(6)}`);
      if (material.hasImage()) {
        const imageName =
          materialImageNameMap.get(material.id) ?? `${baseModelName}.png`;
        lines.push(`map_Kd ${imageName}`);
      }
      for (const extraProperty of material.extraProperties) {
        lines.push(extraProperty);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  public exportImages(
    materials: readonly Material3D[],
    baseModelName: string = "model"
  ): readonly ExportedImageFile[] {
    const materialsWithImages = materials.filter(
      (material) => material.hasImage() && material.imageUrl !== null
    );

    const exportedFiles: ExportedImageFile[] = [];
    const usedFileNames = new Set<string>();

    for (let index = 0; index < materialsWithImages.length; index += 1) {
      const material = materialsWithImages[index] as Material3D;
      let resolvedFileName = this.resolveImageFileName(
        material,
        baseModelName
      );

      if (usedFileNames.has(resolvedFileName)) {
        const dotIndex = resolvedFileName.lastIndexOf(".");
        const base =
          dotIndex !== -1
            ? resolvedFileName.substring(0, dotIndex)
            : resolvedFileName;
        const ext =
          dotIndex !== -1 ? resolvedFileName.substring(dotIndex) : ".png";
        resolvedFileName = `${base}_${index + 1}${ext}`;
      }
      usedFileNames.add(resolvedFileName);

      exportedFiles.push({
        fileName: resolvedFileName,
        dataUrl: material.imageUrl as string,
      });
    }

    return exportedFiles;
  }

  public resolveImageFileName(
    material: Material3D,
    baseModelName: string = "model"
  ): string {
    if (material.imageFileName && material.imageFileName.trim().length > 0) {
      return material.imageFileName.trim();
    }

    if (!material.hasImage() || !material.imageUrl) {
      return `${baseModelName}.png`;
    }

    if (!material.imageUrl.startsWith("data:")) {
      const lastSlashIndex = Math.max(
        material.imageUrl.lastIndexOf("/"),
        material.imageUrl.lastIndexOf("\\")
      );
      return lastSlashIndex !== -1
        ? material.imageUrl.substring(lastSlashIndex + 1)
        : material.imageUrl;
    }

    const mimeMatch = material.imageUrl.match(
      /^data:image\/([a-zA-Z0-9+.-]+);base64,/
    );
    let extension = "png";
    if (mimeMatch && mimeMatch[1]) {
      const subType = mimeMatch[1].toLowerCase();
      if (subType === "jpeg" || subType === "jpg") {
        extension = "jpg";
      } else if (subType === "svg+xml") {
        extension = "svg";
      } else if (subType === "webp") {
        extension = "webp";
      } else if (subType === "gif") {
        extension = "gif";
      } else {
        extension = subType;
      }
    }

    return `${baseModelName}.${extension}`;
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
