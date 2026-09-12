import { describe, it, expect, vi } from "vitest";
import { KeyboardShortcutService } from "../../../../src/Application/Services/KeyboardShortcutService/KeyboardShortcutService";
import { AppController } from "../../../../src/Application/Controllers/AppController";
import { EditorModeService } from "../../../../src/Application/Services/EditorModeService/EditorModeService";
import { SelectionService } from "../../../../src/Application/Services/SelectionService/SelectionService";

function makeMockController(
  currentMode: string = "DEFAULT",
  selectedCount: number = 0,
  autoConnectEnabled: boolean = false,
  decalSelected: boolean = false
): AppController {
  let mode = currentMode;

  const editorModeService = {
    getMode: vi.fn().mockImplementation(() => mode),
    isAutoConnectEnabled: vi.fn().mockReturnValue(autoConnectEnabled),
  } as unknown as EditorModeService;

  const selectionService = {
    getSelectedIndices: vi.fn().mockReturnValue(new Array(selectedCount).fill(0)),
  } as unknown as SelectionService;

  const controller = {
    getEditorModeService: vi.fn().mockReturnValue(editorModeService),
    getSelectionService: vi.fn().mockReturnValue(selectionService),
    isDecalSelected: vi.fn().mockReturnValue(decalSelected),
    enterMode: vi.fn().mockImplementation((newMode: string) => {
      mode = newMode;
      return true;
    }),
    finishMode: vi.fn().mockImplementation(() => {
      mode = "DEFAULT";
    }),
    toggleAutoConnect: vi.fn(),
    clearSelection: vi.fn(),
    createFaceFromSelectedVertices: vi.fn().mockReturnValue(true),
  } as unknown as AppController;

  return controller;
}

