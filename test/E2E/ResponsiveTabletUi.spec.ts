import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Responsive Tablet UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector("[data-testid='viewport-canvas']");
  });

  test("Toolbar undo, redo, and help buttons display icons and no text", async ({
    page,
  }) => {
    const undoButton = page.getByTestId("undo-button");
    const redoButton = page.getByTestId("redo-button");
    const helpButton = page.getByTestId("help-button");

    await expect(undoButton).toBeVisible();
    await expect(redoButton).toBeVisible();
    await expect(helpButton).toBeVisible();

    expect(await undoButton.innerText()).toBe("");
    expect(await redoButton.innerText()).toBe("");
    expect(await helpButton.innerText()).toBe("");

    await expect(undoButton.locator("svg")).toBeVisible();
    await expect(redoButton.locator("svg")).toBeVisible();
    await expect(helpButton.locator("svg")).toBeVisible();
  });

  test("Portrait tablet (800x1280): 3D gizmo is at top-right of viewport and adjusts when Material Library opens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 1280 });

    const gizmo = page.getByTestId("3d-axis-gizmo");
    const canvas = page.getByTestId("viewport-canvas");
    await expect(gizmo).toBeVisible();

    const canvasBoxBefore = await canvas.boundingBox();
    const gizmoBoxBefore = await gizmo.boundingBox();
    expect(canvasBoxBefore).not.toBeNull();
    expect(gizmoBoxBefore).not.toBeNull();

    // Verify gizmo is near the top of the viewport canvas
    expect(gizmoBoxBefore!.y).toBeGreaterThanOrEqual(canvasBoxBefore!.y);
    expect(gizmoBoxBefore!.y).toBeLessThan(canvasBoxBefore!.y + 100);

    // Verify gizmo is near the right edge of the viewport canvas
    const rightMarginBefore =
      canvasBoxBefore!.x + canvasBoxBefore!.width - (gizmoBoxBefore!.x + gizmoBoxBefore!.width);
    expect(rightMarginBefore).toBeGreaterThanOrEqual(15);
    expect(rightMarginBefore).toBeLessThanOrEqual(30);

    // Open Material Library (docked to the left by default)
    const matLibButton = page.getByTestId("material-library-button");
    await matLibButton.click();

    const matPanel = page.getByTestId("material-library-panel");
    await expect(matPanel).toBeVisible();

    // Dock Material Library to the right side
    const dockButton = page.getByTestId("dock-material-library-button");
    await dockButton.click();

    const matPanelBox = await matPanel.boundingBox();
    const canvasBoxAfter = await canvas.boundingBox();
    const gizmoBoxAfter = await gizmo.boundingBox();
    expect(matPanelBox).not.toBeNull();
    expect(canvasBoxAfter).not.toBeNull();
    expect(gizmoBoxAfter).not.toBeNull();

    // Viewport canvas width should have decreased to accommodate Material Library on the right
    expect(canvasBoxAfter!.width).toBeLessThan(canvasBoxBefore!.width);

    // Gizmo must have shifted leftward and remain strictly to the left of the Material Library panel
    expect(gizmoBoxAfter!.x + gizmoBoxAfter!.width).toBeLessThanOrEqual(matPanelBox!.x);

    // Gizmo right edge should remain ~20px from the new right edge of the viewport canvas
    const rightMarginAfter =
      canvasBoxAfter!.x + canvasBoxAfter!.width - (gizmoBoxAfter!.x + gizmoBoxAfter!.width);
    expect(rightMarginAfter).toBeGreaterThanOrEqual(15);
    expect(rightMarginAfter).toBeLessThanOrEqual(30);
  });

  test("Portrait tablet (800x1280): Assign Material button in Material Library is fully visible and not clipped", async ({
    page,
  }) => {
    const viewportHeight = 1280;
    await page.setViewportSize({ width: 800, height: viewportHeight });

    // Open Material Library
    await page.getByTestId("material-library-button").click();
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // Add a new material so the detail view and assign button appear
    await page.getByTestId("add-material-button").click();

    const assignButton = page.getByTestId("assign-material-button");
    await expect(assignButton).toBeVisible();

    const assignBox = await assignButton.boundingBox();
    expect(assignBox).not.toBeNull();

    // Verify Assign Material button is completely within the visible screen height (not pushed offscreen)
    const buttonBottom = assignBox!.y + assignBox!.height;
    expect(buttonBottom).toBeLessThanOrEqual(viewportHeight);
    expect(assignBox!.y).toBeGreaterThan(0);
  });

  test("Landscape tablet (1280x650): Assign Material button and top-right gizmo are not clipped on short height", async ({
    page,
  }) => {
    const viewportHeight = 650;
    await page.setViewportSize({ width: 1280, height: viewportHeight });

    const gizmo = page.getByTestId("3d-axis-gizmo");
    await expect(gizmo).toBeVisible();

    const gizmoBox = await gizmo.boundingBox();
    expect(gizmoBox).not.toBeNull();
    expect(gizmoBox!.y + gizmoBox!.height).toBeLessThanOrEqual(viewportHeight);

    // Open Material Library
    await page.getByTestId("material-library-button").click();
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // Add a material
    await page.getByTestId("add-material-button").click();

    const assignButton = page.getByTestId("assign-material-button");
    await expect(assignButton).toBeVisible();

    const assignBox = await assignButton.boundingBox();
    expect(assignBox).not.toBeNull();

    // Ensure the button bottom is within the 650px visible viewport height
    expect(assignBox!.y + assignBox!.height).toBeLessThanOrEqual(viewportHeight);

    // Dock Material Library to the right side
    await page.getByTestId("dock-material-library-button").click();
    const matPanelBox = await page.getByTestId("material-library-panel").boundingBox();
    const updatedGizmoBox = await gizmo.boundingBox();
    expect(updatedGizmoBox!.x + updatedGizmoBox!.width).toBeLessThanOrEqual(matPanelBox!.x);
  });

  test("Side tool bar left/right toggle adjusts 3D gizmo position correctly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const gizmo = page.getByTestId("3d-axis-gizmo");
    const canvas = page.getByTestId("viewport-canvas");

    const canvasBoxInitial = await canvas.boundingBox();
    const gizmoBoxInitial = await gizmo.boundingBox();

    // Open Customize UI dialog
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("customize-ui-button").click();
    await expect(page.getByTestId("customize-ui-modal")).toBeVisible();

    // Dock Side Tool Bar to the Left
    await page.getByTestId("side-toolbar-toggle-button").click();
    await page.getByTestId("customize-ui-save-button").click();
    await expect(page.getByTestId("customize-ui-modal")).not.toBeVisible();

    // Side toolbar is now on the left. The right edge of the canvas is now at window edge (1024)
    const canvasBoxAfter = await canvas.boundingBox();
    const gizmoBoxAfter = await gizmo.boundingBox();

    expect(canvasBoxAfter!.x).toBeGreaterThan(canvasBoxInitial!.x);
    // Gizmo at top right of canvas should now be closer to screen right (1024)
    expect(gizmoBoxAfter!.x).toBeGreaterThan(gizmoBoxInitial!.x);
    expect(gizmoBoxAfter!.x + gizmoBoxAfter!.width).toBeLessThanOrEqual(1024);
  });
});
