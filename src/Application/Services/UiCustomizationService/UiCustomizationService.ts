import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";

export type DockSide = "left" | "right";

export interface UiCustomizationSettings {
  readonly sideToolBarDock: DockSide;
  readonly materialLibraryDock: DockSide;
  readonly edgeLineWidth: number;
}

export class UiCustomizationService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private sideToolBarDock: DockSide;
  private materialLibraryDock: DockSide;
  private edgeLineWidth: number;

  public constructor(
    stateNotifier: ApplicationStateNotifier,
    initialSideToolBarDock: DockSide = "right",
    initialMaterialLibraryDock: DockSide = "right",
    initialEdgeLineWidth: number = 2
  ) {
    this.stateNotifier = stateNotifier;
    this.sideToolBarDock = initialSideToolBarDock;
    this.materialLibraryDock = initialMaterialLibraryDock;
    this.edgeLineWidth = initialEdgeLineWidth;
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

  public getEdgeLineWidth(): number {
    return this.edgeLineWidth;
  }

  public setEdgeLineWidth(lineWidth: number): void {
    if (this.edgeLineWidth !== lineWidth) {
      this.edgeLineWidth = lineWidth;
      this.stateNotifier.notify("UI_CUSTOMIZATION_CHANGED", this.getSettings());
    }
  }

  public setCustomization(
    sideToolBarDock: DockSide,
    materialLibraryDock: DockSide,
    edgeLineWidth?: number
  ): void {
    const resolvedEdgeLineWidth =
      edgeLineWidth !== undefined ? edgeLineWidth : this.edgeLineWidth;
    const hasChanged =
      this.sideToolBarDock !== sideToolBarDock ||
      this.materialLibraryDock !== materialLibraryDock ||
      this.edgeLineWidth !== resolvedEdgeLineWidth;

    this.sideToolBarDock = sideToolBarDock;
    this.materialLibraryDock = materialLibraryDock;
    this.edgeLineWidth = resolvedEdgeLineWidth;

    if (hasChanged) {
      this.stateNotifier.notify("UI_CUSTOMIZATION_CHANGED", this.getSettings());
    }
  }

  public getSettings(): UiCustomizationSettings {
    return {
      sideToolBarDock: this.sideToolBarDock,
      materialLibraryDock: this.materialLibraryDock,
      edgeLineWidth: this.edgeLineWidth,
    };
  }
}
