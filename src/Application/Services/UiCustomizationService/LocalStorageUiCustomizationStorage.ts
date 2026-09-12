import { UiCustomizationStorage } from "./UiCustomizationStorage";
import { UiCustomizationSettings, DockSide } from "./UiCustomizationService";

export class LocalStorageUiCustomizationStorage
  implements UiCustomizationStorage
{
  private readonly storageKey: string;

  public constructor(
    storageKey: string = "wireframevibe3d_ui_customization"
  ) {
    this.storageKey = storageKey;
  }

  public load(): UiCustomizationSettings | null {
    try {
      if (typeof localStorage === "undefined") {
        return null;
      }
      const rawData = localStorage.getItem(this.storageKey);
      if (!rawData) {
        return null;
      }
      const parsed = JSON.parse(rawData);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      const sideToolBarDock: DockSide =
        parsed.sideToolBarDock === "left" ? "left" : "right";
      const materialLibraryDock: DockSide =
        parsed.materialLibraryDock === "left" ? "left" : "right";
      const edgeLineWidth =
        typeof parsed.edgeLineWidth === "number" &&
        parsed.edgeLineWidth >= 1 &&
        parsed.edgeLineWidth <= 10
          ? parsed.edgeLineWidth
          : 2;

      return {
        sideToolBarDock,
        materialLibraryDock,
        edgeLineWidth,
      };
    } catch {
      return null;
    }
  }

  public save(settings: UiCustomizationSettings): void {
    try {
      if (typeof localStorage === "undefined") {
        return;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch {
      // Gracefully handle storage errors (e.g. quota exceeded or storage disabled)
    }
  }
}
