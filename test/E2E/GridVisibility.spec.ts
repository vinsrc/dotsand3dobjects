import { test, expect } from "@playwright/test";
import { ThemeColors } from "../../src/Ui/Common/Theme";

test.describe("Dark Theme Grid Visibility Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Grid lines are present, visible, and configured with theme colors on initial launch (Perspective view)", async ({
    page,
  }) => {
    const gridStatus = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & {
        __viewportRenderer?: {
          getGridLines: () => any;
          getActiveCamera: () => any;
        };
      }) | null;

      if (!canvas || !canvas.__viewportRenderer) {
        return null;
      }

      const grid = canvas.__viewportRenderer.getGridLines();
      const camera = canvas.__viewportRenderer.getActiveCamera();
      if (!grid) {
        return null;
      }

      return {
        visible: grid.visible,
        cameraType: camera.type,
        rotation: { x: grid.rotation.x, y: grid.rotation.y, z: grid.rotation.z },
        hasGeometry: !!grid.geometry,
        positionCount: grid.geometry?.getAttribute("position")?.count ?? 0,
        colorCount: grid.geometry?.getAttribute("color")?.count ?? 0,
        materialType: grid.material?.type,
        depthTest: grid.material?.depthTest,
      };
    });

    expect(gridStatus).not.toBeNull();
    expect(gridStatus?.visible).toBe(true);
    expect(gridStatus?.cameraType).toBe("PerspectiveCamera");
    expect(gridStatus?.rotation.x).toBe(0);
    expect(gridStatus?.rotation.y).toBe(0);
    expect(gridStatus?.rotation.z).toBe(0);
    expect(gridStatus?.hasGeometry).toBe(true);
    expect(gridStatus?.positionCount).toBeGreaterThan(0);
    expect(gridStatus?.colorCount).toBeGreaterThan(0);
  });

  test("Grid lines rotate appropriately for orthographic axes and return to floor grid in perspective", async ({
    page,
  }) => {
    // Switch to +Z view (XY plane)
    await page.getByTestId("gizmo-axis-+Z").click();
    let gridRotation = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & {
        __viewportRenderer?: { getGridLines: () => any };
      }) | null;
      const grid = canvas?.__viewportRenderer?.getGridLines();
      return {
        visible: grid?.visible,
        rotationX: grid?.rotation.x,
        rotationY: grid?.rotation.y,
        rotationZ: grid?.rotation.z,
      };
    });

    expect(gridRotation.visible).toBe(true);
    expect(gridRotation.rotationX).toBeCloseTo(Math.PI / 2, 3);

    // Switch to +X view (YZ plane)
    await page.getByTestId("gizmo-axis-+X").click();
    gridRotation = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & {
        __viewportRenderer?: { getGridLines: () => any };
      }) | null;
      const grid = canvas?.__viewportRenderer?.getGridLines();
      return {
        visible: grid?.visible,
        rotationX: grid?.rotation.x,
        rotationY: grid?.rotation.y,
        rotationZ: grid?.rotation.z,
      };
    });

    expect(gridRotation.visible).toBe(true);
    expect(gridRotation.rotationZ).toBeCloseTo(Math.PI / 2, 3);

    // Switch to +Y view (XZ plane)
    await page.getByTestId("gizmo-axis-+Y").click();
    gridRotation = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & {
        __viewportRenderer?: { getGridLines: () => any };
      }) | null;
      const grid = canvas?.__viewportRenderer?.getGridLines();
      return {
        visible: grid?.visible,
        rotationX: grid?.rotation.x,
        rotationY: grid?.rotation.y,
        rotationZ: grid?.rotation.z,
      };
    });

    expect(gridRotation.visible).toBe(true);
    expect(gridRotation.rotationX).toBeCloseTo(0, 3);
    expect(gridRotation.rotationZ).toBeCloseTo(0, 3);
  });

  test("Grid colors match ThemeColors definition", async ({ page }) => {
    const colors = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & {
        __viewportRenderer?: { getGridLines: () => any };
      }) | null;
      const grid = canvas?.__viewportRenderer?.getGridLines();
      if (!grid || !grid.geometry) {
        return null;
      }
      const colorAttr = grid.geometry.getAttribute("color");
      const THREE = (window as any).THREE;
      if (!colorAttr || !THREE) {
        return null;
      }

      // Read a standard grid color
      const standardColor = new THREE.Color(
        colorAttr.getX(0),
        colorAttr.getY(0),
        colorAttr.getZ(0)
      );

      return {
        standardColorHex: "#" + standardColor.getHexString(),
      };
    });

    expect(colors).not.toBeNull();
    const expectedHex = ThemeColors.gridLine.replace("#", "").toLowerCase();
    expect(colors?.standardColorHex.toLowerCase()).toBe("#" + expectedHex);
  });

  test("Capture visual verification screenshots", async ({ page }) => {
    const artifactDir = "C:/Users/vinot/.gemini/antigravity/brain/8e432451-e813-4120-ae7e-4ad3989cb47d";
    // 1. Perspective View with floor grid
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${artifactDir}/dark_theme_perspective_grid.png` });

    // 2. Orthographic +Z View with XY grid
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${artifactDir}/dark_theme_ortho_z_grid.png` });

    // 3. Orthographic +X View with YZ grid
    await page.getByTestId("gizmo-axis-+X").click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${artifactDir}/dark_theme_ortho_x_grid.png` });
  });
});
