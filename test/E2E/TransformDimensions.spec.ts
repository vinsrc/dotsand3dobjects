import { test, expect } from "@playwright/test";

test.describe("Transform Mode Dimensions Dialog Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Transform dimension dialog is hidden in default perspective view and shows error on entering transform", async ({
    page,
  }) => {
    // Dimension dialog should not exist initially
    const dialog = page.getByTestId("transform-dimension-dialog");
    await expect(dialog).not.toBeVisible();

    // Clicking Transform in perspective view shows error
    const transformBtn = page.getByTestId("mode-transform-button");
    await transformBtn.click();

    const errorDialog = page.getByTestId("error-dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText("Switch to an Orthographic view");

    await page.getByTestId("error-dismiss-button").click();
    await expect(dialog).not.toBeVisible();
  });

  test("Transform dimension dialog appears in orthographic view, shows X, Y, Z inputs, and allows setting exact size", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    // Enter Transform mode
    const transformBtn = page.getByTestId("mode-transform-button");
    await transformBtn.click();

    // Dialog should be visible
    const dialog = page.getByTestId("transform-dimension-dialog");
    await expect(dialog).toBeVisible();

    // Inputs should display default cube dimensions (2, 2, 2)
    const inputX = page.getByTestId("dimension-input-x");
    const inputY = page.getByTestId("dimension-input-y");
    const inputZ = page.getByTestId("dimension-input-z");
    const uniformToggle = page.getByTestId("dimension-uniform-toggle");
    const applyButton = page.getByTestId("dimension-apply-button");

    await expect(inputX).toHaveValue("2");
    await expect(inputY).toHaveValue("2");
    await expect(inputZ).toHaveValue("2");
    await expect(uniformToggle).toBeChecked();

    // Change X to 4 with Uniform checked -> Y and Z should update to 4
    await inputX.fill("4");
    await expect(inputY).toHaveValue("4");
    await expect(inputZ).toHaveValue("4");

    // Click Apply
    await applyButton.click();
    await page.waitForTimeout(100);

    // Inputs reflect applied size
    await expect(inputX).toHaveValue("4");
    await expect(inputY).toHaveValue("4");
    await expect(inputZ).toHaveValue("4");

    // Uncheck Uniform
    await uniformToggle.uncheck();
    await expect(uniformToggle).not.toBeChecked();

    // Change only X to 6
    await inputX.fill("6");
    await expect(inputY).toHaveValue("4");
    await expect(inputZ).toHaveValue("4");

    // Apply non-uniform change
    await applyButton.click();
    await page.waitForTimeout(100);

    await expect(inputX).toHaveValue("6");
    await expect(inputY).toHaveValue("4");
    await expect(inputZ).toHaveValue("4");

    // Test Undo
    const undoButton = page.getByTestId("undo-button");
    await undoButton.click();
    await page.waitForTimeout(100);

    await expect(inputX).toHaveValue("4");
    await expect(inputY).toHaveValue("4");
    await expect(inputZ).toHaveValue("4");

    // Test Redo
    const redoButton = page.getByTestId("redo-button");
    await redoButton.click();
    await page.waitForTimeout(100);

    await expect(inputX).toHaveValue("6");
    await expect(inputY).toHaveValue("4");
    await expect(inputZ).toHaveValue("4");

    // Exiting Transform mode hides the dialog
    await transformBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test("Pressing Enter inside dimension input applies dimensions", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    const transformBtn = page.getByTestId("mode-transform-button");
    await transformBtn.click();

    const inputX = page.getByTestId("dimension-input-x");
    const inputY = page.getByTestId("dimension-input-y");
    const inputZ = page.getByTestId("dimension-input-z");

    await inputX.fill("3.5");
    await inputX.press("Enter");
    await page.waitForTimeout(100);

    await expect(inputX).toHaveValue("3.5");
    await expect(inputY).toHaveValue("3.5");
    await expect(inputZ).toHaveValue("3.5");
  });

  test("Transform dimension dialog shows decal size when decal is selected", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    // Click canvas to select face
    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(100);

    const addDecalBtn = page.getByTestId("add-decal-plane-button");
    await expect(addDecalBtn).toBeVisible();
    await addDecalBtn.click();
    await page.waitForTimeout(200);

    // Enter Transform mode
    const transformBtn = page.getByTestId("mode-transform-button");
    await transformBtn.click();

    const dialog = page.getByTestId("transform-dimension-dialog");
    await expect(dialog).toBeVisible();

    const decalInput = page.getByTestId("dimension-input-size");
    await expect(decalInput).toBeVisible();

    const initialSize = await decalInput.inputValue();
    expect(parseFloat(initialSize)).toBeGreaterThan(0);

    await decalInput.fill("2.5");
    await page.getByTestId("dimension-apply-button").click();
    await page.waitForTimeout(100);

    await expect(decalInput).toHaveValue("2.5");

    // Undo
    await page.getByTestId("undo-button").click();
    await page.waitForTimeout(100);
    await expect(decalInput).toHaveValue(initialSize);
  });

  test("Rotating the camera with mouse unsets Transform mode button and hides dialog", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    // Enter Transform mode
    const transformBtn = page.getByTestId("mode-transform-button");
    await transformBtn.click();

    // Button should be active (accent background) and dialog should be visible
    const dialog = page.getByTestId("transform-dimension-dialog");
    await expect(dialog).toBeVisible();

    // Get canvas coordinates far outside model to drag/orbit camera
    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const dragStartX = (canvasBox?.x ?? 0) + 40;
    const dragStartY = (canvasBox?.y ?? 0) + 40;

    // Drag to rotate camera into perspective
    await page.mouse.move(dragStartX, dragStartY);
    await page.mouse.down();
    await page.mouse.move(dragStartX + 80, dragStartY + 40, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Dialog should be gone
    await expect(dialog).not.toBeVisible();

    // Transform button should no longer be active - clicking it now in perspective will show error modal
    await transformBtn.click();
    const errorDialog = page.getByTestId("error-dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText("Switch to an Orthographic view");
    await page.getByTestId("error-dismiss-button").click();
  });

  test("Rotating the camera with mouse unsets Move Vertex mode button", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    // Enter Move Vertex (TRANSLATE) mode
    const translateBtn = page.getByTestId("mode-translate-button");
    await translateBtn.click();

    // Get canvas coordinates in open space to drag/orbit camera
    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const dragStartX = (canvasBox?.x ?? 0) + 40;
    const dragStartY = (canvasBox?.y ?? 0) + 40;

    // Drag to rotate camera into perspective
    await page.mouse.move(dragStartX, dragStartY);
    await page.mouse.down();
    await page.mouse.move(dragStartX + 80, dragStartY + 40, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Clicking Move Vertex in perspective should show error modal (confirming it was unset)
    await translateBtn.click();
    const errorDialog = page.getByTestId("error-dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText("Switch to an Orthographic view");
    await page.getByTestId("error-dismiss-button").click();
  });
});
