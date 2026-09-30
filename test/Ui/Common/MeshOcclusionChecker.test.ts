import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { MeshOcclusionChecker } from "../../../src/Ui/Common/MeshOcclusionChecker";
import { ModelFactory } from "../../../src/Application/Services/ModelService/ModelFactory";
import { Vector3D } from "../../../src/Application/Common/Vector3D";

describe("MeshOcclusionChecker", () => {
  const modelFactory = new ModelFactory();
  const occlusionChecker = new MeshOcclusionChecker();

  describe("Perspective Camera", () => {
    // Camera placed on +Z axis looking towards origin
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);

    const cube = modelFactory.createStarterCube();

    it("should identify front face as facing camera and back face as not", () => {
      // Face 1 is front (+Z), Face 0 is back (-Z)
      const frontFace = cube.faces[1]!;
      const backFace = cube.faces[0]!;

      expect(occlusionChecker.isFaceFacingCamera(frontFace, cube, camera)).toBe(true);
      expect(occlusionChecker.isFaceFacingCamera(backFace, cube, camera)).toBe(false);
    });

    it("should detect that back vertices are occluded and front vertices are not", () => {
      // Front vertices are 4, 5, 6, 7 (z = 1)
      // Back vertices are 0, 1, 2, 3 (z = -1)
      expect(
        occlusionChecker.isVertexOccluded(4, cube.vertices[4]!, cube, camera)
      ).toBe(false);
      expect(
        occlusionChecker.isVertexOccluded(6, cube.vertices[6]!, cube, camera)
      ).toBe(false);

      expect(
        occlusionChecker.isVertexOccluded(0, cube.vertices[0]!, cube, camera)
      ).toBe(true);
      expect(
        occlusionChecker.isVertexOccluded(2, cube.vertices[2]!, cube, camera)
      ).toBe(true);
    });

    it("should detect that back edges are occluded and front edges are not", () => {
      // Front edge [4, 5] midpoint at (0, -1, 1)
      const frontPoint = new Vector3D(0, -1, 1);
      expect(
        occlusionChecker.isEdgeOccluded([4, 5], frontPoint, cube, camera)
      ).toBe(false);

      // Back edge [0, 1] midpoint at (0, -1, -1)
      const backPoint = new Vector3D(0, -1, -1);
      expect(
        occlusionChecker.isEdgeOccluded([0, 1], backPoint, cube, camera)
      ).toBe(true);
    });
  });

  describe("Orthographic Camera", () => {
    // Front orthographic camera on +Z looking at origin
    const orthoCamera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
    orthoCamera.position.set(0, 0, 10);
    orthoCamera.lookAt(0, 0, 0);
    orthoCamera.updateMatrixWorld(true);

    const cube = modelFactory.createStarterCube();

    it("should correctly test face orientation with orthographic camera", () => {
      const frontFace = cube.faces[1]!;
      const backFace = cube.faces[0]!;

      expect(occlusionChecker.isFaceFacingCamera(frontFace, cube, orthoCamera)).toBe(true);
      expect(occlusionChecker.isFaceFacingCamera(backFace, cube, orthoCamera)).toBe(false);
    });

    it("should correctly test vertex occlusion with orthographic camera", () => {
      expect(
        occlusionChecker.isVertexOccluded(5, cube.vertices[5]!, cube, orthoCamera)
      ).toBe(false);
      expect(
        occlusionChecker.isVertexOccluded(1, cube.vertices[1]!, cube, orthoCamera)
      ).toBe(true);
    });

    it("should correctly test edge occlusion with orthographic camera", () => {
      // Front edge [6, 7] midpoint at (0, 1, 1)
      const frontPoint = new Vector3D(0, 1, 1);
      expect(
        occlusionChecker.isEdgeOccluded([6, 7], frontPoint, cube, orthoCamera)
      ).toBe(false);

      // Back edge [2, 3] midpoint at (0, 1, -1)
      const backPoint = new Vector3D(0, 1, -1);
      expect(
        occlusionChecker.isEdgeOccluded([2, 3], backPoint, cube, orthoCamera)
      ).toBe(true);
    });
  });
});
