import { Vector3D } from "../../Common/Vector3D";
import { Face3D } from "./Face3D";
import { MeshGeometry } from "./MeshGeometry";
import { ModelFactory } from "./ModelFactory";

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

  public parse(objFileContent: string, fileName?: string): MeshGeometry {
    if (fileName !== undefined) {
      this.validateFileName(fileName);
    }

    const parsedVertices: Vector3D[] = [];
    const parsedFaces: Face3D[] = [];
    const lines = objFileContent.split(/\r?\n/);

    for (const rawLine of lines) {
      const trimmedLine = rawLine.trim();
      if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
        continue;
      }

      const tokens = trimmedLine.split(/\s+/);
      const commandType = tokens[0];

      if (commandType === "v") {
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
          parsedFaces.push(new Face3D(faceVertexIndices));
        }
      }
    }

    return this.modelFactory.createFromRawData(parsedVertices, parsedFaces);
  }
}
