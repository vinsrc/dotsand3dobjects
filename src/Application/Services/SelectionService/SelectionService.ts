import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";

export class SelectionService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private readonly selectedIndicesSet: Set<number>;
  private readonly selectedFaceIndicesSet: Set<number>;
  private selectedFaceIndex: number | null;
  private activeVertexIndex: number | null;

  public constructor(stateNotifier: ApplicationStateNotifier) {
    this.stateNotifier = stateNotifier;
    this.selectedIndicesSet = new Set();
    this.selectedFaceIndicesSet = new Set();
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
    this.selectedIndicesSet.clear();
    this.selectedIndicesSet.add(vertexIndex);
    this.activeVertexIndex = vertexIndex;
    this.notifySelectionChange();
  }

  public restoreSelection(
    selectedIndices: readonly number[],
    activeVertexIndex: number | null
  ): void {
    this.selectedFaceIndex = null;
    this.selectedFaceIndicesSet.clear();
    this.selectedIndicesSet.clear();
    for (const index of selectedIndices) {
      this.selectedIndicesSet.add(index);
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
    this.selectedIndicesSet.clear();
    this.activeVertexIndex = null;
    this.notifySelectionChange();
  }

  private notifySelectionChange(): void {
    this.stateNotifier.notify("SELECTION_CHANGED", {
      selectedIndices: this.getSelectedIndices(),
      activeVertexIndex: this.activeVertexIndex,
      selectedFaceIndex: this.selectedFaceIndex,
      selectedFaceIndices: this.getSelectedFaceIndices(),
    });
  }
}
