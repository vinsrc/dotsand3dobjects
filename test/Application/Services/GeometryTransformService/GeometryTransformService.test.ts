import { describe, it, expect } from "vitest";
import { GeometryTransformService } from "../../../../src/Application/Services/GeometryTransformService/GeometryTransformService";
import { GeometryEditorService } from "../../../../src/Application/Services/GeometryEditorService/GeometryEditorService";
import { ModelService } from "../../../../src/Application/Services/ModelService/ModelService";
import { SelectionService } from "../../../../src/Application/Services/SelectionService/SelectionService";
import { ModelFactory } from "../../../../src/Application/Services/ModelService/ModelFactory";
import { ObjParser } from "../../../../src/Application/Services/ModelService/ObjParser";
import { ObjExporter } from "../../../../src/Application/Services/ModelService/ObjExporter";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";
import { Vector3D } from "../../../../src/Application/Common/Vector3D";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";

describe("GeometryTransformService", () => {
  const setupService = () => {
    const modelFactory = new ModelFactory();
    const objParser = new ObjParser(modelFactory);
    const objExporter = new ObjExporter();
    const stateNotifier = new ApplicationStateNotifier();
    const modelService = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      stateNotifier
    );
    const selectionService = new SelectionService(stateNotifier);
    const editorService = new GeometryEditorService(
      modelService,
      selectionService
    );
    const transformService = new GeometryTransformService(
      modelService,
      selectionService,
      editorService
    );
    return {
      modelService,
      selectionService,
      editorService,
      transformService,
    };
  };

  it("should translate only the selected vertices by offset vector", () => {
    const { modelService, selectionService, transformService } = setupService();

    const vertices = [new Vector3D(0, 0, 0), new Vector3D(2, 2, 2)];
    modelService.setCurrentModel(new MeshGeometry(vertices, []));

    selectionService.selectSingle(0);

    transformService.translateSelected(new Vector3D(0, 3, 5));

    const currentModel = modelService.getCurrentModel();
    expect(currentModel.vertices[0].coordinateX).toBe(0);
    expect(currentModel.vertices[0].coordinateY).toBe(3);
    expect(currentModel.vertices[0].coordinateZ).toBe(5);

    // Vertex 1 should be untouched
    expect(currentModel.vertices[1].coordinateX).toBe(2);
    expect(currentModel.vertices[1].coordinateY).toBe(2);
    expect(currentModel.vertices[1].coordinateZ).toBe(2);
  });

  it("should do nothing when translating with empty selection", () => {
    const { modelService, transformService } = setupService();
    const beforeModel = modelService.getCurrentModel();
    transformService.translateSelected(new Vector3D(1, 1, 1));
    expect(modelService.getCurrentModel()).toBe(beforeModel);
  });

  it("should do nothing in applyTranslationFromInitial if no vertices are selected", () => {
    const { modelService, transformService } = setupService();
    const initialModel = modelService.getCurrentModel();
    transformService.applyTranslationFromInitial(
      initialModel,
      new Vector3D(1.5, 2.5, 3.5),
      "XY",
      true
    );
    expect(modelService.getCurrentModel()).toBe(initialModel);
  });

  it("should translate selected vertices continuously when snapEnabled is false", () => {
    const { modelService, selectionService, transformService } = setupService();
    const initialModel = modelService.getCurrentModel();
    selectionService.restoreSelection([0, 1], 0);

    const initialPosZero = initialModel.vertices[0] as Vector3D;
    const initialPosOne = initialModel.vertices[1] as Vector3D;
    const continuousOffset = new Vector3D(0.33, 0.67, 0);

    transformService.applyTranslationFromInitial(
      initialModel,
      continuousOffset,
      "XY",
      false
    );

    const updatedVertices = modelService.getCurrentModel().vertices;
    expect(updatedVertices[0]?.coordinateX).toBeCloseTo(
      initialPosZero.coordinateX + 0.33,
      5
    );
    expect(updatedVertices[0]?.coordinateY).toBeCloseTo(
      initialPosZero.coordinateY + 0.67,
      5
    );
    expect(updatedVertices[1]?.coordinateX).toBeCloseTo(
      initialPosOne.coordinateX + 0.33,
      5
    );
    expect(updatedVertices[1]?.coordinateY).toBeCloseTo(
      initialPosOne.coordinateY + 0.67,
      5
    );
    expect(updatedVertices[2]?.coordinateX).toBe(
      initialModel.vertices[2]?.coordinateX
    );
  });

  it("should translate selected vertices with grid snapping when snapEnabled is true using active vertex", () => {
    const { modelService, selectionService, transformService } = setupService();
    const testVertices = [
      new Vector3D(1, 1, 0),
      new Vector3D(2, 1, 0),
      new Vector3D(3, 3, 0),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    selectionService.restoreSelection([0, 1], 0);

    transformService.applyTranslationFromInitial(
      baseModel,
      new Vector3D(1.2, 0.8, 0),
      "XY",
      true
    );

    const resultVertices = modelService.getCurrentModel().vertices;
    expect(resultVertices[0]?.coordinateX).toBe(2);
    expect(resultVertices[0]?.coordinateY).toBe(2);
    expect(resultVertices[1]?.coordinateX).toBe(3);
    expect(resultVertices[1]?.coordinateY).toBe(2);
    expect(resultVertices[2]?.coordinateX).toBe(3);
    expect(resultVertices[2]?.coordinateY).toBe(3);
  });

  it("should fallback to first selected vertex if active vertex is null or not in selection when snapEnabled is true", () => {
    const { modelService, selectionService, transformService } = setupService();
    const testVertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(5, 5, 0),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    selectionService.restoreSelection([1], 0);

    transformService.applyTranslationFromInitial(
      baseModel,
      new Vector3D(0.9, 0.1, 0),
      "XY",
      true
    );

    const resultVertices = modelService.getCurrentModel().vertices;
    expect(resultVertices[1]?.coordinateX).toBe(6);
    expect(resultVertices[1]?.coordinateY).toBe(5);
  });

  it("should apply rotation from initial model around center on specified plane", () => {
    const { modelService, transformService } = setupService();
    const testVertices = [
      new Vector3D(1, 0, 0),
      new Vector3D(-1, 0, 0),
      new Vector3D(0, 1, 0),
      new Vector3D(0, -1, 0),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    transformService.applyRotationFromInitial(
      baseModel,
      Math.PI / 2,
      "XY",
      false
    );

    const rotated = modelService.getCurrentModel().vertices;
    expect(rotated[0]?.coordinateX).toBeCloseTo(0, 5);
    expect(rotated[0]?.coordinateY).toBeCloseTo(1, 5);
    expect(rotated[1]?.coordinateX).toBeCloseTo(0, 5);
    expect(rotated[1]?.coordinateY).toBeCloseTo(-1, 5);
  });

  it("should support rotation with custom rotationAxisDirection", () => {
    const { modelService, transformService } = setupService();
    const testVertices = [
      new Vector3D(1, 0, 0),
      new Vector3D(-1, 0, 0),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    transformService.applyRotationFromInitial(
      baseModel,
      Math.PI,
      "XY",
      false,
      new Vector3D(0, 0, 1)
    );

    const rotated = modelService.getCurrentModel().vertices;
    expect(rotated[0]?.coordinateX).toBeCloseTo(-1, 5);
    expect(rotated[0]?.coordinateY).toBeCloseTo(0, 5);
  });

  it("should support rotation in YZ, XZ, and fallback plane when axis direction is not provided", () => {
    const { modelService, transformService } = setupService();
    const testVertices = [
      new Vector3D(0, 1, 0),
      new Vector3D(0, -1, 0),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    transformService.applyRotationFromInitial(
      baseModel,
      Math.PI / 2,
      "YZ",
      false
    );

    transformService.applyRotationFromInitial(
      baseModel,
      Math.PI / 2,
      "XZ",
      false
    );

    transformService.applyRotationFromInitial(
      baseModel,
      Math.PI / 2,
      "NONE",
      false
    );

    expect(modelService.getCurrentModel().vertices.length).toBe(2);
  });

  it("should snap rotation angle when snapEnabled is true", () => {
    const { modelService, transformService } = setupService();
    const testVertices = [
      new Vector3D(1, 0, 0),
      new Vector3D(-1, 0, 0),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    const angle16Deg = (16 * Math.PI) / 180;
    transformService.applyRotationFromInitial(
      baseModel,
      angle16Deg,
      "XY",
      true
    );

    const expectedX = Math.cos(Math.PI / 12);
    const expectedY = Math.sin(Math.PI / 12);
    const rotated = modelService.getCurrentModel().vertices;
    expect(rotated[0]?.coordinateX).toBeCloseTo(expectedX, 5);
    expect(rotated[0]?.coordinateY).toBeCloseTo(expectedY, 5);
  });

  it("should rotate only selected vertices if vertices are selected", () => {
    const { modelService, selectionService, transformService } = setupService();
    const testVertices = [
      new Vector3D(1, 0, 0),
      new Vector3D(0, 1, 0),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    selectionService.selectSingle(0);

    transformService.applyRotationFromInitial(
      baseModel,
      Math.PI / 2,
      "XY",
      false
    );

    const rotated = modelService.getCurrentModel().vertices;
    expect(rotated[1]?.coordinateX).toBe(0);
    expect(rotated[1]?.coordinateY).toBe(1);
  });

  it("should scale entire model uniformly around its center with applyScaleFromInitial", () => {
    const { modelService, transformService } = setupService();
    const testVertices = [
      new Vector3D(-1, -1, -1),
      new Vector3D(1, 1, 1),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    transformService.applyScaleFromInitial(baseModel, 2);

    const scaled = modelService.getCurrentModel().vertices;
    expect(scaled[0]?.coordinateX).toBeCloseTo(-2, 5);
    expect(scaled[0]?.coordinateY).toBeCloseTo(-2, 5);
    expect(scaled[0]?.coordinateZ).toBeCloseTo(-2, 5);
    expect(scaled[1]?.coordinateX).toBeCloseTo(2, 5);
    expect(scaled[1]?.coordinateY).toBeCloseTo(2, 5);
    expect(scaled[1]?.coordinateZ).toBeCloseTo(2, 5);
  });

  it("should translate entire model with applyModelTranslationFromInitial without snap", () => {
    const { modelService, transformService } = setupService();
    const testVertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(2, 2, 2),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    const offset = transformService.applyModelTranslationFromInitial(
      baseModel,
      new Vector3D(1, 2, 3),
      "XY",
      false
    );

    expect(offset.coordinateX).toBe(1);
    expect(offset.coordinateY).toBe(2);
    expect(offset.coordinateZ).toBe(3);

    const translated = modelService.getCurrentModel().vertices;
    expect(translated[0]?.coordinateX).toBe(1);
    expect(translated[0]?.coordinateY).toBe(2);
    expect(translated[0]?.coordinateZ).toBe(3);
    expect(translated[1]?.coordinateX).toBe(3);
    expect(translated[1]?.coordinateY).toBe(4);
    expect(translated[1]?.coordinateZ).toBe(5);
  });

  it("should translate entire model with applyModelTranslationFromInitial with grid snap", () => {
    const { modelService, transformService } = setupService();
    const testVertices = [
      new Vector3D(0, 0, 0),
      new Vector3D(2, 2, 2),
    ];
    const baseModel = new MeshGeometry(testVertices, []);
    modelService.setCurrentModel(baseModel);

    // Model center is (1, 1, 1). Offset (0.24, 0.49, 0) -> candidate center (1.24, 1.49, 1).
    // Snaps to (1, 1, 1) if grid step is 1, so effectiveOffset is (0, 0, 0).
    const offset = transformService.applyModelTranslationFromInitial(
      baseModel,
      new Vector3D(0.24, 0.49, 0),
      "XY",
      true
    );

    const translated = modelService.getCurrentModel().vertices;
    expect(translated[0]?.coordinateX).toBe(0);
    expect(translated[0]?.coordinateY).toBe(0);
  });
});
