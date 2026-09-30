import { Vector3D } from "../../Common/Vector3D";
import { Face3D } from "./Face3D";
import { MeshGeometry } from "./MeshGeometry";

export class ModelFactory {
  public createFromRawData(
    vertices: readonly Vector3D[],
    faces: readonly Face3D[] = [],
    explicitEdges: readonly [number, number][] = []
  ): MeshGeometry {
    return new MeshGeometry(vertices, faces, explicitEdges);
  }

  public createStarterCube(cubeSize: number = 2): MeshGeometry {
    const halfExtent = cubeSize / 2;

    const cubeVertices: Vector3D[] = [
      new Vector3D(-halfExtent, -halfExtent, -halfExtent),
      new Vector3D(halfExtent, -halfExtent, -halfExtent),
      new Vector3D(halfExtent, halfExtent, -halfExtent),
      new Vector3D(-halfExtent, halfExtent, -halfExtent),
      new Vector3D(-halfExtent, -halfExtent, halfExtent),
      new Vector3D(halfExtent, -halfExtent, halfExtent),
      new Vector3D(halfExtent, halfExtent, halfExtent),
      new Vector3D(-halfExtent, halfExtent, halfExtent),
    ];

    const cubeFaces: Face3D[] = [
      new Face3D([0, 3, 2, 1]), // Back (-Z)
      new Face3D([4, 5, 6, 7]), // Front (+Z)
      new Face3D([0, 1, 5, 4]), // Bottom (-Y)
      new Face3D([2, 3, 7, 6]), // Top (+Y)
      new Face3D([0, 4, 7, 3]), // Left (-X)
      new Face3D([1, 2, 6, 5]), // Right (+X)
    ];

    return new MeshGeometry(cubeVertices, cubeFaces);
  }
}
