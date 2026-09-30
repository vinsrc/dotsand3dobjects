import { Vector3D } from "../../Common/Vector3D";
import { Face3D } from "./Face3D";
import { MeshGeometry } from "./MeshGeometry";
import { ModelFactory } from "./ModelFactory";
import { Material3D } from "../MaterialService/Material3D";
import { DecalPlane } from "../DecalService/DecalPlane";

export interface ParsedObjResult {
  readonly model: MeshGeometry;
  readonly decals: readonly DecalPlane[];
}

export class ObjParser {
  private readonly modelFactory: ModelFactory;

  public constructor(modelFactory: ModelFactory) {
    this.modelFactory = modelFactory;
  }

  public validateFileName(fileName: string): void {
    const lowerCaseName = fileName.toLowerCase();
    if (!lowerCaseName.endsWith(".obj")) {
      throw new Error("Unsupported error");
    }
  }

  public parse(
    objFileContent: string,
    fileName?: string,
    materials?: readonly Material3D[]
  ): ParsedObjResult {
    if (fileName !== undefined) {
      this.validateFileName(fileName);
    }

    const materialNameToIdMap = new Map<string, string>();
    if (materials) {
      for (const material of materials) {
        materialNameToIdMap.set(material.name, material.id);
        const sanitizedName = material.name.replace(/\s+/g, "_");
        materialNameToIdMap.set(sanitizedName, material.id);
        materialNameToIdMap.set(material.id, material.id);
      }
    }

    const parsedVertices: Vector3D[] = [];
    const mainFaces: Face3D[] = [];
    const mainEdges: [number, number][] = [];
    const decalEntries: {
      id: string;
      vertexIndices: number[];
      materialId: string | null;
    }[] = [];

    let activeMaterialId: string | null = null;
    let currentObjectName: string = "default";
    const lines = objFileContent.split(/\r?\n/);

    for (const rawLine of lines) {
      const trimmedLine = rawLine.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
        continue;
      }

      const tokens = trimmedLine.split(/\s+/);
      const commandType = tokens[0]?.toLowerCase();

      if (commandType === "o" || commandType === "g") {
        currentObjectName = tokens.slice(1).join(" ").trim() || "default";
      } else if (commandType === "usemtl") {
        const materialName = trimmedLine.substring("usemtl".length).trim();
        if (materialName.length > 0 && materialName.toLowerCase() !== "default") {
          activeMaterialId = materialNameToIdMap.get(materialName) ?? materialName;
        } else {
          activeMaterialId = null;
        }
      } else if (commandType === "v") {
        const coordinateX = parseFloat(tokens[1] ?? "0");
        const coordinateY = parseFloat(tokens[2] ?? "0");
        const coordinateZ = parseFloat(tokens[3] ?? "0");

        if (
          !Number.isNaN(coordinateX) &&
          !Number.isNaN(coordinateY) &&
          !Number.isNaN(coordinateZ)
        ) {
          parsedVertices.push(
            new Vector3D(coordinateX, coordinateY, coordinateZ)
          );
        }
      } else if (commandType === "f") {
        const faceVertexIndices: number[] = [];
        const totalVertexCount = parsedVertices.length;

        for (
          let tokenIndex = 1;
          tokenIndex < tokens.length;
          tokenIndex += 1
        ) {
          const currentToken = tokens[tokenIndex];
          if (!currentToken) {
            continue;
          }

          const vertexIndexString = currentToken.split("/")[0];
          if (!vertexIndexString) {
            continue;
          }

          const parsedIndex = parseInt(vertexIndexString, 10);
          if (Number.isNaN(parsedIndex)) {
            continue;
          }

          // OBJ indices are 1-based. Negative indices are relative to end.
          const zeroBasedIndex =
            parsedIndex > 0
              ? parsedIndex - 1
              : totalVertexCount + parsedIndex;

          faceVertexIndices.push(zeroBasedIndex);
        }

        if (faceVertexIndices.length >= 3) {
          if (currentObjectName.toLowerCase().startsWith("decal")) {
            decalEntries.push({
              id: currentObjectName,
              vertexIndices: faceVertexIndices,
              materialId: activeMaterialId,
            });
          } else {
            mainFaces.push(new Face3D(faceVertexIndices, activeMaterialId));
          }
        }
      } else if (commandType === "l") {
        const lineVertexIndices: number[] = [];
        const totalVertexCount = parsedVertices.length;

        for (
          let tokenIndex = 1;
          tokenIndex < tokens.length;
          tokenIndex += 1
        ) {
          const currentToken = tokens[tokenIndex];
          if (!currentToken) {
            continue;
          }

          const parsedIndex = parseInt(currentToken.split("/")[0] ?? "", 10);
          if (!Number.isNaN(parsedIndex)) {
            const zeroBasedIndex =
              parsedIndex > 0
                ? parsedIndex - 1
                : totalVertexCount + parsedIndex;
            lineVertexIndices.push(zeroBasedIndex);
          }
        }

        if (!currentObjectName.toLowerCase().startsWith("decal")) {
          for (
            let lineIndex = 0;
            lineIndex < lineVertexIndices.length - 1;
            lineIndex += 1
          ) {
            const startIndex = lineVertexIndices[lineIndex];
            const endIndex = lineVertexIndices[lineIndex + 1];
            if (startIndex !== undefined && endIndex !== undefined) {
              mainEdges.push([startIndex, endIndex]);
            }
          }
        }
      }
    }