describe("KeyboardShortcutService", () => {
  describe("handleKeyDown — mode shortcuts", () => {
    it("should enter INSERT mode when A is pressed in DEFAULT mode", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("A");

      expect(consumed).toBe(true);
      expect(controller.enterMode).toHaveBeenCalledWith("INSERT");
    });

    it("should finish mode when A is pressed while already in INSERT mode", () => {
      const controller = makeMockController("INSERT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("A");

      expect(consumed).toBe(true);
      expect(controller.finishMode).toHaveBeenCalled();
    });

    it("should enter TRANSLATE mode when D is pressed in DEFAULT mode", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("D");

      expect(consumed).toBe(true);
      expect(controller.enterMode).toHaveBeenCalledWith("TRANSLATE");
    });

    it("should finish mode when D is pressed while already in TRANSLATE mode", () => {
      const controller = makeMockController("TRANSLATE");
      const service = new KeyboardShortcutService(controller);

      service.handleKeyDown("D");

      expect(controller.finishMode).toHaveBeenCalled();
    });

    it("should enter FILL mode when F is pressed in DEFAULT mode", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("F");

      expect(consumed).toBe(true);
      expect(controller.enterMode).toHaveBeenCalledWith("FILL");
    });

    it("should finish mode when F is pressed while already in FILL mode", () => {
      const controller = makeMockController("FILL");
      const service = new KeyboardShortcutService(controller);

      service.handleKeyDown("F");

      expect(controller.finishMode).toHaveBeenCalled();
    });

    it("should call finishMode when ESCAPE is pressed", () => {
      const controller = makeMockController("INSERT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("ESCAPE");

      expect(consumed).toBe(true);
      expect(controller.finishMode).toHaveBeenCalled();
    });
  });

  describe("Shift key — Multi selection press and release", () => {
    it("should turn on MULTI_SELECT when SHIFT is pressed, and turn off when SHIFT is released", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      // Press SHIFT
      const downConsumed = service.handleKeyDown("SHIFT");
      expect(downConsumed).toBe(true);
      expect(controller.enterMode).toHaveBeenCalledWith("MULTI_SELECT");

      // Release SHIFT
      const upConsumed = service.handleKeyUp("SHIFT");
      expect(upConsumed).toBe(true);
      expect(controller.finishMode).toHaveBeenCalled();
    });

    it("should ignore repeated SHIFT keydown events", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      service.handleKeyDown("SHIFT", false);
      expect(controller.enterMode).toHaveBeenCalledTimes(1);

      // Repeated keydown via isRepeat flag
      const repeatConsumed = service.handleKeyDown("SHIFT", true);
      expect(repeatConsumed).toBe(true);
      expect(controller.enterMode).toHaveBeenCalledTimes(1);

      // Direct call when isShiftActive is already true
      (service as any).isShiftActive = true;
      const directConsumed = (service as any).handleShiftDown();
      expect(directConsumed).toBe(true);
    });

    it("should restore previous mode when releasing SHIFT from another mode like INSERT", () => {
      const controller = makeMockController("INSERT");
      const service = new KeyboardShortcutService(controller);

      // Press SHIFT while in INSERT
      service.handleKeyDown("SHIFT");
      expect(controller.enterMode).toHaveBeenCalledWith("MULTI_SELECT");

      // Release SHIFT
      service.handleKeyUp("SHIFT");
      expect(controller.enterMode).toHaveBeenCalledWith("INSERT");
    });

    it("should return false if SHIFT is released when it was not active", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyUp("SHIFT");
      expect(consumed).toBe(false);
    });

    it("should return false if SHIFT is pressed when already in MULTI_SELECT mode", () => {
      const controller = makeMockController("MULTI_SELECT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("SHIFT");
      expect(consumed).toBe(false);
    });

    it("should fallback to finishMode if restoring previous mode fails", () => {
      const controller = makeMockController("INSERT");
      let currentMode = "INSERT";
      (controller.getEditorModeService().getMode as any).mockImplementation(() => currentMode);
      (controller.enterMode as any).mockImplementation((m: string) => {
        if (m === "MULTI_SELECT") {
          currentMode = "MULTI_SELECT";
          return true;
        }
        return false; // fails to restore INSERT
      });
      const service = new KeyboardShortcutService(controller);

      service.handleKeyDown("SHIFT");
      service.handleKeyUp("SHIFT");

      expect(controller.finishMode).toHaveBeenCalled();
    });

    it("should return false for unknown keyup events", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      expect(service.handleKeyUp("A")).toBe(false);
      expect(service.handleKeyUp("ENTER")).toBe(false);
    });
  });

  describe("handleKeyDown — E (Clear Selection)", () => {
    it("should call clearSelection when E is pressed", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("E");

      expect(consumed).toBe(true);
      expect(controller.clearSelection).toHaveBeenCalled();
    });
  });

  describe("handleKeyDown — Q (Auto Connect)", () => {
    it("should toggle auto connect when Q is pressed in INSERT mode", () => {
      const controller = makeMockController("INSERT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("Q");

      expect(consumed).toBe(true);
      expect(controller.toggleAutoConnect).toHaveBeenCalled();
    });

    it("should NOT toggle auto connect when Q is pressed outside INSERT mode", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("Q");

      // Key is consumed (returns true) but the action does nothing
      expect(consumed).toBe(true);
      expect(controller.toggleAutoConnect).not.toHaveBeenCalled();
    });

    it("should NOT toggle auto connect when Q is pressed in FILL mode", () => {
      const controller = makeMockController("FILL");
      const service = new KeyboardShortcutService(controller);

      service.handleKeyDown("Q");

      expect(controller.toggleAutoConnect).not.toHaveBeenCalled();
    });
  });

  describe("handleKeyDown — G (Face Fill)", () => {
    it("should create face when G is pressed with 3+ vertices selected in DEFAULT mode", () => {
      const controller = makeMockController("DEFAULT", 3);
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("G");

      expect(consumed).toBe(true);
      expect(controller.createFaceFromSelectedVertices).toHaveBeenCalled();
    });

    it("should create face when G is pressed with 3+ vertices selected in FILL mode", () => {
      const controller = makeMockController("FILL", 4);
      const service = new KeyboardShortcutService(controller);

      const consumed = service.handleKeyDown("G");

      expect(consumed).toBe(true);
      expect(controller.createFaceFromSelectedVertices).toHaveBeenCalled();
    });

    it("should NOT create face when G is pressed with fewer than 3 vertices", () => {
      const controller = makeMockController("DEFAULT", 2);
      const service = new KeyboardShortcutService(controller);

      service.handleKeyDown("G");

      expect(controller.createFaceFromSelectedVertices).not.toHaveBeenCalled();
    });

    it("should NOT create face when G is pressed when a decal is selected", () => {
      const controller = makeMockController("DEFAULT", 4, false, true);
      const service = new KeyboardShortcutService(controller);

      service.handleKeyDown("G");

      expect(controller.createFaceFromSelectedVertices).not.toHaveBeenCalled();
    });
  });

  describe("handleKeyDown — unknown keys", () => {
    it("should return false for unregistered keys including former W shortcut", () => {
      const controller = makeMockController("DEFAULT");
      const service = new KeyboardShortcutService(controller);

      expect(service.handleKeyDown("W")).toBe(false);
      expect(service.handleKeyDown("Z")).toBe(false);
      expect(service.handleKeyDown("1")).toBe(false);
      expect(service.handleKeyDown("ARROWUP")).toBe(false);
    });
  });
});