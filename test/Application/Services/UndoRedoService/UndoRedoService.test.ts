import { describe, it, expect } from "vitest";
import { UndoRedoService, EditorStateSnapshot } from "../../../../src/Application/Services/UndoRedoService/UndoRedoService";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";

describe("UndoRedoService", () => {
  const createTestSnapshot = (xVal: number, selected: number[] = []): EditorStateSnapshot => {
    return {
      model: new MeshGeometry([new Vector3D(xVal, 0, 0)]),
      selectedIndices: selected,
      activeVertexIndex: selected.length > 0 ? (selected[0] ?? null) : null,
    };
  };

  it("should initialize with empty undo and redo stacks", () => {
    const notifier = new ApplicationStateNotifier();
    const undoRedo = new UndoRedoService(notifier);

    expect(undoRedo.canUndo()).toBe(false);
    expect(undoRedo.canRedo()).toBe(false);
  });

  it("should record snapshots and allow undo and redo", () => {
    const notifier = new ApplicationStateNotifier();
    let lastNotifiedState: unknown = null;
    notifier.subscribe("UNDO_REDO_STATE_CHANGED", (payload) => {
      lastNotifiedState = payload;
    });

    const undoRedo = new UndoRedoService(notifier);

    const snapshot0 = createTestSnapshot(0);
    const snapshot1 = createTestSnapshot(1);
    const snapshot2 = createTestSnapshot(2);

    undoRedo.recordSnapshot(snapshot0);
    expect(undoRedo.canUndo()).toBe(true);
    expect(undoRedo.canRedo()).toBe(false);
    expect(lastNotifiedState).toEqual({ canUndo: true, canRedo: false });

    undoRedo.recordSnapshot(snapshot1);
    expect(undoRedo.canUndo()).toBe(true);

    // Undo from current state snapshot2
    const undoneTo1 = undoRedo.undo(snapshot2);
    expect(undoneTo1).toBe(snapshot1);
    expect(undoRedo.canUndo()).toBe(true);
    expect(undoRedo.canRedo()).toBe(true);

    // Undo again to snapshot0
    const undoneTo0 = undoRedo.undo(snapshot1);
    expect(undoneTo0).toBe(snapshot0);
    expect(undoRedo.canUndo()).toBe(false);
    expect(undoRedo.canRedo()).toBe(true);

    // Redo back to snapshot1
    const redoneTo1 = undoRedo.redo(snapshot0);
    expect(redoneTo1).toBe(snapshot1);
    expect(undoRedo.canUndo()).toBe(true);
    expect(undoRedo.canRedo()).toBe(true);

    // Redo back to snapshot2
    const redoneTo2 = undoRedo.redo(snapshot1);
    expect(redoneTo2).toBe(snapshot2);
    expect(undoRedo.canUndo()).toBe(true);
    expect(undoRedo.canRedo()).toBe(false);
  });

  it("should return null when undo or redo is not possible", () => {
    const notifier = new ApplicationStateNotifier();
    const undoRedo = new UndoRedoService(notifier);
    const snapshot0 = createTestSnapshot(0);

    expect(undoRedo.undo(snapshot0)).toBeNull();
    expect(undoRedo.redo(snapshot0)).toBeNull();
  });

  it("should clear redo stack when a new snapshot is recorded after an undo", () => {
    const notifier = new ApplicationStateNotifier();
    const undoRedo = new UndoRedoService(notifier);

    const snapshot0 = createTestSnapshot(0);
    const snapshot1 = createTestSnapshot(1);
    const snapshot2 = createTestSnapshot(2);
    const snapshotNew = createTestSnapshot(99);

    undoRedo.recordSnapshot(snapshot0);
    undoRedo.recordSnapshot(snapshot1);

    undoRedo.undo(snapshot2);
    expect(undoRedo.canRedo()).toBe(true);

    undoRedo.recordSnapshot(snapshotNew);
    expect(undoRedo.canRedo()).toBe(false);
  });

  it("should respect maxStackSize by dropping oldest snapshot", () => {
    const notifier = new ApplicationStateNotifier();
    const undoRedo = new UndoRedoService(notifier, 2);

    const snapshot0 = createTestSnapshot(0);
    const snapshot1 = createTestSnapshot(1);
    const snapshot2 = createTestSnapshot(2);

    undoRedo.recordSnapshot(snapshot0);
    undoRedo.recordSnapshot(snapshot1);
    undoRedo.recordSnapshot(snapshot2);

    // Only snapshot1 and snapshot2 should be in undoStack
    const popped1 = undoRedo.undo(createTestSnapshot(3));
    expect(popped1).toBe(snapshot2);

    const popped2 = undoRedo.undo(snapshot2);
    expect(popped2).toBe(snapshot1);

    expect(undoRedo.canUndo()).toBe(false);
  });

  it("should clear both undo and redo stacks when clear() is called", () => {
    const notifier = new ApplicationStateNotifier();
    const undoRedo = new UndoRedoService(notifier);

    undoRedo.recordSnapshot(createTestSnapshot(0));
    undoRedo.recordSnapshot(createTestSnapshot(1));
    undoRedo.undo(createTestSnapshot(2));

    expect(undoRedo.canUndo()).toBe(true);
    expect(undoRedo.canRedo()).toBe(true);

    undoRedo.clear();
    expect(undoRedo.canUndo()).toBe(false);
    expect(undoRedo.canRedo()).toBe(false);
  });

  it("should handle unexpected undefined elements in undo or redo stacks safely", () => {
    const notifier = new ApplicationStateNotifier();
    const undoRedo = new UndoRedoService(notifier);

    // Force an undefined into undoStack
    (undoRedo as unknown as { undoStack: unknown[] }).undoStack.push(undefined);
    expect(undoRedo.undo(createTestSnapshot(0))).toBeNull();

    // Force an undefined into redoStack
    (undoRedo as unknown as { redoStack: unknown[] }).redoStack.push(undefined);
    expect(undoRedo.redo(createTestSnapshot(0))).toBeNull();
  });
});
