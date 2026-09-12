import { MeshGeometry } from "./MeshGeometry";
import { ModelFactory } from "./ModelFactory";
import { ObjParser, ParsedObjResult } from "./ObjParser";
import { ObjExporter, ExportedImageFile } from "./ObjExporter";
import { MtlParser } from "./MtlParser";
import { Material3D } from "../MaterialService/Material3D";
import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";
import { DecalPlane } from "../DecalService/DecalPlane";
import { Vector3D } from "../../Common/Vector3D";

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
  ): ParsedObjResult {
    try {
      const parsedResult = this.objParser.parse(
        fileContent,
        fileName,
        materials
      );

      const boundingBox = parsedResult.model.calculateBoundingBox();
      const extentX =
        boundingBox.maximum.coordinateX - boundingBox.minimum.coordinateX;
      const extentY =
        boundingBox.maximum.coordinateY - boundingBox.minimum.coordinateY;
      const extentZ =
        boundingBox.maximum.coordinateZ - boundingBox.minimum.coordinateZ;
      const currentMaxDimension = Math.max(extentX, extentY, extentZ);
      const centerPoint = parsedResult.model.calculateCenter();
      const centeringOffset = new Vector3D(
        -centerPoint.coordinateX,
        -centerPoint.coordinateY,
        -centerPoint.coordinateZ
      );
      const scalingFactor =
        currentMaxDimension > 0.000001 ? 2.0 / currentMaxDimension : 1.0;

      this.currentModel = parsedResult.model.fitToDimension(2.0);

      let fittedDecals = parsedResult.decals;
      if (parsedResult.decals.length > 0) {
        fittedDecals = parsedResult.decals.map((decal) =>
          decal
            .translate(centeringOffset)
            .scale(scalingFactor, new Vector3D(0, 0, 0))
        );
      }

      this.stateNotifier.notify("MODEL_CHANGED", this.currentModel);
      return {
        model: this.currentModel,
        decals: fittedDecals,
      };
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error
          ? parseError.message
          : "Unsupported error";
      this.stateNotifier.notify("ERROR_OCCURRED", errorMessage);
      throw parseError;
    }
  }

  public exportToObj(
    materials?: readonly Material3D[],
    decals?: readonly DecalPlane[],
    baseModelName: string = "model"
  ): string {
    return this.objExporter.export(
      this.currentModel,
      materials,
      decals,
      baseModelName
    );
  }

  public exportMtl(
    materials: readonly Material3D[],
    baseModelName: string = "model"
  ): string {
    return this.objExporter.exportMtl(materials, baseModelName);
  }

  public exportImages(
    materials: readonly Material3D[],
    baseModelName: string = "model"
  ): readonly ExportedImageFile[] {
    return this.objExporter.exportImages(materials, baseModelName);
  }

  public resetToStarterModel(): void {
    this.currentModel = this.modelFactory.createStarterCube();
    this.stateNotifier.notify("MODEL_CHANGED", this.currentModel);
  }
}
