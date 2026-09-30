import { test, expect } from "@playwright/test";

test.describe("Issue #10: Direct 3D View Port Rotation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
    await expect(page.getByTestId("3d-axis-gizmo")).toBeVisible();
  });

  test("Dragging mouse across 3D viewport rotates the view and reflects in 3D axis gizmo", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const axisYButton = page.getByTestId("gizmo-axis-+Y");
    const axisXButton = page.getByTestId("gizmo-axis-+X");

    // Record initial gizmo button positions
    const initialYTop = await axisYButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).top)
    );
    const initialXLeft = await axisXButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).left)
    );

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const startX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const startY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Drag horizontally across the viewport canvas
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 80, startY, { steps: 10 });
    await page.mouse.up();

    // Check that gizmo X button rotated horizontally
    const newXLeft = await axisXButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).left)
    );
    expect(Math.abs(newXLeft - initialXLeft)).toBeGreaterThan(3);

    // Now drag vertically across viewport
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 60, { steps: 10 });
    await page.mouse.up();

    // Check that gizmo Y button rotated vertically
    const newYTop = await axisYButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).top)
    );
    expect(Math.abs(newYTop - initialYTop)).toBeGreaterThan(3);
  });

  test("Clicking Nearest Orthographic View button or pressing V switches to the closest orthographic view", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const nearestOrthoBtn = page.getByTestId("nearest-ortho-view-button");
    await expect(nearestOrthoBtn).toBeVisible();

    // Initially in perspective view
    let isOrtho = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.getActiveCamera().isOrthographicCamera === true;
    });
    expect(isOrtho).toBe(false);

    // Double clicking the 3D viewport canvas should NOT switch to orthographic
    await canvas.dblclick({ position: { x: 300, y: 300 } });
    isOrtho = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.getActiveCamera().isOrthographicCamera === true;
    });
    expect(isOrtho).toBe(false);

    // Clicking Nearest Orthographic View button switches to orthographic
    await nearestOrthoBtn.click();
    isOrtho = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.getActiveCamera().isOrthographicCamera === true;
    });
    expect(isOrtho).toBe(true);
  });

  test("Nearest Orthographic View switches to closest orthographic view corresponding to camera tilt", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const axisYButton = page.getByTestId("gizmo-axis-+Y");
    const nearestOrthoBtn = page.getByTestId("nearest-ortho-view-button");

    // First select +Y orthographic view via gizmo
    await axisYButton.click();

    let isOrtho = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.getActiveCamera().isOrthographicCamera === true;
    });
    expect(isOrtho).toBe(true);

    // Drag slightly on canvas to tilt into perspective (near +Y)
    const canvasBox = await canvas.boundingBox();
    const startX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const startY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 15, startY + 15, { steps: 5 });
    await page.mouse.up();

    // Verify it tilted into perspective
    isOrtho = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.getActiveCamera().isOrthographicCamera === true;
    });
    expect(isOrtho).toBe(false);

    // Click Nearest Orthographic View to snap to closest orthographic view (which should be +Y)
    await nearestOrthoBtn.click();

    // Should be orthographic again
    isOrtho = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.getActiveCamera().isOrthographicCamera === true;
    });
    expect(isOrtho).toBe(true);

    // Verify +Y is front-centered on gizmo
    const gizmoCenter = 55;
    const yTop = await axisYButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).top)
    );
    const yLeft = await axisYButton.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).left)
    );
    // Button center should be near gizmo center (within 10px)
    expect(Math.abs(yTop + 11 - gizmoCenter)).toBeLessThan(10);
    expect(Math.abs(yLeft + 11 - gizmoCenter)).toBeLessThan(10);
  });

  test("Single click selects vertex, whereas dragging does not trigger vertex selection", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const clearSelectionButton = page.getByTestId("clear-selection-button");

    // Initially no selection
    await expect(clearSelectionButton).toBeDisabled();

    // Drag across the canvas
    const canvasBox = await canvas.boundingBox();
    const startX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const startY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 50, { steps: 5 });
    await page.mouse.up();

    // Clear selection button remains disabled because dragging was a view rotation, not a click
    await expect(clearSelectionButton).toBeDisabled();

    // Now double click to switch to orthographic +Z (where vertices are well positioned)
    const axisZButton = page.getByTestId("gizmo-axis-+Z");
    await axisZButton.click();

    // In orthographic +Z view, vertex 0 is at (centerX - 84, centerY + 84)
    const vertexX = (canvasBox?.width ?? 800) / 2 - 84;
    const vertexY = (canvasBox?.height ?? 600) / 2 + 84;

    // Click vertex 0
    await canvas.click({ position: { x: vertexX, y: vertexY } });

    // Clear selection button should now be enabled
    await expect(clearSelectionButton).toBeEnabled();

    // Click empty space (e.g. at 50, 50)
    await canvas.click({ position: { x: 50, y: 50 } });

    // Clear selection button disabled again
    await expect(clearSelectionButton).toBeDisabled();
  });

  test("In Insert mode in perspective view, clicking Nearest Orthographic View switches to closest orthographic view without error dialog", async ({
    page,
  }) => {
    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    const errorDialog = page.getByTestId("error-dialog");
    const nearestOrthoBtn = page.getByTestId("nearest-ortho-view-button");

    // Click Nearest Orthographic View button
    await nearestOrthoBtn.click();

    // Ensure error dialog is NOT visible
    await expect(errorDialog).not.toBeVisible();

    // Verify camera is now orthographic
    const isOrtho = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.getActiveCamera().isOrthographicCamera === true;
    });
    expect(isOrtho).toBe(true);

    // Click to insert a vertex in the now-orthographic view
    await canvas.click({ position: { x: 300, y: 300 } });

    // Still no error dialog
    await expect(errorDialog).not.toBeVisible();
  });
});
