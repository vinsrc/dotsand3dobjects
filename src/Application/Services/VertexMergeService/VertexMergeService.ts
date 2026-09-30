import { ModelService } from "../ModelService/ModelService";
import { SelectionService } from "../SelectionService/SelectionService";
import { DecalService } from "../DecalService/DecalService";
import { MeshVertexMerger, MeshMergeResult } from "./MeshVertexMerger";

export interface VertexMergeResult {
  readonly mergedCount: number;
  readonly vertexIndexMap: ReadonlyMap<number, number>;
  readonly faceIndexMap: ReadonlyMap<number, number | null>;
}

export class VertexMergeService {
  private readonly modelService: ModelService;
  private readonly selectionService: SelectionService;
  private readonly decalService: DecalService;
  private readonly meshVertexMerger: MeshVertexMerger;

  public constructor(
    modelService: ModelService,
    selectionService: SelectionService,
    decalService: DecalService,
    meshVertexMerger?: MeshVertexMerger
  ) {
    this.modelService = modelService;
    this.selectionService = selectionService;
    this.decalService = decalService;
    this.meshVertexMerger = meshVertexMerger ?? new MeshVertexMerger();
  }

  public mergeCoincidentVertices(
    tolerance: number = 0.001,
    movedIndices?: readonly number[]
  ): VertexMergeResult {
    const currentModel = this.modelService.getCurrentModel();
    const mergeResult: MeshMergeResult = this.meshVertexMerger.merge(
      currentModel,
      tolerance,
      movedIndices
    );

    if (mergeResult.mergedCount > 0) {
      this.modelService.setCurrentModel(mergeResult.mergedMesh);
      this.updateSelection(mergeResult.vertexIndexMap);
      this.decalService.remapFaceIndices(mergeResult.faceIndexMap);
    }

    return {
      mergedCount: mergeResult.mergedCount,
      vertexIndexMap: mergeResult.vertexIndexMap,
      faceIndexMap: mergeResult.faceIndexMap,
    };
  }

  private updateSelection(vertexIndexMap: ReadonlyMap<number, number>): void {
    const currentSelectedIndices = this.selectionService.getSelectedIndices();
    const currentActiveVertex = this.selectionService.getActiveVertex();
    const currentSelectedEdges = this.selectionService.getSelectedEdges();

    const remappedSelectedSet = new Set<number>();
    for (const originalIndex of currentSelectedIndices) {
      const remappedIndex = vertexIndexMap.get(originalIndex);
      if (remappedIndex !== undefined) {
        remappedSelectedSet.add(remappedIndex);
      }
    }

    const remappedActiveVertex =
      currentActiveVertex !== null
        ? (vertexIndexMap.get(currentActiveVertex) ?? null)
        : null;

    const remappedSelectedEdges: [number, number][] = [];
    const edgeKeySet = new Set<string>();

    for (const [startVertex, endVertex] of currentSelectedEdges) {
      const mappedStart = vertexIndexMap.get(startVertex);
      const mappedEnd = vertexIndexMap.get(endVertex);

      if (
        mappedStart !== undefined &&
        mappedEnd !== undefined &&
        mappedStart !== mappedEnd
      ) {
        const lower = Math.min(mappedStart, mappedEnd);
        const higher = Math.max(mappedStart, mappedEnd);
        const edgeKey = `${lower}_${higher}`;

        if (!edgeKeySet.has(edgeKey)) {
          edgeKeySet.add(edgeKey);
          remappedSelectedEdges.push([lower, higher]);
        }
      }
    }

    this.selectionService.restoreSelection(
      Array.from(remappedSelectedSet),
      remappedActiveVertex,
      remappedSelectedEdges
    );
  }
}
