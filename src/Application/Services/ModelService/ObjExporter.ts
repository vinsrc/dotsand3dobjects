import { MeshGeometry } from "./MeshGeometry";

export class ObjExporter {
  public export(meshGeometry: MeshGeometry): string {
    const outputLines: string[] = [
      "# Exported by WireframeVibe3D",
      "# Hard Surface Modeling App",
    ];

    for (const currentVertex of meshGeometry.vertices) {
      const coordinateX = currentVertex.coordinateX.toFixed(6);
      const coordinateY = currentVertex.coordinateY.toFixed(6);
      const coordinateZ = currentVertex.coordinateZ.toFixed(6);
      outputLines.push(`v ${coordinateX} ${coordinateY} ${coordinateZ}`);
    }

    for (const currentFace of meshGeometry.faces) {
      const oneBasedIndices = currentFace.vertexIndices.map(
        (zeroBasedIndex) => zeroBasedIndex + 1
      );
      outputLines.push(`f ${oneBasedIndices.join(" ")}`);
    }

    return outputLines.join("\n");
  }
}
