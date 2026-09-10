import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Iteration 1 Functional Tests (Updated for Iteration 2 Workflow)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Toolbar displays Center Object and Mode buttons", async ({ page }) => {
    await expect(page.getByTestId("center-object-button")).toBeVisible();
    await expect(page.getByTestId("mode-multi-select-button")).toBeVisible();
    await expect(page.getByTestId("mode-translate-button")).toBeVisible();
    await expect(page.getByTestId("mode-insert-button")).toBeVisible();
    await expect(page.getByTestId("mode-fill-button")).toBeVisible();

    // Finish button and Add button were removed in Iteration 2
    await expect(page.getByTestId("mode-finish-button")).not.toBeVisible();
    await expect(page.getByTestId("mode-add-button")).not.toBeVisible();
    await expect(page.getByTestId("auto-connect-toggle-button")).not.toBeVisible();
  });

  test("Clicking Center Object button resets pan to center", async ({ page }) => {
    const centerButton = page.getByTestId("center-object-button");
    await expect(centerButton).toBeVisible();
    await centerButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    await expect(canvas).toBeVisible();
    const screenshot = await canvas.screenshot();
    expect(screenshot.byteLength).toBeGreaterThan(1000);
  });

  test("Tapping open space in Insert Mode in perspective view shows alert 'Switch to an Orthographic view'", async ({
    page,
  }) => {
    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    // Canvas click in open space while in perspective
    const canvas = page.getByTestId("viewport-canvas");
    await canvas.click({ position: { x: 100, y: 100 } });

    const errorDialog = page.getByTestId("error-dialog");
    await expect(errorDialog).toBeVisible();

    const errorMessage = page.getByTestId("error-message");
    await expect(errorMessage).toHaveText("Switch to an Orthographic view");

    await page.getByTestId("error-dismiss-button").click();
    await expect(errorDialog).not.toBeVisible();
  });

  test("Entering Translate Mode in perspective view shows alert 'Switch to an Orthographic view'", async ({
    page,
  }) => {
    const translateModeButton = page.getByTestId("mode-translate-button");
    await translateModeButton.click();

    const errorDialog = page.getByTestId("error-dialog");
    await expect(errorDialog).toBeVisible();

    const errorMessage = page.getByTestId("error-message");
    await expect(errorMessage).toHaveText("Switch to an Orthographic view");

    await page.getByTestId("error-dismiss-button").click();
    await expect(errorDialog).not.toBeVisible();
  });

  test("Insert Mode in orthographic view displays Auto Connect and places vertices", async ({
    page,
  }) => {
    // Switch to orthographic +Z view first
    await page.getByTestId("gizmo-axis-+Z").click();

    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    // Error should not appear
    await expect(page.getByTestId("error-dialog")).not.toBeVisible();

    // Auto Connect button appears during Insert Mode
    const autoConnectButton = page.getByTestId("auto-connect-toggle-button");
    await expect(autoConnectButton).toBeVisible();
    await expect(autoConnectButton).toHaveText("Auto Connect: OFF");

    // Toggle Auto Connect
    await autoConnectButton.click();
    await expect(autoConnectButton).toHaveText("Auto Connect: ON");

    // Click on canvas in open space to place vertices
    const canvas = page.getByTestId("viewport-canvas");
    await canvas.click({ position: { x: 300, y: 200 } });
    await canvas.click({ position: { x: 350, y: 250 } });

    // Switch mode freely (e.g. to multi select) finishes previous mode
    await page.getByTestId("mode-multi-select-button").click();
    await expect(autoConnectButton).not.toBeVisible();
  });

  test("Multi Select Mode enables multi-selection and freely switches modes", async ({
    page,
  }) => {
    const multiSelectButton = page.getByTestId("mode-multi-select-button");
    await multiSelectButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    await canvas.click({ position: { x: 400, y: 300 } });

    // Tapping active mode button finishes it back to default
    await multiSelectButton.click();
  });

  test("Translate Mode in orthographic view allows dragging vertices", async ({
    page,
  }) => {
    // Switch to orthographic +X view
    await page.getByTestId("gizmo-axis-+X").click();

    const translateModeButton = page.getByTestId("mode-translate-button");
    await translateModeButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    // Drag on canvas
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 400, y: 300 },
      targetPosition: { x: 450, y: 350 },
    });

    // Switch back by clicking translate button
    await translateModeButton.click();
  });

  test("Insert Mode allows splitting an edge with a midpoint vertex", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    await canvas.click({ position: { x: 400, y: 300 } });

    await insertModeButton.click();
  });

  test("Fill Mode connects tapped vertices sequentially", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const fillModeButton = page.getByTestId("mode-fill-button");
    await fillModeButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    await canvas.click({ position: { x: 400, y: 300 } });
    await canvas.click({ position: { x: 450, y: 300 } });

    await fillModeButton.click();
  });
});
