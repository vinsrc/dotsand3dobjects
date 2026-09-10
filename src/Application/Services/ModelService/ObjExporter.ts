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

    const faceEdgeKeySet = new Set<string>();
    for (const currentFace of meshGeometry.faces) {
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
}
