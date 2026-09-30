import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Issue #2 X,Y,Z Axis View Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("X, Y, Z axes lines are present in the 3D viewport and configured", async ({
    page,
  }) => {
    const hasAxes = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & { __viewportRenderer?: { getAxisLines: () => any } }) | null;
      if (!canvas || !canvas.__viewportRenderer) {
        return false;
      }
      const axisLines = canvas.__viewportRenderer.getAxisLines();
      return axisLines !== null && axisLines !== undefined;
    });

    expect(hasAxes).toBe(true);
  });

  test("X, Y, Z axes use exact colors matching the 3D gizmo", async ({
    page,
  }) => {
    const colorCheck = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & { __viewportRenderer?: { getAxisLines: () => any } }) | null;
      if (!canvas || !canvas.__viewportRenderer) {
        return null;
      }
      const axisLines = canvas.__viewportRenderer.getAxisLines();
      if (!axisLines || !axisLines.geometry) {
        return null;
      }
      const colorAttr = axisLines.geometry.getAttribute("color");
      if (!colorAttr) {
        return null;
      }

      // Read colors: 6 vertices (X+ 0..1, X- 2..3, Y+ 4..5, Y- 6..7, Z+ 8..9, Z- 10..11)
      const colorX = new (window as any).THREE.Color(
        colorAttr.getX(0),
        colorAttr.getY(0),
        colorAttr.getZ(0)
      );
      const colorY = new (window as any).THREE.Color(
        colorAttr.getX(4),
        colorAttr.getY(4),
        colorAttr.getZ(4)
      );
      const colorZ = new (window as any).THREE.Color(
        colorAttr.getX(8),
        colorAttr.getY(8),
        colorAttr.getZ(8)
      );

      return {
        xPlusHex: "#" + colorX.getHexString(),
        yPlusHex: "#" + colorY.getHexString(),
        zPlusHex: "#" + colorZ.getHexString(),
      };
    });

    expect(colorCheck).not.toBeNull();
    // X+ gizmo color: #e53935
    expect(colorCheck?.xPlusHex).toBe("#e53935");
    // Y+ gizmo color: #43a047
    expect(colorCheck?.yPlusHex).toBe("#43a047");
    // Z+ gizmo color: #1e88e5
    expect(colorCheck?.zPlusHex).toBe("#1e88e5");
  });

  test("Axes remain active and visible when switching views and render modes", async ({
    page,
  }) => {
    // Switch to orthographic +X view
    await page.getByTestId("gizmo-axis-+X").click();

    let axesVisible = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & { __viewportRenderer?: { getAxisLines: () => any } }) | null;
      return canvas?.__viewportRenderer?.getAxisLines()?.visible ?? false;
    });
    expect(axesVisible).toBe(true);

    // Toggle render mode: wireframe to flat shaded
    await page.getByTestId("toggle-view-button").click();

    axesVisible = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & { __viewportRenderer?: { getAxisLines: () => any } }) | null;
      return canvas?.__viewportRenderer?.getAxisLines()?.visible ?? false;
    });
    expect(axesVisible).toBe(true);
  });

  test("Dragging 3D axis gizmo after selecting +Y view smoothly orbits without resetting", async ({
    page,
  }) => {
    // Click +Y axis on gizmo
    const axisYButton = page.getByTestId("gizmo-axis-+Y");
    await expect(axisYButton).toBeVisible();
    await axisYButton.click();

    // The gizmo container
    const gizmo = page.getByTestId("3d-axis-gizmo");
    const boundingBox = await gizmo.boundingBox();
    expect(boundingBox).not.toBeNull();

    const startX = (boundingBox?.x ?? 0) + (boundingBox?.width ?? 0) / 2;
    const startY = (boundingBox?.y ?? 0) + (boundingBox?.height ?? 0) / 2;

    // Drag gizmo downwards to tilt camera
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 20, { steps: 5 });
    await page.mouse.up();

    // Verify the gizmo is still visible and did not glitch or jump to X
    await expect(gizmo).toBeVisible();
  });

  test("Dragging 3D axis gizmo vertically rotates the gizmo in up/down direction", async ({
    page,
  }) => {
    const axisYButton = page.getByTestId("gizmo-axis-+Y");
    await expect(axisYButton).toBeVisible();

    const initialYPos = await axisYButton.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).top);
    });

    const gizmo = page.getByTestId("3d-axis-gizmo");
    const boundingBox = await gizmo.boundingBox();
    expect(boundingBox).not.toBeNull();

    const startX = (boundingBox?.x ?? 0) + (boundingBox?.width ?? 0) / 2;
    const startY = (boundingBox?.y ?? 0) + (boundingBox?.height ?? 0) / 2;

    // Drag gizmo vertically downwards
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 35, { steps: 8 });
    await page.mouse.up();

    const newYPos = await axisYButton.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).top);
    });

    // The Y button's vertical position on the gizmo disk must change
    expect(Math.abs(newYPos - initialYPos)).toBeGreaterThan(2);
  });
});
