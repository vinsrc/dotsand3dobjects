import { MeshGeometry } from "../ModelService/MeshGeometry";
import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";
import { DecalPlane } from "../DecalService/DecalPlane";

export interface EditorStateSnapshot {
  readonly model: MeshGeometry;
  readonly selectedIndices: readonly number[];
  readonly activeVertexIndex: number | null;
  readonly decals?: readonly DecalPlane[];
  readonly selectedDecalId?: string | null;
}

export class UndoRedoService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private readonly maxStackSize: number;
  private readonly undoStack: EditorStateSnapshot[];
  private readonly redoStack: EditorStateSnapshot[];

  public constructor(
    stateNotifier: ApplicationStateNotifier,
    maxStackSize: number = 50
  ) {
    this.stateNotifier = stateNotifier;
    this.maxStackSize = maxStackSize;
    this.undoStack = [];
    this.redoStack = [];
  }

  public recordSnapshot(snapshot: EditorStateSnapshot): void {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
    this.notifyStateChange();
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(currentSnapshot: EditorStateSnapshot): EditorStateSnapshot | null {
    if (!this.canUndo()) {
      return null;
    }

    const previousSnapshot = this.undoStack.pop();
    if (!previousSnapshot) {
      return null;
    }

    this.redoStack.push(currentSnapshot);
    this.notifyStateChange();
    return previousSnapshot;
  }

  public redo(currentSnapshot: EditorStateSnapshot): EditorStateSnapshot | null {
    if (!this.canRedo()) {
      return null;
    }

    const nextSnapshot = this.redoStack.pop();
    if (!nextSnapshot) {
      return null;
    }

    this.undoStack.push(currentSnapshot);
    this.notifyStateChange();
    return nextSnapshot;
  }

  public clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.stateNotifier.notify("UNDO_REDO_STATE_CHANGED", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });
  }
}
