export type RenderMode = "WIREFRAME" | "FLAT_SHADED";

export class RenderModeService {
  private currentMode: RenderMode;

  public constructor(initialMode: RenderMode = "FLAT_SHADED") {
    this.currentMode = initialMode;
  }

  public getRenderMode(): RenderMode {
    return this.currentMode;
  }

  public setRenderMode(newMode: RenderMode): void {
    this.currentMode = newMode;
  }

  public toggleRenderMode(): RenderMode {
    this.currentMode =
      this.currentMode === "FLAT_SHADED" ? "WIREFRAME" : "FLAT_SHADED";
    return this.currentMode;
  }

  public isWireframe(): boolean {
    return this.currentMode === "WIREFRAME";
  }

  public isFlatShaded(): boolean {
    return this.currentMode === "FLAT_SHADED";
  }
}
