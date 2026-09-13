import { test, expect } from "@playwright/test";

test.describe("Issue #12: Face Orthographic View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
    await expect(page.getByTestId("3d-axis-gizmo")).toBeVisible();
  });

  test("Single-clicking on a mesh face selects the face and its constituent vertices", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const clearSelectionButton = page.getByTestId("clear-selection-button");

    // Initially no selection
    await expect(clearSelectionButton).toBeDisabled();

    // Switch to orthographic +Z so the front face of the cube is squarely facing the camera
    const axisZButton = page.getByTestId("gizmo-axis-+Z");
    await axisZButton.click();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Click on the center of the front face (0, 0, 1) of the default cube
    await page.mouse.click(centerX, centerY);

    // Clear selection button should now be enabled because vertices of the face are selected
    await expect(clearSelectionButton).toBeEnabled();

    // Verify face is selected via window.__viewportRenderer
    const selectedFaceIndex = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="viewport-canvas"]') as any;
      const renderer = canvasEl?.__viewportRenderer;
      return renderer?.getSelectedFaceIndex?.();
    });
    expect(selectedFaceIndex).not.toBeNull();

    // Wait for double-click interval to elapse before clicking again
    await page.waitForTimeout(350);

    // Clicking the same face again deselects it
    await page.mouse.click(centerX, centerY);
    await expect(clearSelectionButton).toBeDisabled();
  });

  test("Double-clicking on a mesh face rotates 3D viewport to face orthographic view", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");

    // Initially in perspective view
    let isOrtho = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.getActiveCamera().isOrthographicCamera === true;
    });
    expect(isOrtho).toBe(false);

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;
    // Switch to +Z to select the front face of the default cube
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.mouse.click(centerX, centerY);
    // Switch to perspective view
    await page.getByTestId("perspective-view-button").click();
    // With front face selected, click Nearest Orthographic View button
    await page.getByTestId("nearest-ortho-view-button").click();

    // The viewport should now be in orthographic view
    isOrtho = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.getActiveCamera().isOrthographicCamera === true;
    });
    expect(isOrtho).toBe(true);

    // Check that the active strategy is a Face strategy
    const axisLabel = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="viewport-canvas"]') as any;
      const renderer = canvasEl?.__viewportRenderer;
      return renderer?.getActiveAxisLabel?.() ?? "";
    });
    expect(axisLabel).toContain("Face");
  });

  test("Restricted operations like Insert mode work in Face Orthographic View without error", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const errorDialog = page.getByTestId("error-dialog");
    const insertModeButton = page.getByTestId("mode-insert-button");

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select the front face and rotate to face orthographic view
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("nearest-ortho-view-button").click();

    // Switch to Insert mode
    await insertModeButton.click();

    // Click to insert a vertex on the face orthographic plane
    await page.mouse.click(centerX + 60, centerY + 60);

    // Should NOT show "Switch to an Orthographic view" error
    await expect(errorDialog).not.toBeVisible();
  });

  test("In Translate mode, dragging when no vertex is selected rotates viewport", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const translateModeButton = page.getByTestId("mode-translate-button");
    const axisXButton = page.getByTestId("gizmo-axis-+X");
    const axisZButton = page.getByTestId("gizmo-axis-+Z");
    const clearSelectionButton = page.getByTestId("clear-selection-button");

    // Switch to orthographic view first so Translate mode is permitted
    await axisZButton.click();

    // Enter Translate mode with NO selection
    await translateModeButton.click();
    await expect(clearSelectionButton).toBeDisabled();

    // Record initial gizmo button position
    const initialXLeft = await axisXButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).left)
    );

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Drag from empty space (outside the cube) in the canvas
    const dragStartX = centerX - 180;
    const dragStartY = centerY - 180;

    await page.mouse.move(dragStartX, dragStartY);
    await page.mouse.down();
    await page.mouse.move(dragStartX + 80, dragStartY, { steps: 10 });
    await page.mouse.up();

    // Viewport should have rotated, moving gizmo buttons
    const newXLeft = await axisXButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).left)
    );
    expect(Math.abs(newXLeft - initialXLeft)).toBeGreaterThan(3);
  });
});

