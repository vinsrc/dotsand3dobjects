import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { ViewportRaycaster } from "../../../src/Ui/Common/ViewportRaycaster";
import { ModelFactory } from "../../../src/Application/Services/ModelService/ModelFactory";
import { Vector3D } from "../../../src/Application/Common/Vector3D";
import { Face3D } from "../../../src/Application/Services/ModelService/Face3D";

describe("ViewportRaycaster", () => {
  const modelFactory = new ModelFactory();
  const raycaster = new ViewportRaycaster();

  // Perspective camera placed at (0, 0, 5) looking at origin (0, 0, 0)
  const camera = new THREE.PerspectiveCamera(60, 800 / 600, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  const cube = modelFactory.createStarterCube();

  describe("findNearestVertex", () => {
    it("should allow selecting occluded back vertex in wireframe mode", () => {
      // Vertex 3 is at (-1, 1, -1), back-top-left
      // Project vertex 3 to screen coordinates
      const proj = new THREE.Vector3(-1, 1, -1);
      proj.project(camera);
      const screenX = ((proj.x + 1) / 2) * 800;
      const screenY = ((-proj.y + 1) / 2) * 600;

      // In wireframe mode (isShaded = false), selecting only candidate [3] succeeds
      const resultWireframe = raycaster.findNearestVertex(
        screenX,
        screenY,
        cube.vertices,
        camera,
        800,
        600,
        25,
        [3],
        cube,
        false
      );
      expect(resultWireframe).toBe(3);
    });

    it("should disallow selecting occluded back vertex in shaded mode", () => {
      // Vertex 3 is at (-1, 1, -1)
      const proj = new THREE.Vector3(-1, 1, -1);
      proj.project(camera);
      const screenX = ((proj.x + 1) / 2) * 800;
      const screenY = ((-proj.y + 1) / 2) * 600;

      // In shaded mode (isShaded = true), vertex 3 is occluded by the front face of the cube
      const resultShaded = raycaster.findNearestVertex(
        screenX,
        screenY,
        cube.vertices,
        camera,
        800,
        600,
        25,
        [3],
        cube,
        true
      );
      expect(resultShaded).toBeNull();
    });

    it("should allow selecting front vertex in shaded mode", () => {
      // Vertex 7 is at (-1, 1, 1), front-top-left
      const proj = new THREE.Vector3(-1, 1, 1);
      proj.project(camera);
      const screenX = ((proj.x + 1) / 2) * 800;
      const screenY = ((-proj.y + 1) / 2) * 600;

      const resultShaded = raycaster.findNearestVertex(
        screenX,
        screenY,
        cube.vertices,
        camera,
        800,
        600,
        25,
        [7],
        cube,
        true
      );
      expect(resultShaded).toBe(7);
    });
  });

  describe("findNearestEdge", () => {
    it("should allow selecting occluded back edge in wireframe mode", () => {
      // Back edge [2, 3] from (1, 1, -1) to (-1, 1, -1), midpoint (0, 1, -1)
      const proj = new THREE.Vector3(0, 1, -1);
      proj.project(camera);
      const screenX = ((proj.x + 1) / 2) * 800;
      const screenY = ((-proj.y + 1) / 2) * 600;

      const resultWireframe = raycaster.findNearestEdge(
        screenX,
        screenY,
        [[2, 3]],
        cube.vertices,
        camera,
        800,
        600,
        20,
        cube,
        false
      );
      expect(resultWireframe).toEqual([2, 3]);
    });

    it("should disallow selecting occluded back edge in shaded mode", () => {
      // Back edge [2, 3] midpoint (0, 1, -1)
      const proj = new THREE.Vector3(0, 1, -1);
      proj.project(camera);
      const screenX = ((proj.x + 1) / 2) * 800;
      const screenY = ((-proj.y + 1) / 2) * 600;

      const resultShaded = raycaster.findNearestEdge(
        screenX,
        screenY,
        [[2, 3]],
        cube.vertices,
        camera,
        800,
        600,
        20,
        cube,
        true
      );
      expect(resultShaded).toBeNull();
    });

    it("should allow selecting visible front edge in shaded mode", () => {
      // Front edge [6, 7] from (1, 1, 1) to (-1, 1, 1), midpoint (0, 1, 1)
      const proj = new THREE.Vector3(0, 1, 1);
      proj.project(camera);
      const screenX = ((proj.x + 1) / 2) * 800;
      const screenY = ((-proj.y + 1) / 2) * 600;

      const resultShaded = raycaster.findNearestEdge(
        screenX,
        screenY,
        [[6, 7]],
        cube.vertices,
        camera,
        800,
        600,
        20,
        cube,
        true
      );
      expect(resultShaded).toEqual([6, 7]);
    });
  });

  describe("findNearestFace", () => {
    // A single face facing away from camera: normal is (0, 0, -1)
    const vertices = [
      new Vector3D(-1, -1, 0),
      new Vector3D(-1, 1, 0),
      new Vector3D(1, 1, 0),
      new Vector3D(1, -1, 0),
    ];
    // Winding [0, 1, 2, 3]: (0->1 is +y, 1->2 is +x): normal points in -Z direction
    const backFacingModel = modelFactory.createFromRawData(vertices, [
      new Face3D([0, 1, 2, 3]),
    ]);

    it("should allow selecting a back-facing face in wireframe mode", () => {
      // Click at center (0, 0)
      const screenX = 400;
      const screenY = 300;

      const resultWireframe = raycaster.findNearestFace(
        screenX,
        screenY,
        backFacingModel,
        camera,
        800,
        600,
        false
      );
      expect(resultWireframe).toBe(0);
    });

    it("should disallow selecting a back-facing face in shaded mode", () => {
      const screenX = 400;
      const screenY = 300;

      const resultShaded = raycaster.findNearestFace(
        screenX,
        screenY,
        backFacingModel,
        camera,
        800,
        600,
        true
      );
      expect(resultShaded).toBeNull();
    });

    it("should allow selecting a front-facing face in shaded mode", () => {
      // Cube face 1 is front face (+Z)
      const screenX = 400;
      const screenY = 300;

      const resultShaded = raycaster.findNearestFace(
        screenX,
        screenY,
        cube,
        camera,
        800,
        600,
        true
      );
      expect(resultShaded).toBe(1);
    });
  });
});
