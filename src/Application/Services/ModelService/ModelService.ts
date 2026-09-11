import { MeshGeometry } from "./MeshGeometry";
import { ModelFactory } from "./ModelFactory";
import { ObjParser } from "./ObjParser";
import { ObjExporter } from "./ObjExporter";
import { MtlParser } from "./MtlParser";
import { Material3D } from "../MaterialService/Material3D";
import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";

export class ModelService {
  private readonly modelFactory: ModelFactory;
  private readonly objParser: ObjParser;
  private readonly objExporter: ObjExporter;
  private readonly mtlParser: MtlParser;
  private readonly stateNotifier: ApplicationStateNotifier;
  private currentModel: MeshGeometry;

  public constructor(
    modelFactory: ModelFactory,
    objParser: ObjParser,
    objExporter: ObjExporter,
    stateNotifier: ApplicationStateNotifier,
    mtlParser?: MtlParser,
    initialModel?: MeshGeometry
  ) {
    this.modelFactory = modelFactory;
    this.objParser = objParser;
    this.objExporter = objExporter;
    this.stateNotifier = stateNotifier;
    this.mtlParser = mtlParser ?? new MtlParser();
    this.currentModel =
      initialModel ?? this.modelFactory.createStarterCube();
  }

  public getCurrentModel(): MeshGeometry {
    return this.currentModel;
  }

  public setCurrentModel(newModel: MeshGeometry): void {
    this.currentModel = newModel;
    this.stateNotifier.notify("MODEL_CHANGED", this.currentModel);
  }

  public parseMtl(fileContent: string): readonly Material3D[] {
    return this.mtlParser.parse(fileContent);
  }

  public loadFromObj(
    fileContent: string,
    fileName?: string,
    materials?: readonly Material3D[]
  ): void {
    try {
      const parsedGeometry = this.objParser.parse(
        fileContent,
        fileName,
        materials
      );
      this.currentModel = parsedGeometry.fitToDimension(2.0);
      this.stateNotifier.notify("MODEL_CHANGED", this.currentModel);
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error
          ? parseError.message
          : "Unsupported error";
      this.stateNotifier.notify("ERROR_OCCURRED", errorMessage);
      throw parseError;
    }
  }

  public exportToObj(materials?: readonly Material3D[]): string {
    return this.objExporter.export(this.currentModel, materials);
  }

  public exportMtl(materials: readonly Material3D[]): string {
    return this.objExporter.exportMtl(materials);
  }

  public resetToStarterModel(): void {
    this.currentModel = this.modelFactory.createStarterCube();
    this.stateNotifier.notify("MODEL_CHANGED", this.currentModel);
  }
}
