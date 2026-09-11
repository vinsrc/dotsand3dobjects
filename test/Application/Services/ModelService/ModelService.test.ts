import { describe, it, expect, vi } from "vitest";
import { ModelService } from "../../../../src/Application/Services/ModelService/ModelService";
import { ModelFactory } from "../../../../src/Application/Services/ModelService/ModelFactory";
import { ObjParser } from "../../../../src/Application/Services/ModelService/ObjParser";
import { ObjExporter } from "../../../../src/Application/Services/ModelService/ObjExporter";
import { ApplicationStateNotifier } from "../../../../src/Application/Common/ApplicationStateNotifier";
import { MeshGeometry } from "../../../../src/Application/Services/ModelService/MeshGeometry";

describe("ModelService", () => {
  const modelFactory = new ModelFactory();
  const objParser = new ObjParser(modelFactory);
  const objExporter = new ObjExporter();

  it("should initialize with starter cube model by default", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );

    const model = service.getCurrentModel();
    expect(model.getVertexCount()).toBe(8);
    expect(model.getFaceCount()).toBe(6);
  });

  it("should update current model and notify listeners", () => {
    const notifier = new ApplicationStateNotifier();
    const modelListener = vi.fn();
    notifier.subscribe("MODEL_CHANGED", modelListener);

    const service = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );

    const newModel = new MeshGeometry([], []);
    service.setCurrentModel(newModel);

    expect(service.getCurrentModel()).toBe(newModel);
    expect(modelListener).toHaveBeenCalledWith(newModel);
  });

  it("should load valid OBJ and notify MODEL_CHANGED", () => {
    const notifier = new ApplicationStateNotifier();
    const modelListener = vi.fn();
    notifier.subscribe("MODEL_CHANGED", modelListener);

    const service = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );

    const objContent = `
      v 0 0 0
      v 1 0 0
      v 0 1 0
      f 1 2 3
    `;

    service.loadFromObj(objContent, "triangle.obj");
    expect(service.getCurrentModel().getVertexCount()).toBe(3);
    expect(modelListener).toHaveBeenCalled();
  });

  it("should auto scale and center loaded OBJ models to fit standard 2.0 dimension", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );

    // Large off-center cube from (100, 200, 300) to (200, 300, 400), size = 100
    const largeObjContent = `
      v 100 200 300
      v 200 200 300
      v 200 300 300
      v 100 300 300
      f 1 2 3 4
    `;

    service.loadFromObj(largeObjContent, "large.obj");
    const loadedModel = service.getCurrentModel();

    const centerPoint = loadedModel.calculateCenter();
    expect(centerPoint.coordinateX).toBeCloseTo(0, 4);
    expect(centerPoint.coordinateY).toBeCloseTo(0, 4);
    expect(centerPoint.coordinateZ).toBeCloseTo(0, 4);

    const boundingBox = loadedModel.calculateBoundingBox();
    const extentX = boundingBox.maximum.coordinateX - boundingBox.minimum.coordinateX;
    const extentY = boundingBox.maximum.coordinateY - boundingBox.minimum.coordinateY;
    expect(extentX).toBeCloseTo(2.0, 4);
    expect(extentY).toBeCloseTo(2.0, 4);
  });

  it("should notify ERROR_OCCURRED with 'Unsupported error' when non-obj file is provided", () => {
    const notifier = new ApplicationStateNotifier();
    const errorListener = vi.fn();
    notifier.subscribe("ERROR_OCCURRED", errorListener);

    const service = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );

    expect(() =>
      service.loadFromObj("data", "model.stl")
    ).toThrow("Unsupported error");

    expect(errorListener).toHaveBeenCalledWith("Unsupported error");
  });

  it("should export model using ObjExporter", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );

    const exportedString = service.exportToObj();
    expect(exportedString).toContain("v ");
    expect(exportedString).toContain("f ");
  });

  it("should reset to starter model and notify", () => {
    const notifier = new ApplicationStateNotifier();
    const modelListener = vi.fn();
    notifier.subscribe("MODEL_CHANGED", modelListener);

    const service = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );

    service.setCurrentModel(new MeshGeometry([], []));
    expect(service.getCurrentModel().isEmpty()).toBe(true);

    service.resetToStarterModel();
    expect(service.getCurrentModel().isEmpty()).toBe(false);
  });

  it("should parse MTL content via parseMtl", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );

    const mtlContent = `
      newmtl Silver
      Kd 0.75 0.75 0.75
      Pr 0.2
      Pm 0.9
    `;

    const materials = service.parseMtl(mtlContent);
    expect(materials).toHaveLength(1);
    expect(materials[0]?.name).toBe("Silver");
  });

  it("should load OBJ with materials and assign material id to faces", () => {
    const notifier = new ApplicationStateNotifier();
    const service = new ModelService(
      modelFactory,
      objParser,
      objExporter,
      notifier
    );

    const objContent = `
      v 0 0 0
      v 1 0 0
      v 0 1 0
      usemtl Bronze
      f 1 2 3
    `;

    const mockMaterials = service.parseMtl(`
      newmtl Bronze
      Kd 0.8 0.5 0.2
    `);

    service.loadFromObj(objContent, "model.obj", mockMaterials);
    const loadedModel = service.getCurrentModel();
    expect(loadedModel.getFaceCount()).toBe(1);
    expect(loadedModel.faces[0]?.materialId).toBe(mockMaterials[0]?.id);
  });
});
