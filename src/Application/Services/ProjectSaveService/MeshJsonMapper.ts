import { Face3D } from "../ModelService/Face3D";
import { MeshGeometry } from "../ModelService/MeshGeometry";
import { SerializedMesh } from "./ProjectSaveDocument";
import { VectorJsonMapper } from "./VectorJsonMapper";

export class MeshJsonMapper {
  public constructor(private readonly vectorJsonMapper: VectorJsonMapper) {}

  public toJson(mesh: MeshGeometry): SerializedMesh {
    return {
      vertices: mesh.vertices.map((vertex) =>
        this.vectorJsonMapper.toJson(vertex)
      ),
      faces: mesh.faces.map((face) => ({
        vertexIndices: [...face.vertexIndices],
        materialId: face.materialId,
      })),
      explicitEdges: mesh.explicitEdges.map(
        (edge) => [edge[0], edge[1]] as [number, number]
      ),
    };
  }

  public fromJson(serializedMesh: SerializedMesh): MeshGeometry {
    const vertices = serializedMesh.vertices.map((vertex) =>
      this.vectorJsonMapper.fromJson(vertex)
    );
    const faces = serializedMesh.faces.map(
      (face) => new Face3D(face.vertexIndices, face.materialId)
    );
    return new MeshGeometry(vertices, faces, serializedMesh.explicitEdges);
  }
}
