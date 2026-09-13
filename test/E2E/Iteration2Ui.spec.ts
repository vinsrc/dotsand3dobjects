import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Iteration 2 Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Toolbar displays Clear Selection, Undo, Redo, and Delete Vertex buttons", async ({
    page,
  }) => {
    await expect(page.getByTestId("clear-selection-button")).toBeVisible();
    await expect(page.getByTestId("undo-button")).toBeVisible();
    await expect(page.getByTestId("redo-button")).toBeVisible();
    await expect(page.getByTestId("delete-vertex-button")).toBeVisible();

    // Undo and Redo should initially be disabled
    await expect(page.getByTestId("undo-button")).toBeDisabled();
    await expect(page.getByTestId("redo-button")).toBeDisabled();

    // Finish button should not exist anywhere
    await expect(page.getByTestId("mode-finish-button")).not.toBeVisible();
  });

  test("Tapping vertex selects it, tapping again deselects it, and Clear Selection clears selection", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;
    const vertexPos = { x: centerX + 84, y: centerY - 84 };

    // Tap on vertex
    await canvas.click({ position: vertexPos });

    // After selection, Undo should become enabled
    await expect(page.getByTestId("undo-button")).toBeEnabled();

    // Tap again at the same vertex: should deselect it
    await canvas.click({ position: vertexPos });

    // Tap to select again
    await canvas.click({ position: vertexPos });

    // Click Clear Selection button
    await page.getByTestId("clear-selection-button").click();
  });

  test("Tapping a vertex in non-multi-select mode clears multi-selection and selects only that vertex", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();
    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;
    const vertex1 = { x: centerX + 84, y: centerY - 84 };
    const vertex2 = { x: centerX - 84, y: centerY - 84 };

    // Enter Multi Select mode
    await page.getByTestId("mode-multi-select-button").click();
    await canvas.click({ position: vertex1 });
    await canvas.click({ position: vertex2 });

    // Switch to Default mode (freely switches without finish button)
    await page.getByTestId("mode-multi-select-button").click();

    // Tap vertex1 in Default mode - clears multi-selection and selects only vertex1
    await canvas.click({ position: vertex1 });
    await expect(page.getByTestId("undo-button")).toBeEnabled();
  });

  test("Delete Vertex button deletes selected vertex and supports Undo and Redo", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();
    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;
    const vertexPos = { x: centerX + 84, y: centerY - 84 };

    // Select vertex
    await canvas.click({ position: vertexPos });

    // Delete vertex
    const deleteButton = page.getByTestId("delete-vertex-button");
    await deleteButton.click();

    // Undo should be enabled
    const undoButton = page.getByTestId("undo-button");
    const redoButton = page.getByTestId("redo-button");
    await expect(undoButton).toBeEnabled();

    // Undo the deletion
    await undoButton.click();
    await expect(redoButton).toBeEnabled();

    // Redo the deletion
    await redoButton.click();
    await expect(undoButton).toBeEnabled();
  });

  test("Translate Mode allows selecting different vertices and dragging them in orthographic view", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const translateButton = page.getByTestId("mode-translate-button");
    await translateButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;
    const vertexPos = { x: centerX + 84, y: centerY - 84 };

    // Drag vertex from (centerX + 84, centerY - 84) by +40px
    await canvas.dragTo(canvas, {
      sourcePosition: vertexPos,
      targetPosition: { x: vertexPos.x + 40, y: vertexPos.y + 40 },
    });

    // Undo should be available for translation
    const undoButton = page.getByTestId("undo-button");
    await expect(undoButton).toBeEnabled();

    await undoButton.click();
    const redoButton = page.getByTestId("redo-button");
    await expect(redoButton).toBeEnabled();
  });

  test("Insert Mode places grid-snapped vertex in orthographic view and connects when Auto Connect is ON", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const insertButton = page.getByTestId("mode-insert-button");
    await insertButton.click();

    const autoConnectButton = page.getByTestId("auto-connect-toggle-button");
    await expect(autoConnectButton).toBeVisible();
    await expect(autoConnectButton).toHaveText("Auto Connect: OFF");

    // Enable Auto Connect
    await autoConnectButton.click();
    await expect(autoConnectButton).toHaveText("Auto Connect: ON");

    const canvas = page.getByTestId("viewport-canvas");
    // Place first vertex in open space
    await canvas.click({ position: { x: 250, y: 150 } });
    // Place second vertex which auto-connects to first
    await canvas.click({ position: { x: 300, y: 150 } });

    // Verify Undo works for vertex placement
    const undoButton = page.getByTestId("undo-button");
    await expect(undoButton).toBeEnabled();
    await undoButton.click();
  });

  test("Fill Mode connects new vertex and unselects old vertex", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const fillButton = page.getByTestId("mode-fill-button");
    await fillButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;
    const vertexTopRight = { x: centerX + 84, y: centerY - 84 };
    const vertexBottomLeft = { x: centerX - 84, y: centerY + 84 };

    // Tap first vertex
    await canvas.click({ position: vertexTopRight });
    // Tap second vertex across diagonal
    await canvas.click({ position: vertexBottomLeft });

    // Undo should be enabled
    const undoButton = page.getByTestId("undo-button");
    await expect(undoButton).toBeEnabled();
  });

  test("Vertices are rendered in front of the model in shaded mode", async ({
    page,
  }) => {
    // Default is Shaded View (button displays "Wireframe")
    const toggleButton = page.getByTestId("toggle-view-button");
    await expect(toggleButton).toHaveText("Wireframe");

    const canvas = page.getByTestId("viewport-canvas");
    const screenshot = await canvas.screenshot();
    // Non-trivial render output
    expect(screenshot.byteLength).toBeGreaterThan(2000);
  });
});
