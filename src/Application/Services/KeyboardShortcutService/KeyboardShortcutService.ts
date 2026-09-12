import { AppController } from "../../Controllers/AppController";
import { UiMode } from "../EditorModeService/EditorModeService";

/**
 * Maps keyboard shortcut keys to application actions.
 * Guards mirror the exact enable/disable conditions of the corresponding toolbar buttons.
 */
export class KeyboardShortcutService {
  private readonly controller: AppController;
  private readonly actionMap: Map<string, () => void>;
  private previousModeBeforeShift: UiMode | null = null;
  private isShiftActive: boolean = false;

  public constructor(controller: AppController) {
    this.controller = controller;
    this.actionMap = this.buildActionMap();
  }

  /**
   * Processes a keydown event. Returns true if the key was consumed.
   * @param key - The keyboard key string (already normalised to upper-case by the caller).
   * @param isRepeat - Whether this is an auto-repeated keydown event.
   */
  public handleKeyDown(key: string, isRepeat: boolean = false): boolean {
    if (key === "SHIFT") {
      if (isRepeat) {
        return true;
      }
      return this.handleShiftDown();
    }
    const action = this.actionMap.get(key);
    if (!action) {
      return false;
    }
    action();
    return true;
  }

  /**
   * Processes a keyup event. Returns true if the key was consumed.
   * @param key - The keyboard key string (already normalised to upper-case by the caller).
   */
  public handleKeyUp(key: string): boolean {
    if (key === "SHIFT") {
      return this.handleShiftUp();
    }
    return false;
  }

  private buildActionMap(): Map<string, () => void> {
    return new Map<string, () => void>([
      ["A", () => this.toggleMode("INSERT")],
      ["D", () => this.toggleMode("TRANSLATE")],
      ["F", () => this.toggleMode("FILL")],
      ["E", () => this.controller.clearSelection()],
      ["Q", () => this.handleAutoConnect()],
      ["G", () => this.handleFaceFill()],
      ["ESCAPE", () => this.controller.finishMode()],
    ]);
  }

  private handleShiftDown(): boolean {
    if (this.isShiftActive) {
      return true;
    }
    const currentMode = this.controller.getEditorModeService().getMode();
    if (currentMode === "MULTI_SELECT") {
      return false;
    }
    this.isShiftActive = true;
    this.previousModeBeforeShift = currentMode;
    this.controller.enterMode("MULTI_SELECT");
    return true;
  }

  private handleShiftUp(): boolean {
    if (!this.isShiftActive) {
      return false;
    }
    this.isShiftActive = false;
    const currentMode = this.controller.getEditorModeService().getMode();
    if (currentMode === "MULTI_SELECT") {
      if (
        this.previousModeBeforeShift &&
        this.previousModeBeforeShift !== "DEFAULT" &&
        this.previousModeBeforeShift !== "MULTI_SELECT"
      ) {
        const restored = this.controller.enterMode(this.previousModeBeforeShift);
        if (!restored) {
          this.controller.finishMode();
        }
      } else {
        this.controller.finishMode();
      }
    }
    this.previousModeBeforeShift = null;
    return true;
  }

  private toggleMode(mode: UiMode): void {
    const currentMode = this.controller.getEditorModeService().getMode();
    if (currentMode === mode) {
      this.controller.finishMode();
    } else {
      this.controller.enterMode(mode);
    }
  }

  private handleAutoConnect(): void {
    const currentMode = this.controller.getEditorModeService().getMode();
    if (currentMode !== "INSERT") {
      return;
    }
    this.controller.toggleAutoConnect();
  }

  private handleFaceFill(): void {
    if (this.controller.isDecalSelected()) {
      return;
    }
    const selectedCount = this.controller
      .getSelectionService()
      .getSelectedIndices().length;
    if (selectedCount < 3) {
      return;
    }
    this.controller.createFaceFromSelectedVertices();
  }
}