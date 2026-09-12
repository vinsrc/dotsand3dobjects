import { describe, it, expect, vi } from "vitest";
import { SelectionService } from "../../../../src/Application/Services/SelectionService/SelectionService";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";

describe("SelectionService", () => {
  it("should initialize with empty selection and null active vertex", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    expect(service.getSelectedIndices().length).toBe(0);
    expect(service.getActiveVertex()).toBeNull();
    expect(service.isSelected(0)).toBe(false);
  });

  it("should select single vertex and update active vertex", () => {
    const notifier = new ApplicationStateNotifier();
    const listener = vi.fn();
    notifier.subscribe("SELECTION_CHANGED", listener);

    const service = new SelectionService(notifier);
    service.selectSingle(3);

    expect(service.getSelectedIndices()).toEqual([3]);
    expect(service.isSelected(3)).toBe(true);
    expect(service.isSelected(0)).toBe(false);
    expect(service.getActiveVertex()).toBe(3);
    expect(listener).toHaveBeenCalledWith({
      selectedIndices: [3],
      activeVertexIndex: 3,
      selectedFaceIndex: null,
      selectedFaceIndices: [],
      selectedEdges: [],
    });

    // Selecting another single vertex replaces previous
    service.selectSingle(5);
    expect(service.getSelectedIndices()).toEqual([5]);
    expect(service.isSelected(3)).toBe(false);
    expect(service.isSelected(5)).toBe(true);
    expect(service.getActiveVertex()).toBe(5);
  });

  it("should toggle selection membership in multi-select", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.toggleSelect(1);
    expect(service.getSelectedIndices()).toEqual([1]);
    expect(service.getActiveVertex()).toBe(1);

    service.toggleSelect(4);
    expect(service.getSelectedIndices()).toEqual([1, 4]);
    expect(service.getActiveVertex()).toBe(4);

    // Toggling 4 off
    service.toggleSelect(4);
    expect(service.getSelectedIndices()).toEqual([1]);
    expect(service.getActiveVertex()).toBe(1);

    // Toggling 1 off
    service.toggleSelect(1);
    expect(service.getSelectedIndices()).toEqual([]);
    expect(service.getActiveVertex()).toBeNull();
  });

  it("should set and clear active vertex and clear entire selection", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.setActiveVertex(2);
    expect(service.getActiveVertex()).toBe(2);
    expect(service.isSelected(2)).toBe(true);

    service.clearSelection();
    expect(service.getSelectedIndices()).toEqual([]);
    expect(service.getActiveVertex()).toBeNull();
  });

  it("should deselect if the sole selected vertex is selected again", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.selectSingle(3);
    expect(service.getSelectedIndices()).toEqual([3]);

    // Second tap on the same single selected vertex deselects it
    service.selectSingle(3);
    expect(service.getSelectedIndices()).toEqual([]);
    expect(service.getActiveVertex()).toBeNull();
  });

  it("should isolate selection to single vertex if multiple were previously selected", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.toggleSelect(1);
    service.toggleSelect(2);
    expect(service.getSelectedIndices()).toEqual([1, 2]);

    service.selectSingle(2);
    expect(service.getSelectedIndices()).toEqual([2]);
    expect(service.getActiveVertex()).toBe(2);
  });

  it("should restore selection and active vertex", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.restoreSelection([2, 5], 5);
    expect(service.getSelectedIndices()).toEqual([2, 5]);
    expect(service.getActiveVertex()).toBe(5);
  });

  it("should handle setting active vertex to null without adding null to selection", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.selectSingle(1);
    expect(service.getActiveVertex()).toBe(1);

    service.setActiveVertex(null);
    expect(service.getActiveVertex()).toBeNull();
    expect(service.getSelectedIndices()).toEqual([1]);
  });

  it("should handle toggling a non-active selected vertex", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.toggleSelect(1); // active is 1
    service.toggleSelect(2); // active is 2
    expect(service.getActiveVertex()).toBe(2);

    // Toggle off 1 (which is NOT activeVertexIndex)
    service.toggleSelect(1);
    expect(service.getActiveVertex()).toBe(2);
    expect(service.getSelectedIndices()).toEqual([2]);
  });

  it("should select face, update selectedFaceIndex and its vertex indices", () => {
    const notifier = new ApplicationStateNotifier();
    const listener = vi.fn();
    notifier.subscribe("SELECTION_CHANGED", listener);

    const service = new SelectionService(notifier);
    expect(service.getSelectedFaceIndex()).toBeNull();

    service.selectFace(2, [0, 1, 2]);
    expect(service.getSelectedFaceIndex()).toBe(2);
    expect(service.getSelectedIndices()).toEqual([0, 1, 2]);
    expect(service.getActiveVertex()).toBe(0);
    expect(listener).toHaveBeenCalledWith({
      selectedIndices: [0, 1, 2],
      activeVertexIndex: 0,
      selectedFaceIndex: 2,
      selectedFaceIndices: [2],
      selectedEdges: [],
    });

    // Selecting single vertex clears face selection
    service.selectSingle(1);
    expect(service.getSelectedFaceIndex()).toBeNull();

    // Selecting face and then selecting same face deselects it
    service.selectFace(1, [3, 4, 5]);
    expect(service.getSelectedFaceIndex()).toBe(1);
    service.selectFace(1, [3, 4, 5]);
    expect(service.getSelectedFaceIndex()).toBeNull();
    expect(service.getSelectedIndices()).toEqual([]);

    // Selecting face and then clearing selection clears face selection
    service.selectFace(1, [3, 4, 5]);
    expect(service.getSelectedFaceIndex()).toBe(1);
    service.clearSelection();
    expect(service.getSelectedFaceIndex()).toBeNull();
  });

  it("should toggle face selection in multi-select mode", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.toggleFaceSelection(0, [0, 1, 2]);
    expect(service.getSelectedFaceIndices()).toEqual([0]);
    expect(service.getSelectedFaceIndex()).toBe(0);

    service.toggleFaceSelection(1, [3, 4, 5]);
    expect(service.getSelectedFaceIndices()).toEqual([0, 1]);
    expect(service.getSelectedFaceIndex()).toBe(1);

    // Toggling face 1 again removes it
    service.toggleFaceSelection(1, [3, 4, 5]);
    expect(service.getSelectedFaceIndices()).toEqual([0]);
    expect(service.getSelectedFaceIndex()).toBe(0);

    // Toggling face 0 removes it, making selection empty
    service.toggleFaceSelection(0, [0, 1, 2]);
    expect(service.getSelectedFaceIndices()).toEqual([]);
    expect(service.getSelectedFaceIndex()).toBeNull();
  });

  it("should select single edge and toggle selection on repeat", () => {
    const notifier = new ApplicationStateNotifier();
    const listener = vi.fn();
    notifier.subscribe("SELECTION_CHANGED", listener);

    const service = new SelectionService(notifier);
    expect(service.getSelectedEdges()).toEqual([]);

    service.selectEdge([0, 1]);
    expect(service.getSelectedEdges()).toEqual([[0, 1]]);
    expect(service.isEdgeSelected([0, 1])).toBe(true);
    expect(service.isEdgeSelected([1, 0])).toBe(true);
    expect(service.isEdgeSelected([1, 2])).toBe(false);
    expect(service.getSelectedIndices()).toEqual([]);
    expect(service.getSelectedFaceIndex()).toBeNull();
    expect(listener).toHaveBeenCalledWith({
      selectedIndices: [],
      activeVertexIndex: null,
      selectedFaceIndex: null,
      selectedFaceIndices: [],
      selectedEdges: [[0, 1]],
    });

    // Second click on the same edge deselects it
    service.selectEdge([1, 0]);
    expect(service.getSelectedEdges()).toEqual([]);
  });

  it("should toggle edge selection in multi-select mode", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.toggleEdgeSelection([0, 1]);
    expect(service.getSelectedEdges()).toEqual([[0, 1]]);

    service.toggleEdgeSelection([2, 3]);
    expect(service.getSelectedEdges().length).toBe(2);
    expect(service.isEdgeSelected([0, 1])).toBe(true);
    expect(service.isEdgeSelected([2, 3])).toBe(true);

    // Toggle off [0, 1]
    service.toggleEdgeSelection([1, 0]);
    expect(service.getSelectedEdges()).toEqual([[2, 3]]);

    // Clear selection clears edges
    service.clearSelection();
    expect(service.getSelectedEdges()).toEqual([]);
  });

  it("should restore edge selection", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new SelectionService(notifier);

    service.restoreSelection([0], 0, [[1, 2], [3, 4]]);
    expect(service.getSelectedIndices()).toEqual([0]);
    expect(service.getSelectedEdges().length).toBe(2);
    expect(service.isEdgeSelected([1, 2])).toBe(true);
    expect(service.isEdgeSelected([3, 4])).toBe(true);
  });
});
