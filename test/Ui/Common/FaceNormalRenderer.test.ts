import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { FaceNormalRenderer } from "../../../src/Ui/Common/FaceNormalRenderer";
import { ModelFactory } from "../../../src/Application/Services/ModelService/ModelFactory";

describe("FaceNormalRenderer", () => {
  const modelFactory = new ModelFactory();

  it("should initialize root group and start with 0 indicators", () => {
    const scene = new THREE.Scene();
    const renderer = new FaceNormalRenderer(scene);

    expect(renderer.getIndicatorCount()).toBe(0);
    expect(renderer.getArrowCount()).toBe(0);
    const rootGroup = renderer.getArrowGroup();
    expect(rootGroup.name).toBe("FaceNormalGroup");
    expect(scene.children).toContain(rootGroup);
  });

  it("should render FRONT and BACK indicator meshes on selected face", () => {
    const scene = new THREE.Scene();
    const renderer = new FaceNormalRenderer(scene);
    const starterCube = modelFactory.createStarterCube();

    // Face 1 is front face (+Z), centroid at (0, 0, 1)
    renderer.updateNormals(starterCube, [1]);
    expect(renderer.getIndicatorCount()).toBe(1);

    const rootGroup = renderer.getArrowGroup();
    expect(rootGroup.children.length).toBe(1);

    const faceGroup = rootGroup.children[0] as THREE.Group;
    expect(faceGroup.userData.isFaceOrientationIndicator).toBe(true);
    expect(faceGroup.userData.faceIndex).toBe(1);
    expect(faceGroup.position.x).toBeCloseTo(0, 4);
    expect(faceGroup.position.y).toBeCloseTo(0, 4);
    expect(faceGroup.position.z).toBeCloseTo(1, 4);

    const normal = faceGroup.userData.normal as THREE.Vector3;
    expect(normal.z).toBeCloseTo(1, 4);

    // Contains FRONT and BACK meshes
    expect(faceGroup.children.length).toBe(2);
    const frontMesh = faceGroup.children[0] as THREE.Mesh;
    const backMesh = faceGroup.children[1] as THREE.Mesh;

    expect(frontMesh.userData.label).toBe("FRONT");
    expect(backMesh.userData.label).toBe("BACK");

    // Front mesh faces +Z (local), back mesh faces -Z (local) with 180° rotation around Y
    expect(frontMesh.position.z).toBeCloseTo(0.005, 4);
    expect(backMesh.position.z).toBeCloseTo(-0.005, 4);
    expect(backMesh.rotation.y).toBeCloseTo(Math.PI, 4);
  });

  it("should reverse orientation when face winding is flipped", () => {
    const scene = new THREE.Scene();
    const renderer = new FaceNormalRenderer(scene);
    const starterCube = modelFactory.createStarterCube();

    renderer.updateNormals(starterCube, [1]);
    const normalBefore = (renderer.getArrowGroup().children[0] as THREE.Group)
      .userData.normal as THREE.Vector3;
    expect(normalBefore.z).toBeCloseTo(1, 4);

    // Flip face 1
    const flippedCube = starterCube.reverseFaceWinding(1);
    renderer.updateNormals(flippedCube, [1]);

    expect(renderer.getIndicatorCount()).toBe(1);
    const normalAfter = (renderer.getArrowGroup().children[0] as THREE.Group)
      .userData.normal as THREE.Vector3;
    expect(normalAfter.z).toBeCloseTo(-1, 4);
  });

  it("should render multiple indicators when multiple faces are selected", () => {
    const scene = new THREE.Scene();
    const renderer = new FaceNormalRenderer(scene);
    const starterCube = modelFactory.createStarterCube();

    renderer.updateNormals(starterCube, [0, 1, 2]);
    expect(renderer.getIndicatorCount()).toBe(3);
  });

  it("should clear indicators when selection is empty or out-of-bounds", () => {
    const scene = new THREE.Scene();
    const renderer = new FaceNormalRenderer(scene);
    const starterCube = modelFactory.createStarterCube();

    renderer.updateNormals(starterCube, [1]);
    expect(renderer.getIndicatorCount()).toBe(1);

    renderer.updateNormals(starterCube, []);
    expect(renderer.getIndicatorCount()).toBe(0);

    // Out of bounds face indices are skipped
    renderer.updateNormals(starterCube, [-1, 99]);
    expect(renderer.getIndicatorCount()).toBe(0);
  });

  it("should remove root group on dispose", () => {
    const scene = new THREE.Scene();
    const renderer = new FaceNormalRenderer(scene);
    const starterCube = modelFactory.createStarterCube();

    renderer.updateNormals(starterCube, [1]);
    renderer.dispose();

    expect(renderer.getIndicatorCount()).toBe(0);
    expect(scene.children).not.toContain(renderer.getArrowGroup());
  });
});
