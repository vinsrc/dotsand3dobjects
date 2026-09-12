import { test, expect } from "@playwright/test";

test.describe("Scale Mode Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Scale button exists in side toolbar and requires orthographic view", async ({
    page,
  }) => {
    const scaleButton = page.getByTestId("mode-scale-button");
    await expect(scaleButton).toBeVisible();
    await expect(scaleButton).toHaveText("Scale");

    // Click Scale while in default perspective view
    await scaleButton.click();

    // Error modal should appear indicating orthographic view is required
    const errorDialog = page.getByTestId("error-dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText("Switch to an Orthographic view");

    // Close error modal
    await page.getByTestId("error-dismiss-button").click();
  });

  test("Entering Scale mode in orthographic view displays 4 scale handles at mesh boundary", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    // Enter Scale mode
    const scaleButton = page.getByTestId("mode-scale-button");
    await scaleButton.click();

    // Four scale handles should be visible
    const topLeft = page.getByTestId("scale-handle-top-left");
    const topRight = page.getByTestId("scale-handle-top-right");
    const bottomRight = page.getByTestId("scale-handle-bottom-right");
    const bottomLeft = page.getByTestId("scale-handle-bottom-left");
    const boundaryBox = page.getByTestId("scale-boundary-box");

    await expect(topLeft).toBeVisible();
    await expect(topRight).toBeVisible();
    await expect(bottomRight).toBeVisible();
    await expect(bottomLeft).toBeVisible();
    await expect(boundaryBox).toBeVisible();

    // Capture visual screenshot of Scale mode
    const artifactDir =
      "C:/Users/vinot/.gemini/antigravity/brain/8e432451-e813-4120-ae7e-4ad3989cb47d";
    await page.screenshot({ path: `${artifactDir}/scale_mode_ortho_handles.png` });
  });

  test("Dragging a scale handle scales the mesh uniformly in all axes and supports undo/redo", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    // Enter Scale mode
    await page.getByTestId("mode-scale-button").click();

    // Get initial vertex position of starter cube vertex 0
    const initialVertex = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const model = canvas?.__viewportRenderer?.getCurrentModel();
      const v = model?.vertices[0];
      return v ? { x: v.coordinateX, y: v.coordinateY, z: v.coordinateZ } : null;
    });

    expect(initialVertex).not.toBeNull();

    // Drag top-right scale handle outward to scale up
    const topRightHandle = page.getByTestId("scale-handle-top-right");
    await expect(topRightHandle).toBeVisible();
    const box = await topRightHandle.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Drag outward (up and right)
      await page.mouse.move(startX + 60, startY - 60, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(200);
    }

    // Vertex coordinates should have grown in magnitude
    const scaledVertex = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const model = canvas?.__viewportRenderer?.getCurrentModel();
      const v = model?.vertices[0];
      return v ? { x: v.coordinateX, y: v.coordinateY, z: v.coordinateZ } : null;
    });

    expect(scaledVertex).not.toBeNull();
    expect(Math.abs(scaledVertex!.x)).toBeGreaterThan(Math.abs(initialVertex!.x));
    expect(Math.abs(scaledVertex!.y)).toBeGreaterThan(Math.abs(initialVertex!.y));
    expect(Math.abs(scaledVertex!.z)).toBeGreaterThan(Math.abs(initialVertex!.z));

    // Ratio of scaling in all 3 axes should be equal (uniform isotropic scale, no skew)
    const ratioX = Math.abs(scaledVertex!.x / initialVertex!.x);
    const ratioY = Math.abs(scaledVertex!.y / initialVertex!.y);
    const ratioZ = Math.abs(scaledVertex!.z / initialVertex!.z);
    expect(ratioX).toBeCloseTo(ratioY, 2);
    expect(ratioX).toBeCloseTo(ratioZ, 2);

    // Exit scale mode
    await page.getByTestId("mode-scale-button").click();
    await page.waitForTimeout(100);

    // Test Undo
    await page.getByTestId("undo-button").click();
    await page.waitForTimeout(200);

    const undoneVertex = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const model = canvas?.__viewportRenderer?.getCurrentModel();
      const v = model?.vertices[0];
      return v ? { x: v.coordinateX, y: v.coordinateY, z: v.coordinateZ } : null;
    });

    expect(undoneVertex!.x).toBeCloseTo(initialVertex!.x, 3);
    expect(undoneVertex!.y).toBeCloseTo(initialVertex!.y, 3);
    expect(undoneVertex!.z).toBeCloseTo(initialVertex!.z, 3);

    // Test Redo
    await page.getByTestId("redo-button").click();
    await page.waitForTimeout(200);

    const redoneVertex = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const model = canvas?.__viewportRenderer?.getCurrentModel();
      const v = model?.vertices[0];
      return v ? { x: v.coordinateX, y: v.coordinateY, z: v.coordinateZ } : null;
    });

    expect(redoneVertex!.x).toBeCloseTo(scaledVertex!.x, 3);
    expect(redoneVertex!.y).toBeCloseTo(scaledVertex!.y, 3);
    expect(redoneVertex!.z).toBeCloseTo(scaledVertex!.z, 3);
  });

  test("When decal is selected, its selection color matches face selection color and Scale mode scales decal plane", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select face and add decal plane
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("add-decal-plane-button").click();

    // When created, the decal is automatically selected
    // Verify decal material in Three.js scene uses face selection color 0xffaa00
    const decalColorInfo = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const decalMeshes = renderer?.getDecalMeshes();
      const firstMesh = decalMeshes?.[0];
      const mat = firstMesh?.material;
      return {
        colorHex: mat?.color ? mat.color.getHex() : null,
      };
    });

    // 0xffaa00 = 16755200 in decimal
    expect(decalColorInfo.colorHex).toBe(0xffaa00);

    // Enter Scale mode with decal selected
    await page.getByTestId("mode-scale-button").click();

    // 4 scale handles should appear around the decal plane boundary
    const handleTr = page.getByTestId("scale-handle-top-right");
    await expect(handleTr).toBeVisible();

    const initialDecalSize = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const decals = canvasEl?.__viewportRenderer?.getCurrentDecals();
      return decals?.[0]?.size ?? 0;
    });

    expect(initialDecalSize).toBeGreaterThan(0);

    // Drag top-right scale handle outward to scale the decal plane
    await expect(handleTr).toBeVisible();
    const trBox = await handleTr.boundingBox();
    expect(trBox).not.toBeNull();

    if (trBox) {
      const startX = trBox.x + trBox.width / 2;
      const startY = trBox.y + trBox.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 50, startY - 50, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(200);
    }

    // Verify decal size increased
    const scaledDecalSize = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const decals = canvasEl?.__viewportRenderer?.getCurrentDecals();
      return decals?.[0]?.size ?? 0;
    });

    expect(scaledDecalSize).toBeGreaterThan(initialDecalSize);

    // Exit Scale mode
    await page.getByTestId("mode-scale-button").click();
    await page.waitForTimeout(100);

    // Undo decal scaling
    await page.getByTestId("undo-button").click();
    await page.waitForTimeout(200);

    const undoneDecalSize = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const decals = canvasEl?.__viewportRenderer?.getCurrentDecals();
      return decals?.[0]?.size ?? 0;
    });

    expect(undoneDecalSize).toBeCloseTo(initialDecalSize, 2);
  });
});
