import { Vector3D } from "../../Common/Vector3D";
import { MeshGeometry } from "../ModelService/MeshGeometry";
import { ModelService } from "../ModelService/ModelService";
import { SelectionService } from "../SelectionService/SelectionService";
import { GridPlaneType } from "../CameraService/ViewStrategy";
import { GeometryEditorService } from "../GeometryEditorService/GeometryEditorService";

export class GeometryTransformService {
  private readonly modelService: ModelService;
  private readonly selectionService: SelectionService;
  private readonly geometryEditorService: GeometryEditorService;

  public constructor(
    modelService: ModelService,
    selectionService: SelectionService,
    geometryEditorService: GeometryEditorService
  ) {
    this.modelService = modelService;
    this.selectionService = selectionService;
    this.geometryEditorService = geometryEditorService;
  }

  public translateSelected(offsetVector: Vector3D): void {
    const selectedIndices = this.selectionService.getSelectedIndices();
    if (selectedIndices.length === 0) {
      return;
    }

    const selectedSet = new Set(selectedIndices);
    const currentModel = this.modelService.getCurrentModel();

    const updatedVertices = currentModel.vertices.map(
      (currentVertex, vertexIndex) => {
        if (selectedSet.has(vertexIndex)) {
          return currentVertex.add(offsetVector);
        }
        return currentVertex;
      }
    );

    const updatedModel = new MeshGeometry(
      updatedVertices,
      currentModel.faces,
      currentModel.explicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
  }

  public applyTranslationFromInitial(
    initialModel: MeshGeometry,
    totalOffset: Vector3D,
    gridPlane: GridPlaneType,
    snapEnabled: boolean
  ): void {
    const selectedIndices = this.selectionService.getSelectedIndices();
    if (selectedIndices.length === 0) {
      return;
    }

    let effectiveOffset = totalOffset;
    if (snapEnabled) {
      const activeVertex = this.selectionService.getActiveVertex();
      const referenceIndex =
        activeVertex !== null && selectedIndices.includes(activeVertex)
          ? activeVertex
          : (selectedIndices[0] as number);
      const initialReferenceVertex = initialModel.vertices[referenceIndex];

      if (initialReferenceVertex) {
        const candidatePosition = initialReferenceVertex.add(totalOffset);
        const snappedPosition = this.geometryEditorService.snapToGridOnPlane(
          candidatePosition,
          gridPlane
        );
        effectiveOffset = snappedPosition.subtract(initialReferenceVertex);
      }
    }

    const selectedSet = new Set(selectedIndices);
    const updatedVertices = initialModel.vertices.map(
      (currentVertex, vertexIndex) => {
        if (selectedSet.has(vertexIndex)) {
          return currentVertex.add(effectiveOffset);
        }
        return currentVertex;
      }
    );

    const updatedModel = new MeshGeometry(
      updatedVertices,
      initialModel.faces,
      initialModel.explicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
  }

  public applyModelTranslationFromInitial(
    initialModel: MeshGeometry,
    totalOffset: Vector3D,
    gridPlane: GridPlaneType,
    snapEnabled: boolean
  ): Vector3D {
    let effectiveOffset = totalOffset;
    if (snapEnabled && initialModel.vertices.length > 0) {
      const center = initialModel.calculateCenter();
      const candidateCenter = center.add(totalOffset);
      const snappedCenter = this.geometryEditorService.snapToGridOnPlane(
        candidateCenter,
        gridPlane
      );
      effectiveOffset = snappedCenter.subtract(center);
    }

    const updatedVertices = initialModel.vertices.map((currentVertex) =>
      currentVertex.add(effectiveOffset)
    );

    const updatedModel = new MeshGeometry(
      updatedVertices,
      initialModel.faces,
      initialModel.explicitEdges
    );

    this.modelService.setCurrentModel(updatedModel);
    return effectiveOffset;
  }

  public applyRotationFromInitial(
    initialModel: MeshGeometry,
    angleRadians: number,
    gridPlane: GridPlaneType,
    snapEnabled: boolean,
    rotationAxisDirection?: Vector3D
  ): void {
    let effectiveAngle = angleRadians;
    if (snapEnabled) {
      const step = Math.PI / 12;
      effectiveAngle = Math.round(angleRadians / step) * step;
    }

    const center = initialModel.calculateCenter();
    let axis: Vector3D;
    if (rotationAxisDirection) {
      axis = rotationAxisDirection;
    } else {
      switch (gridPlane) {
        case "XY":
          axis = new Vector3D(0, 0, 1);
          break;
        case "YZ":
          axis = new Vector3D(1, 0, 0);
          break;
        case "XZ":
          axis = new Vector3D(0, 1, 0);
          break;
        default:
          axis = new Vector3D(0, 0, 1);
      }
    }

    const selectedIndices = this.selectionService.getSelectedIndices();
    let updatedModel: MeshGeometry;

    if (selectedIndices.length > 0) {
      const selectedSet = new Set(selectedIndices);
      const rotatedFull = initialModel.rotateAroundAxis(center, axis, effectiveAngle);
      const updatedVertices = initialModel.vertices.map((curVertex, index) => {
        if (selectedSet.has(index)) {
          return rotatedFull.vertices[index] as Vector3D;
        }
        return curVertex;
      });
      updatedModel = new MeshGeometry(
        updatedVertices,
        initialModel.faces,
        initialModel.explicitEdges
      );
    } else {
      updatedModel = initialModel.rotateAroundAxis(center, axis, effectiveAngle);
    }

    this.modelService.setCurrentModel(updatedModel);
  }

  public applyScaleFromInitial(
    initialModel: MeshGeometry,
    scaleFactor: number
  ): void {
    const center = initialModel.calculateCenter();
    const updatedModel = initialModel.scale(scaleFactor, center);
    this.modelService.setCurrentModel(updatedModel);
  }
}
