import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { MeshGeometry } from "../../Application/Services/ModelService/MeshGeometry";
import { RenderMode } from "../../Application/Services/RenderModeService/RenderModeService";

export interface MeshViewerProps {
  readonly meshGeometry: MeshGeometry;
  readonly renderMode: RenderMode;
}

interface BufferGeometryPair {
  readonly surfaceGeometry: THREE.BufferGeometry;
  readonly wireframeGeometry: THREE.BufferGeometry;
}

const buildSurfaceGeometry = (
  meshGeometry: MeshGeometry
): THREE.BufferGeometry => {
  const surfaceBufferGeometry = new THREE.BufferGeometry();

  if (meshGeometry.isEmpty()) {
    return surfaceBufferGeometry;
  }

  const surfacePositions: number[] = [];

  for (const currentFace of meshGeometry.faces) {
    const triangulatedFaces = currentFace.triangulate();
    for (const triangleFace of triangulatedFaces) {
      for (const vertexIndex of triangleFace.vertexIndices) {
        const currentVertex = meshGeometry.vertices[vertexIndex];
        if (currentVertex) {
          surfacePositions.push(
            currentVertex.coordinateX,
            currentVertex.coordinateY,
            currentVertex.coordinateZ
          );
        }
      }
    }
  }

  surfaceBufferGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(surfacePositions, 3)
  );
  surfaceBufferGeometry.computeVertexNormals();

  return surfaceBufferGeometry;
};

const buildWireframeGeometry = (
  meshGeometry: MeshGeometry
): THREE.BufferGeometry => {
  const wireframeBufferGeometry = new THREE.BufferGeometry();

  if (meshGeometry.isEmpty()) {
    return wireframeBufferGeometry;
  }

  const wireframePositions: number[] = [];
  const wireframeEdges = meshGeometry.getWireframeEdges();

  for (const [startVertexIndex, endVertexIndex] of wireframeEdges) {
    const startVertex = meshGeometry.vertices[startVertexIndex];
    const endVertex = meshGeometry.vertices[endVertexIndex];

    if (startVertex && endVertex) {
      wireframePositions.push(
        startVertex.coordinateX,
        startVertex.coordinateY,
        startVertex.coordinateZ,
        endVertex.coordinateX,
        endVertex.coordinateY,
        endVertex.coordinateZ
      );
    }
  }

  wireframeBufferGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(wireframePositions, 3)
  );

  return wireframeBufferGeometry;
};

export const MeshViewer: React.FC<MeshViewerProps> = ({
  meshGeometry,
  renderMode,
}) => {
  const [geometryPair, setGeometryPair] = useState<BufferGeometryPair>(() => ({
    surfaceGeometry: new THREE.BufferGeometry(),
    wireframeGeometry: new THREE.BufferGeometry(),
  }));

  const activeGeometriesRef = useRef<BufferGeometryPair>(geometryPair);
  activeGeometriesRef.current = geometryPair;

  useEffect(() => {
    const newSurfaceGeometry = buildSurfaceGeometry(meshGeometry);
    const newWireframeGeometry = buildWireframeGeometry(meshGeometry);

    const newPair: BufferGeometryPair = {
      surfaceGeometry: newSurfaceGeometry,
      wireframeGeometry: newWireframeGeometry,
    };

    setGeometryPair(newPair);

    return () => {
      newSurfaceGeometry.dispose();
      newWireframeGeometry.dispose();
    };
  }, [meshGeometry]);

  // Ensure initial empty geometries are cleaned up on unmount
  useEffect(() => {
    return () => {
      activeGeometriesRef.current.surfaceGeometry.dispose();
      activeGeometriesRef.current.wireframeGeometry.dispose();
    };
  }, []);

  if (meshGeometry.isEmpty()) {
    return null;
  }

  return (
    <group>
      {renderMode === "FLAT_SHADED" && (
        <mesh geometry={geometryPair.surfaceGeometry}>
          <meshStandardMaterial
            color="#cccccc"
            roughness={0.7}
            metalness={0.1}
            flatShading={true}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {renderMode === "WIREFRAME" ? (
        <lineSegments geometry={geometryPair.wireframeGeometry}>
          <lineBasicMaterial color="#111111" linewidth={1.5} />
        </lineSegments>
      ) : (
        <lineSegments geometry={geometryPair.wireframeGeometry}>
          <lineBasicMaterial color="#444444" transparent opacity={0.35} />
        </lineSegments>
      )}
    </group>
  );
};
