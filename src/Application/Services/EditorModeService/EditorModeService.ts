import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";

export type UiMode =
  | "DEFAULT"
  | "MULTI_SELECT"
  | "TRANSLATE"
  | "ROTATE"
  | "SCALE"
  | "INSERT"
  | "FILL";

export class EditorModeService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private currentMode: UiMode;
  private autoConnectEnabled: boolean;
  private gridSnapEnabled: boolean;

  public constructor(stateNotifier: ApplicationStateNotifier) {
    this.stateNotifier = stateNotifier;
    this.currentMode = "DEFAULT";
    this.autoConnectEnabled = false;
    this.gridSnapEnabled = true;
  }

  public getMode(): UiMode {
    return this.currentMode;
  }

  public setMode(targetMode: UiMode, isOrthographic: boolean): boolean {
    if (
      (targetMode === "TRANSLATE" ||
        targetMode === "ROTATE" ||
        targetMode === "SCALE") &&
      !isOrthographic
    ) {
      this.stateNotifier.notify(
        "ERROR_OCCURRED",
        "Switch to an Orthographic view"
      );
      return false;
    }

    this.currentMode = targetMode;
    this.stateNotifier.notify("MODE_CHANGED", this.currentMode);
    return true;
  }

  public finishMode(): void {
    this.currentMode = "DEFAULT";
    this.stateNotifier.notify("MODE_CHANGED", this.currentMode);
  }

  public isAutoConnectEnabled(): boolean {
    return this.autoConnectEnabled;
  }

  public toggleAutoConnect(): void {
    this.autoConnectEnabled = !this.autoConnectEnabled;
    this.stateNotifier.notify(
      "AUTO_CONNECT_CHANGED",
      this.autoConnectEnabled
    );
  }

  public isGridSnapEnabled(): boolean {
    return this.gridSnapEnabled;
  }

  public toggleGridSnap(): void {
    this.gridSnapEnabled = !this.gridSnapEnabled;
    this.stateNotifier.notify("GRID_SNAP_CHANGED", this.gridSnapEnabled);
  }

  public setGridSnapEnabled(enabled: boolean): void {
    this.gridSnapEnabled = enabled;
    this.stateNotifier.notify("GRID_SNAP_CHANGED", this.gridSnapEnabled);
  }
}
