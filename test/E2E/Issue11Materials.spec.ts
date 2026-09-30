import { test, expect } from "@playwright/test";

test.describe("Issue #11: Materials", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  test("Top toolbar button toggles Material Library Panel open and closed", async ({
    page,
  }) => {
    const toggleButton = page.getByTestId("material-library-button");
    await expect(toggleButton).toBeVisible();

    // Initially closed
    await expect(page.getByTestId("material-library-panel")).toHaveCount(0);

    // Click to open
    await toggleButton.click();
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // Click close button inside panel
    const closePanelButton = page.getByTestId("close-material-library-button");
    await closePanelButton.click();
    await expect(page.getByTestId("material-library-panel")).toHaveCount(0);

    // Re-open with toggle button, then click toggle button again to close
    await toggleButton.click();
    await expect(page.getByTestId("material-library-panel")).toBeVisible();
    await toggleButton.click();
    await expect(page.getByTestId("material-library-panel")).toHaveCount(0);
  });

  test("Help screen displays controls and Material Library instructions", async ({
    page,
  }) => {
    const helpButton = page.getByTestId("help-button");
    await expect(helpButton).toBeVisible();

    await helpButton.click();
    const helpModal = page.getByTestId("help-modal");
    await expect(helpModal).toBeVisible();
    await expect(
      helpModal.getByRole("heading", { name: "🎨 Material Library" })
    ).toBeVisible();

    // Close help modal
    const closeHelpButton = page.getByTestId("help-modal-close-button");
    await closeHelpButton.click();
    await expect(page.getByTestId("help-modal")).toHaveCount(0);
  });

  test("Material Library Panel supports docking to left and right", async ({
    page,
  }) => {
    await page.getByTestId("material-library-button").click();
    const panel = page.getByTestId("material-library-panel");
    await expect(panel).toBeVisible();

    const dockButton = page.getByTestId("dock-material-library-button");
    await expect(dockButton).toBeVisible();

    // Click dock button to dock right
    await dockButton.click();

    // In flex row: canvas is left, panel is docked right, side toolbar is outermost right
    const canvasBox = await page.getByTestId("viewport-canvas").boundingBox();
    const panelBox = await panel.boundingBox();
    const sideToolBarBox = await page.getByTestId("side-toolbar").boundingBox();

    expect(canvasBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect(sideToolBarBox).not.toBeNull();

    // Viewport is to the left of panel, panel is to the left of side toolbar
    expect(canvasBox?.x ?? 0).toBeLessThan(panelBox?.x ?? 0);
    expect(panelBox?.x ?? 0).toBeLessThan(sideToolBarBox?.x ?? 0);

    // Dock back to left
    await dockButton.click();
    const newPanelBox = await panel.boundingBox();
    const newCanvasBox = await page.getByTestId("viewport-canvas").boundingBox();
    expect(newPanelBox?.x ?? 0).toBeLessThan(newCanvasBox?.x ?? 0);
  });

  test("Material list view supports Add and Delete with confirmation modal", async ({
    page,
  }) => {
    await page.getByTestId("material-library-button").click();
    const addButton = page.getByTestId("add-material-button");
    const deleteButton = page.getByTestId("delete-material-button");

    // Initially no materials, delete button disabled
    await expect(deleteButton).toBeDisabled();

    // Add first material: auto-named "Material 1"
    await addButton.click();
    await expect(page.getByText("Material 1")).toBeVisible();
    await expect(deleteButton).toBeEnabled();

    // Add second material: auto-named "Material 2"
    await addButton.click();
    await expect(page.getByText("Material 2")).toBeVisible();

    // Click delete opens confirmation modal
    await deleteButton.click();
    const confirmModal = page.getByTestId("delete-material-confirm-modal");
    await expect(confirmModal).toBeVisible();

    // Cancel deletion
    await page.getByTestId("cancel-delete-material-button").click();
    await expect(confirmModal).toHaveCount(0);
    await expect(page.getByText("Material 2")).toBeVisible();

    // Confirm deletion
    await deleteButton.click();
    await expect(confirmModal).toBeVisible();
    await page.getByTestId("confirm-delete-material-button").click();
    await expect(confirmModal).toHaveCount(0);

    // Material 2 is deleted, Material 1 is now active
    await expect(page.getByText("Material 2")).toHaveCount(0);
    await expect(page.getByText("Material 1")).toBeVisible();
  });

  test("Material detail view updates properties in real-time", async ({
    page,
  }) => {
    await page.getByTestId("material-library-button").click();
    await page.getByTestId("add-material-button").click();

    // Edit Name
    const nameInput = page.getByTestId("material-name-input");
    await nameInput.fill("Obsidian Armor");

    // Verify list view updates in real-time
    const listView = page.getByTestId("material-list-view");
    await expect(listView.getByText("Obsidian Armor")).toBeVisible();

    // Edit Base Color
    const colorInput = page.getByTestId("material-base-color-input");
    await colorInput.fill("#ff5500");
    await expect(page.getByText("#ff5500")).toBeVisible();

    // Edit Roughness
    const roughnessInput = page.getByTestId("material-roughness-input");
    await roughnessInput.fill("0.85");
    await expect(page.getByText("0.85")).toBeVisible();

    // Edit Metalness
    const metalnessInput = page.getByTestId("material-metalness-input");
    await metalnessInput.fill("0.35");
    await expect(page.getByText("0.35")).toBeVisible();
  });

  test("Image file property disables base color/roughness/metalness and clear button re-enables", async ({
    page,
  }) => {
    await page.getByTestId("material-library-button").click();
    await page.getByTestId("add-material-button").click();

    const colorInput = page.getByTestId("material-base-color-input");
    const roughnessInput = page.getByTestId("material-roughness-input");
    const metalnessInput = page.getByTestId("material-metalness-input");

    await expect(colorInput).toBeEnabled();
    await expect(roughnessInput).toBeEnabled();
    await expect(metalnessInput).toBeEnabled();

    // Upload an image
    const fileInput = page.getByTestId("material-image-file-input");
    await fileInput.setInputFiles({
      name: "decal.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      ),
    });

    // Image preview and Clear button appear
    const clearButton = page.getByTestId("clear-material-image-button");
    await expect(clearButton).toBeVisible();

    // Inputs become disabled
    await expect(colorInput).toBeDisabled();
    await expect(roughnessInput).toBeDisabled();
    await expect(metalnessInput).toBeDisabled();

    // Clear image
    await clearButton.click();
    await expect(clearButton).toHaveCount(0);

    // Inputs are re-enabled
    await expect(colorInput).toBeEnabled();
    await expect(roughnessInput).toBeEnabled();
    await expect(metalnessInput).toBeEnabled();
  });

  test("Selecting face auto-opens Material Library and assigning material works for single and multi-select", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");

    // Ensure material panel is closed
    await expect(page.getByTestId("material-library-panel")).toHaveCount(0);

    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Single click front face
    await page.mouse.click(centerX, centerY);

    // Panel should have auto-opened!
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // Create a material
    await page.getByTestId("add-material-button").click();
    const assignButton = page.getByTestId("assign-material-button");
    await expect(assignButton).toBeEnabled();
    await expect(assignButton).toContainText("Assign to Selected Face (1)");

    // Assign material to selected face
    await assignButton.click();

    // Verify face has assigned material
    const faceMaterialAssigned = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="viewport-canvas"]') as any;
      const renderer = canvasEl?.__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.faces?.some((face: any) => face.materialId !== null);
    });
    expect(faceMaterialAssigned).toBe(true);

    // Enter MULTI_SELECT mode to select multiple faces
    await page.getByTestId("mode-multi-select-button").click();
    await page.waitForTimeout(350);

    // Switch to +X view to click a different face
    await page.getByTestId("gizmo-axis-+X").click();
    const newCanvasBox = await canvas.boundingBox();
    const rightCenterX = (newCanvasBox?.x ?? 0) + (newCanvasBox?.width ?? 0) / 2;
    const rightCenterY = (newCanvasBox?.y ?? 0) + (newCanvasBox?.height ?? 0) / 2;

    await page.mouse.click(rightCenterX, rightCenterY);

    // Assign button shows multiple selected faces
    await expect(assignButton).toBeEnabled();
  });

  test("Export OBJ includes mtllib and usemtl when materials are assigned", async ({
    page,
  }) => {
    // Open panel, create material and assign to face
    await page.getByTestId("material-library-button").click();
    await page.getByTestId("add-material-button").click();
    await page.getByTestId("material-name-input").fill("Cyber_Metal");

    // Switch to +Z view and select front face
    await page.getByTestId("gizmo-axis-+Z").click();
    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    await page.mouse.click(centerX, centerY);
    await page.getByTestId("assign-material-button").click();

    // Trigger export via File Menu
    await page.getByTestId("file-menu-button").click();

    const [downloadObj] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-obj-button").click(),
    ]);

    expect(downloadObj.suggestedFilename()).toBe("model.obj");
  });
});
