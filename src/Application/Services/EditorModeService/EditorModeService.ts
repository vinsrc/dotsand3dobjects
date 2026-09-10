import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";

export type UiMode =
  | "DEFAULT"
  | "MULTI_SELECT"
  | "TRANSLATE"
  | "INSERT"
  | "FILL";

export class EditorModeService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private currentMode: UiMode;
  private autoConnectEnabled: boolean;

  public constructor(stateNotifier: ApplicationStateNotifier) {
    this.stateNotifier = stateNotifier;
    this.currentMode = "DEFAULT";
    this.autoConnectEnabled = false;
  }

  public getMode(): UiMode {
    return this.currentMode;
  }

  public setMode(targetMode: UiMode, isOrthographic: boolean): boolean {
    if (targetMode === "TRANSLATE" && !isOrthographic) {
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
}
