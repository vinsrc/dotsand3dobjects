import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";

export type DockSide = "left" | "right";

export interface UiCustomizationSettings {
  readonly sideToolBarDock: DockSide;
  readonly materialLibraryDock: DockSide;
}

export class UiCustomizationService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private sideToolBarDock: DockSide;
  private materialLibraryDock: DockSide;

  public constructor(
    stateNotifier: ApplicationStateNotifier,
    initialSideToolBarDock: DockSide = "right",
    initialMaterialLibraryDock: DockSide = "right"
  ) {
    this.stateNotifier = stateNotifier;
    this.sideToolBarDock = initialSideToolBarDock;
    this.materialLibraryDock = initialMaterialLibraryDock;
  }

  public getSideToolBarDock(): DockSide {
    return this.sideToolBarDock;
  }

  public setSideToolBarDock(dockSide: DockSide): void {
    if (this.sideToolBarDock !== dockSide) {
      this.sideToolBarDock = dockSide;
      this.stateNotifier.notify("UI_CUSTOMIZATION_CHANGED", this.getSettings());
    }
  }

  public getMaterialLibraryDock(): DockSide {
    return this.materialLibraryDock;
  }

  public setMaterialLibraryDock(dockSide: DockSide): void {
    if (this.materialLibraryDock !== dockSide) {
      this.materialLibraryDock = dockSide;
      this.stateNotifier.notify("UI_CUSTOMIZATION_CHANGED", this.getSettings());
    }
  }

  public setCustomization(
    sideToolBarDock: DockSide,
    materialLibraryDock: DockSide
  ): void {
    const hasChanged =
      this.sideToolBarDock !== sideToolBarDock ||
      this.materialLibraryDock !== materialLibraryDock;

    this.sideToolBarDock = sideToolBarDock;
    this.materialLibraryDock = materialLibraryDock;

    if (hasChanged) {
      this.stateNotifier.notify("UI_CUSTOMIZATION_CHANGED", this.getSettings());
    }
  }

  public getSettings(): UiCustomizationSettings {
    return {
      sideToolBarDock: this.sideToolBarDock,
      materialLibraryDock: this.materialLibraryDock,
    };
  }
}
