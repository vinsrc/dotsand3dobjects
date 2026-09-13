import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Issue #7 Side Tool Bar Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("toolbar")).toBeVisible();
    await expect(page.getByTestId("side-toolbar")).toBeVisible();
  });

  test("Side tool bar is docked to the right edge with vertical button placement", async ({
    page,
  }) => {
    const sideToolbar = page.getByTestId("side-toolbar");
    await expect(sideToolbar).toBeVisible();

    // Verify it is positioned on the right half of the viewport
    const sideBox = await sideToolbar.boundingBox();
    const viewportSize = page.viewportSize();
    expect(sideBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();
    expect(sideBox!.x + sideBox!.width).toBeCloseTo(viewportSize!.width, 0);

    // Verify all side-toolbar buttons are present in order
    const buttonTestIds = [
      "mode-3d-view-button",
      "center-object-button",
      "mode-transform-button",
      "delete-vertex-button",
      "delete-edge-button",
      "face-delete-button",
      "mode-insert-button",
      "mode-translate-button",
      "mode-fill-button",
      "face-fill-button",
    ];

    for (const testId of buttonTestIds) {
      const button = sideToolbar.getByTestId(testId);
      await expect(button).toBeVisible();
    }

    // Verify vertical placement (each subsequent button is positioned below the previous one)
    for (let index = 0; index < buttonTestIds.length - 1; index += 1) {
      const currentButton = sideToolbar.getByTestId(buttonTestIds[index] as string);
      const nextButton = sideToolbar.getByTestId(buttonTestIds[index + 1] as string);

      const currentBox = await currentButton.boundingBox();
      const nextBox = await nextButton.boundingBox();

      expect(currentBox).not.toBeNull();
      expect(nextBox).not.toBeNull();
      expect(nextBox!.y).toBeGreaterThan(currentBox!.y);
    }
  });

  test("Clear selection and Delete vertex buttons are enabled only when at least one vertex is selected", async ({
    page,
  }) => {
    const sideToolbar = page.getByTestId("side-toolbar");
    const clearSelectionButton = page.getByTestId("clear-selection-button");
    const deleteVertexButton = sideToolbar.getByTestId("delete-vertex-button");

    // Initially with no vertices selected, both buttons must be disabled
    await expect(clearSelectionButton).toBeDisabled();
    await expect(deleteVertexButton).toBeDisabled();

    // Select a vertex (+Z orthographic view for precise picking)
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(300);

    // Click near top-right corner of the unit cube
    const canvas = page.locator("canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const canvasCenterX = canvasBox!.x + canvasBox!.width / 2;
    const canvasCenterY = canvasBox!.y + canvasBox!.height / 2;

    // Tap a vertex at (1, 1, 1) in orthographic +Z
    await page.mouse.click(canvasCenterX + 100, canvasCenterY - 100);

    // Both buttons should now be enabled
    await expect(clearSelectionButton).toBeEnabled();
    await expect(deleteVertexButton).toBeEnabled();

    // Clicking Clear selection should disable them again
    await clearSelectionButton.click();
    await expect(clearSelectionButton).toBeDisabled();
    await expect(deleteVertexButton).toBeDisabled();
  });

  test("Auto Connect button is shown only in Insert Mode", async ({ page }) => {
    const sideToolbar = page.getByTestId("side-toolbar");
    const autoConnectButton = page.getByTestId("auto-connect-toggle-button");

    // Initially in default mode, Auto Connect is not shown
    await expect(autoConnectButton).not.toBeVisible();

    // Enter Insert Mode
    await sideToolbar.getByTestId("mode-insert-button").click();
    await expect(autoConnectButton).toBeVisible();
    await expect(autoConnectButton).toHaveText("Auto Connect: OFF");

    // Click to toggle Auto Connect
    await autoConnectButton.click();
    await expect(autoConnectButton).toHaveText("Auto Connect: ON");

    // Exit Insert Mode by clicking Insert again
    await sideToolbar.getByTestId("mode-insert-button").click();
    await expect(autoConnectButton).not.toBeVisible();
  });

  test("Face Fill button is always shown and enabled only when at least 3 vertices are selected", async ({
    page,
  }) => {
    const sideToolbar = page.getByTestId("side-toolbar");
    const faceFillButton = page.getByTestId("face-fill-button");

    // Initially in default mode, Face Fill is visible but disabled (0 vertices selected)
    await expect(faceFillButton).toBeVisible();
    await expect(faceFillButton).toBeDisabled();

    // Switch to orthographic view for precise picking
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(300);

    const canvas = page.locator("canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = canvasBox!.x + canvasBox!.width / 2;
    const centerY = canvasBox!.y + canvasBox!.height / 2;

    // Enable multi-select to select multiple vertices
    await page.getByTestId("mode-multi-select-button").click();

    // Pick vertex 1 (1, 1, 1)
    await page.mouse.click(centerX + 100, centerY - 100);
    await expect(faceFillButton).toBeDisabled();

    // Select vertex 2 (-1, 1, 1)
    await page.mouse.click(centerX - 100, centerY - 100);
    await expect(faceFillButton).toBeDisabled();

    // Select vertex 3 (-1, -1, 1)
    await page.mouse.click(centerX - 100, centerY + 100);

    // With 3 vertices selected, Face Fill must be enabled!
    await expect(faceFillButton).toBeEnabled();

    // Clear selection disables it again
    await page.getByTestId("clear-selection-button").click();
    await expect(faceFillButton).toBeDisabled();
  });
});
