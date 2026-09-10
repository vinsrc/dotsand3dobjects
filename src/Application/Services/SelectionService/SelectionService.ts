import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";

export class SelectionService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private readonly selectedIndicesSet: Set<number>;
  private activeVertexIndex: number | null;

  public constructor(stateNotifier: ApplicationStateNotifier) {
    this.stateNotifier = stateNotifier;
    this.selectedIndicesSet = new Set();
    this.activeVertexIndex = null;
  }

  public selectSingle(vertexIndex: number): void {
    if (this.selectedIndicesSet.size === 1 && this.selectedIndicesSet.has(vertexIndex)) {
      this.clearSelection();
      return;
    }
    this.selectedIndicesSet.clear();
    this.selectedIndicesSet.add(vertexIndex);
    this.activeVertexIndex = vertexIndex;
    this.notifySelectionChange();
  }

  public restoreSelection(
    selectedIndices: readonly number[],
    activeVertexIndex: number | null
  ): void {
    this.selectedIndicesSet.clear();
    for (const index of selectedIndices) {
      this.selectedIndicesSet.add(index);
    }
    this.activeVertexIndex = activeVertexIndex;
    this.notifySelectionChange();
  }

  public toggleSelect(vertexIndex: number): void {
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

  public setActiveVertex(vertexIndex: number | null): void {
    this.activeVertexIndex = vertexIndex;
    if (vertexIndex !== null) {
      this.selectedIndicesSet.add(vertexIndex);
    }
    this.notifySelectionChange();
  }

  public clearSelection(): void {
    this.selectedIndicesSet.clear();
    this.activeVertexIndex = null;
    this.notifySelectionChange();
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

  private notifySelectionChange(): void {
    this.stateNotifier.notify("SELECTION_CHANGED", {
      selectedIndices: this.getSelectedIndices(),
      activeVertexIndex: this.activeVertexIndex,
    });
  }
}