    const reconstructedDecals: DecalPlane[] = [];
    for (const entry of decalEntries) {
      const vList = entry.vertexIndices
        .map((idx) => parsedVertices[idx])
        .filter((v): v is Vector3D => v !== undefined);

      if (vList.length >= 3) {
        const v0 = vList[0] as Vector3D;
        const v1 = vList[1] as Vector3D;
        const v2 = vList[2] as Vector3D;
        const v3 =
          vList.length >= 4 ? (vList[3] as Vector3D) : v0.add(v2.subtract(v1));

        const sumX =
          v0.coordinateX + v1.coordinateX + v2.coordinateX + v3.coordinateX;
        const sumY =
          v0.coordinateY + v1.coordinateY + v2.coordinateY + v3.coordinateY;
        const sumZ =
          v0.coordinateZ + v1.coordinateZ + v2.coordinateZ + v3.coordinateZ;
        const center = new Vector3D(sumX / 4, sumY / 4, sumZ / 4);

        const edge1 = v1.subtract(v0);
        const edge2 = v3.subtract(v0);
        let normal = edge1.calculateCrossProduct(edge2).normalize();
        if (normal.calculateMagnitude() < 0.0001) {
          normal = new Vector3D(0, 0, 1);
        }
        const size = edge1.calculateMagnitude();

        let parentFaceIndex = 0;
        let minDistance = Infinity;
        for (let fIdx = 0; fIdx < mainFaces.length; fIdx += 1) {
          const face = mainFaces[fIdx] as Face3D;
          let fSumX = 0;
          let fSumY = 0;
          let fSumZ = 0;
          for (const vIdx of face.vertexIndices) {
            const fv = parsedVertices[vIdx];
            if (fv) {
              fSumX += fv.coordinateX;
              fSumY += fv.coordinateY;
              fSumZ += fv.coordinateZ;
            }
          }
          const centroid = new Vector3D(
            fSumX / face.vertexIndices.length,
            fSumY / face.vertexIndices.length,
            fSumZ / face.vertexIndices.length
          );
          const dist = centroid.subtract(center).calculateMagnitude();
          if (dist < minDistance) {
            minDistance = dist;
            parentFaceIndex = fIdx;
          }
        }

        reconstructedDecals.push(
          new DecalPlane(
            entry.id,
            parentFaceIndex,
            center,
            normal,
            size,
            0,
            [v0, v1, v2, v3],
            entry.materialId
          )
        );
      }
    }

    // Remap vertices if decals were removed from main mesh
    if (reconstructedDecals.length > 0) {
      const usedIndexSet = new Set<number>();
      for (const face of mainFaces) {
        for (const idx of face.vertexIndices) {
          usedIndexSet.add(idx);
        }
      }
      for (const [start, end] of mainEdges) {
        usedIndexSet.add(start);
        usedIndexSet.add(end);
      }

      const finalVertices: Vector3D[] = [];
      const oldToNewIndexMap = new Map<number, number>();

      for (let i = 0; i < parsedVertices.length; i += 1) {
        if (usedIndexSet.has(i)) {
          oldToNewIndexMap.set(i, finalVertices.length);
          finalVertices.push(parsedVertices[i] as Vector3D);
        }
      }

      const remappedFaces = mainFaces.map(
        (face) =>
          new Face3D(
            face.vertexIndices.map((idx) => oldToNewIndexMap.get(idx) ?? idx),
            face.materialId
          )
      );

      const remappedEdges: [number, number][] = mainEdges.map(([start, end]) => [
        oldToNewIndexMap.get(start) ?? start,
        oldToNewIndexMap.get(end) ?? end,
      ]);

      const model = this.modelFactory.createFromRawData(
        finalVertices,
        remappedFaces,
        remappedEdges
      );

      return { model, decals: reconstructedDecals };
    }

    const model = this.modelFactory.createFromRawData(
      parsedVertices,
      mainFaces,
      mainEdges
    );

    return { model, decals: [] };
  }
}
