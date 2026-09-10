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
});
