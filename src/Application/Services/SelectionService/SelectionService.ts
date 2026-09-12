import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";

export class SelectionService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private readonly selectedIndicesSet: Set<number>;
  private readonly selectedFaceIndicesSet: Set<number>;
  private readonly selectedEdgesSet: Set<string>;
  private selectedFaceIndex: number | null;
  private activeVertexIndex: number | null;

  public constructor(stateNotifier: ApplicationStateNotifier) {
    this.stateNotifier = stateNotifier;
    this.selectedIndicesSet = new Set();
    this.selectedFaceIndicesSet = new Set();
    this.selectedEdgesSet = new Set();
    this.selectedFaceIndex = null;
    this.activeVertexIndex = null;
  }

  public getSelectedIndices(): readonly number[] {
    return Array.from(this.selectedIndicesSet);
  }

  public isSelected(vertexIndex: number): boolean {
    return this.selectedIndicesSet.has(vertexIndex);
  }

  public getActiveVertex(): number | null {
    return this.activeVertexIndex;
  }

  public getSelectedEdges(): readonly [number, number][] {
    return Array.from(this.selectedEdgesSet).map((key) => this.keyToEdge(key));
  }

  public isEdgeSelected(edge: [number, number]): boolean {
    return this.selectedEdgesSet.has(this.edgeToKey(edge));
  }

  public selectEdge(edge: [number, number]): void {
    const key = this.edgeToKey(edge);
    if (this.selectedEdgesSet.has(key) && this.selectedEdgesSet.size === 1) {
      this.clearSelection();
      return;
    }

    this.selectedFaceIndex = null;
    this.selectedFaceIndicesSet.clear();
    this.selectedIndicesSet.clear();
    this.activeVertexIndex = null;
    this.selectedEdgesSet.clear();
    this.selectedEdgesSet.add(key);
    this.notifySelectionChange();
  }

  public toggleEdgeSelection(edge: [number, number]): void {
    this.selectedFaceIndex = null;
    this.selectedFaceIndicesSet.clear();
    const key = this.edgeToKey(edge);
    if (this.selectedEdgesSet.has(key)) {
      this.selectedEdgesSet.delete(key);
    } else {
      this.selectedEdgesSet.add(key);
    }
    this.notifySelectionChange();
  }

  public selectSingle(vertexIndex: number): void {
    if (
      this.selectedIndicesSet.has(vertexIndex) &&
      this.selectedIndicesSet.size === 1
    ) {
      this.clearSelection();
      return;
    }

    this.selectedFaceIndex = null;
    this.selectedFaceIndicesSet.clear();
    this.selectedEdgesSet.clear();
    this.selectedIndicesSet.clear();
    this.selectedIndicesSet.add(vertexIndex);
    this.activeVertexIndex = vertexIndex;
    this.notifySelectionChange();
  }

  public restoreSelection(
    selectedIndices: readonly number[],
    activeVertexIndex: number | null,
    selectedEdges?: readonly [number, number][]
  ): void {
    this.selectedFaceIndex = null;
    this.selectedFaceIndicesSet.clear();
    this.selectedEdgesSet.clear();
    this.selectedIndicesSet.clear();
    for (const index of selectedIndices) {
      this.selectedIndicesSet.add(index);
    }
    if (selectedEdges) {
      for (const edge of selectedEdges) {
        this.selectedEdgesSet.add(this.edgeToKey(edge));
      }
    }
    this.activeVertexIndex = activeVertexIndex;
    this.notifySelectionChange();
  }

  public toggleSelect(vertexIndex: number): void {
    this.selectedFaceIndex = null;
    this.selectedFaceIndicesSet.clear();
    if (this.selectedIndicesSet.has(vertexIndex)) {
      this.selectedIndicesSet.delete(vertexIndex);
      if (this.activeVertexIndex === vertexIndex) {
        const remainingIndices = Array.from(this.selectedIndicesSet);
        this.activeVertexIndex =
          remainingIndices.length > 0
            ? (remainingIndices[0] as number)
            : null;
      }
    } else {
      this.selectedIndicesSet.add(vertexIndex);
      this.activeVertexIndex = vertexIndex;
    }
    this.notifySelectionChange();
  }

  public selectFace(
    faceIndex: number,
    faceVertexIndices: readonly number[]
  ): void {
    if (
      this.selectedFaceIndex === faceIndex &&
      this.selectedFaceIndicesSet.size === 1
    ) {
      this.clearSelection();
      return;
    }
    this.selectedFaceIndex = faceIndex;
    this.selectedFaceIndicesSet.clear();
    this.selectedFaceIndicesSet.add(faceIndex);
    this.selectedEdgesSet.clear();
    this.selectedIndicesSet.clear();
    for (const index of faceVertexIndices) {
      this.selectedIndicesSet.add(index);
    }
    this.activeVertexIndex =
      faceVertexIndices.length > 0 ? (faceVertexIndices[0] as number) : null;
    this.notifySelectionChange();
  }

  public toggleFaceSelection(
    faceIndex: number,
    faceVertexIndices: readonly number[]
  ): void {
    this.selectedEdgesSet.clear();
    if (this.selectedFaceIndicesSet.has(faceIndex)) {
      this.selectedFaceIndicesSet.delete(faceIndex);
      if (this.selectedFaceIndex === faceIndex) {
        const remaining = Array.from(this.selectedFaceIndicesSet);
        this.selectedFaceIndex = remaining.length > 0 ? remaining[0] : null;
      }
    } else {
      this.selectedFaceIndicesSet.add(faceIndex);
      this.selectedFaceIndex = faceIndex;
      for (const index of faceVertexIndices) {
        this.selectedIndicesSet.add(index);
      }
      this.activeVertexIndex = faceVertexIndices[0] ?? null;
    }
    this.notifySelectionChange();
  }

  public getSelectedFaceIndex(): number | null {
    return this.selectedFaceIndex;
  }

  public getSelectedFaceIndices(): readonly number[] {
    return Array.from(this.selectedFaceIndicesSet);
  }

  public setActiveVertex(vertexIndex: number | null): void {
    this.activeVertexIndex = vertexIndex;
    if (vertexIndex !== null) {
      this.selectedIndicesSet.add(vertexIndex);
    }
    this.notifySelectionChange();
  }

  public clearSelection(): void {
    this.selectedFaceIndex = null;
    this.selectedFaceIndicesSet.clear();
    this.selectedEdgesSet.clear();
    this.selectedIndicesSet.clear();
    this.activeVertexIndex = null;
    this.notifySelectionChange();
  }

  private edgeToKey(edge: [number, number]): string {
    const lower = Math.min(edge[0], edge[1]);
    const higher = Math.max(edge[0], edge[1]);
    return `${lower}_${higher}`;
  }

  private keyToEdge(key: string): [number, number] {
    const parts = key.split("_");
    return [Number(parts[0]), Number(parts[1])];
  }

  private notifySelectionChange(): void {
    this.stateNotifier.notify("SELECTION_CHANGED", {
      selectedIndices: this.getSelectedIndices(),
      activeVertexIndex: this.activeVertexIndex,
      selectedFaceIndex: this.selectedFaceIndex,
      selectedFaceIndices: this.getSelectedFaceIndices(),
      selectedEdges: this.getSelectedEdges(),
    });
  }
}
