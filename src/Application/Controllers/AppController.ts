import { ModelService } from "../Services/ModelService/ModelService";
import { CameraStateService } from "../Services/CameraService/CameraStateService";
import { RenderModeService } from "../Services/RenderModeService/RenderModeService";
import { ApplicationStateNotifier } from "../Common/ApplicationStateNotifier";
import { OrthographicAxis } from "../Services/CameraService/OrthographicViewStrategy";

export class AppController {
  private readonly modelService: ModelService;
  private readonly cameraStateService: CameraStateService;
  private readonly renderModeService: RenderModeService;
  private readonly stateNotifier: ApplicationStateNotifier;

  public constructor(
    modelService: ModelService,
    cameraStateService: CameraStateService,
    renderModeService: RenderModeService,
    stateNotifier: ApplicationStateNotifier
  ) {
    this.modelService = modelService;
    this.cameraStateService = cameraStateService;
    this.renderModeService = renderModeService;
    this.stateNotifier = stateNotifier;
  }

  public getModelService(): ModelService {
    return this.modelService;
  }

  public getCameraStateService(): CameraStateService {
    return this.cameraStateService;
  }

  public getRenderModeService(): RenderModeService {
    return this.renderModeService;
  }

  public getStateNotifier(): ApplicationStateNotifier {
    return this.stateNotifier;
  }

  public loadModelFromFile(fileName: string, fileContent: string): void {
    try {
      this.modelService.loadFromObj(fileContent, fileName);
      const boundingRadius = this.modelService
        .getCurrentModel()
        .calculateBoundingRadius();
      this.cameraStateService.fitToRadius(boundingRadius);
      this.cameraStateService.setTargetPoint(
        this.modelService.getCurrentModel().calculateCenter()
      );
      this.stateNotifier.notify("VIEW_CHANGED");
    } catch (caughtError) {
      // Notification is already dispatched by ModelService
    }
  }

  public exportModelToFile(): string {
    return this.modelService.exportToObj();
  }

  public toggleRenderMode(): void {
    this.renderModeService.toggleRenderMode();
    this.stateNotifier.notify("RENDER_MODE_CHANGED");
  }

  public selectOrthographicView(axisIdentifier: OrthographicAxis): void {
    this.cameraStateService.setOrthographicAxis(axisIdentifier);
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public rotateCamera(deltaAzimuth: number, deltaElevation: number): void {
    this.cameraStateService.orbit(deltaAzimuth, deltaElevation);
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public zoomIn(): void {
    this.cameraStateService.zoomIn();
    this.stateNotifier.notify("VIEW_CHANGED");
  }

  public zoomOut(): void {
    this.cameraStateService.zoomOut();
    this.stateNotifier.notify("VIEW_CHANGED");
  }
}
