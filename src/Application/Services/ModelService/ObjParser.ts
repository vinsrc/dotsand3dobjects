import { Vector3D } from "../../Common/Vector3D";
import { Face3D } from "./Face3D";
import { MeshGeometry } from "./MeshGeometry";
import { ModelFactory } from "./ModelFactory";
import { Material3D } from "../MaterialService/Material3D";

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
  ): MeshGeometry {
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
    const parsedFaces: Face3D[] = [];
    const parsedEdges: [number, number][] = [];
    let activeMaterialId: string | null = null;
    const lines = objFileContent.split(/\r?\n/);

    for (const rawLine of lines) {
      const trimmedLine = rawLine.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
        continue;
      }

      const tokens = trimmedLine.split(/\s+/);
      const commandType = tokens[0]?.toLowerCase();

      if (commandType === "usemtl") {
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
          parsedFaces.push(new Face3D(faceVertexIndices, activeMaterialId));
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

        for (
          let lineIndex = 0;
          lineIndex < lineVertexIndices.length - 1;
          lineIndex += 1
        ) {
          const startIndex = lineVertexIndices[lineIndex];
          const endIndex = lineVertexIndices[lineIndex + 1];
          if (startIndex !== undefined && endIndex !== undefined) {
            parsedEdges.push([startIndex, endIndex]);
          }
        }
      }
    }

    return this.modelFactory.createFromRawData(
      parsedVertices,
      parsedFaces,
      parsedEdges
    );
  }
}
