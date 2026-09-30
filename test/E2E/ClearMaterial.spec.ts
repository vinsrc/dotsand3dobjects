import { test, expect } from "@playwright/test";

test.describe("Clear Material Button Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
    await expect(page.getByTestId("toolbar")).toBeVisible();
  });

  test("Clear Material button is not visible when no face is selected, and appears when a face is selected", async ({
    page,
  }) => {
    // Initially no face is selected, button should not be present
    await expect(page.getByTestId("clear-material-button")).toHaveCount(0);

    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    let canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    let centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    let centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Click front face to select it
    await page.mouse.click(centerX, centerY);

    // Clear Material button should now be visible on top toolbar
    const clearButton = page.getByTestId("clear-material-button");
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toHaveText("Clear Material");

    // Click front face again to deselect it
    canvasBox = await canvas.boundingBox();
    centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;
    await page.mouse.click(centerX, centerY);

    // Clear Material button should disappear when selection is cleared
    await expect(page.getByTestId("clear-material-button")).toHaveCount(0);
  });

  test("Clicking Clear Material button removes material assignment from the face", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select face
    await page.mouse.click(centerX, centerY);

    // Material Library panel auto-opens on face selection
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // Create a material and assign it to the face
    await page.getByTestId("add-material-button").click();
    await page.getByTestId("assign-material-button").click();

    // Verify face has material assigned
    let hasAssignedMaterial = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.faces?.some((face: any) => face.materialId !== null);
    });
    expect(hasAssignedMaterial).toBe(true);

    // Click Clear Material button in top toolbar
    const clearButton = page.getByTestId("clear-material-button");
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Verify face material assignment is cleared
    hasAssignedMaterial = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.faces?.some((face: any) => face.materialId !== null);
    });
    expect(hasAssignedMaterial).toBe(false);
  });

  test("Clearing material supports Undo and Redo", async ({ page }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select face and assign material
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("add-material-button").click();
    await page.getByTestId("assign-material-button").click();

    // Clear material via top toolbar button
    await page.getByTestId("clear-material-button").click();

    // Verify material is cleared
    let hasMaterial = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.faces?.some((face: any) => face.materialId !== null);
    });
    expect(hasMaterial).toBe(false);

    // Undo via side toolbar button
    await page.getByTestId("undo-button").click();

    // Verify material is restored
    hasMaterial = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.faces?.some((face: any) => face.materialId !== null);
    });
    expect(hasMaterial).toBe(true);

    // Redo via side toolbar button
    await page.getByTestId("redo-button").click();

    // Verify material is cleared again
    hasMaterial = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.faces?.some((face: any) => face.materialId !== null);
    });
    expect(hasMaterial).toBe(false);
  });

  test("Clear material removes material assignment across multiple selected faces", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select front face and assign material
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("add-material-button").click();
    await page.getByTestId("assign-material-button").click();

    // Enter MULTI_SELECT mode and select right face in +X view
    await page.getByTestId("mode-multi-select-button").click();
    await page.waitForTimeout(200);
    await page.getByTestId("gizmo-axis-+X").click();

    const newCanvasBox = await canvas.boundingBox();
    const rightCenterX = (newCanvasBox?.x ?? 0) + (newCanvasBox?.width ?? 0) / 2;
    const rightCenterY = (newCanvasBox?.y ?? 0) + (newCanvasBox?.height ?? 0) / 2;
    await page.mouse.click(rightCenterX, rightCenterY);

    // Assign material to both selected faces
    await page.getByTestId("assign-material-button").click();

    const assignedCountBefore = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.faces?.filter((face: any) => face.materialId !== null).length ?? 0;
    });
    expect(assignedCountBefore).toBeGreaterThanOrEqual(2);

    // Clear Material on all selected faces
    const clearButton = page.getByTestId("clear-material-button");
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Verify all selected faces have material cleared
    const assignedCountAfter = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.faces?.filter((face: any) => face.materialId !== null).length ?? 0;
    });
    expect(assignedCountAfter).toBe(0);
  });

  test("Clear Material button is located in mode-specific-buttons on right side of top toolbar, stacked after Add Decal Plane button", async ({
    page,
  }) => {
    // Switch to orthographic +Z view and select front face
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    await page.mouse.click(centerX, centerY);

    // Verify mode-specific-buttons container
    const modeButtons = page.getByTestId("mode-specific-buttons");
    await expect(modeButtons).toBeVisible();

    // Verify clear-material-button is inside mode-specific-buttons
    const clearButton = modeButtons.getByTestId("clear-material-button");
    await expect(clearButton).toBeVisible();

    // Verify add-decal-plane-button is also present
    const addDecalButton = modeButtons.getByTestId("add-decal-plane-button");
    await expect(addDecalButton).toBeVisible();

    // Verify toolbar layout: mode-specific-buttons is on the right side of the toolbar
    const toolbarBox = await page.getByTestId("toolbar").boundingBox();
    const modeButtonsBox = await modeButtons.boundingBox();
    expect(toolbarBox).not.toBeNull();
    expect(modeButtonsBox).not.toBeNull();
    expect(modeButtonsBox!.x).toBeGreaterThan(toolbarBox!.x + toolbarBox!.width / 2);

    // Verify clear-material-button is stacked after add-decal-plane-button horizontally
    const addDecalBox = await addDecalButton.boundingBox();
    const clearBox = await clearButton.boundingBox();
    expect(addDecalBox).not.toBeNull();
    expect(clearBox).not.toBeNull();
    expect(clearBox!.x).toBeGreaterThan(addDecalBox!.x);

    // Verify DOM order within mode-specific-buttons container
    const isStackedAfter = await page.evaluate(() => {
      const modeContainer = document.querySelector('[data-testid="mode-specific-buttons"]');
      const addDecalEl = modeContainer?.querySelector('[data-testid="add-decal-plane-button"]');
      const clearEl = modeContainer?.querySelector('[data-testid="clear-material-button"]');
      if (!addDecalEl || !clearEl) return false;
      return !!(addDecalEl.compareDocumentPosition(clearEl) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(isStackedAfter).toBe(true);
  });
});

