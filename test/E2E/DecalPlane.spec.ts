import { test, expect } from "@playwright/test";

test.describe("Decal Plane Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
    await expect(page.getByTestId("toolbar")).toBeVisible();
  });

  test("Add Decal Plane button is visible and docked right only when a face is selected", async ({
    page,
  }) => {
    // Initially no face is selected, Add Decal Plane button should not exist
    await expect(page.getByTestId("add-decal-plane-button")).toHaveCount(0);

    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    let canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    let centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    let centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Click front face to select it
    await page.mouse.click(centerX, centerY);

    // Add Decal Plane button should now be visible and inside mode-specific-buttons
    const addDecalButton = page.getByTestId("add-decal-plane-button");
    await expect(addDecalButton).toBeVisible();
    await expect(addDecalButton).toHaveText("Add Decal Plane");

    // Check that it is docked to the right side (inside mode-specific-buttons)
    const modeSpecificGroup = page.getByTestId("mode-specific-buttons");
    await expect(modeSpecificGroup).toContainText("Add Decal Plane");

    // Click face again to deselect
    canvasBox = await canvas.boundingBox();
    centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;
    await page.mouse.click(centerX, centerY);

    // Add Decal Plane button should disappear
    await expect(page.getByTestId("add-decal-plane-button")).toHaveCount(0);
  });

  test("Clicking Add Decal Plane adds sticker with transparent green effect, switches to face orthographic view, and selects it", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select front face
    await page.mouse.click(centerX, centerY);

    const addDecalButton = page.getByTestId("add-decal-plane-button");
    await expect(addDecalButton).toBeVisible();
    await addDecalButton.click();

    // Verify decal plane exists in renderer
    const decalInfo = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const decals = renderer?.getCurrentDecals();
      const meshes = renderer?.getDecalMeshes();
      return {
        count: decals?.length ?? 0,
        meshCount: meshes?.length ?? 0,
        firstDecalId: decals?.[0]?.id ?? null,
      };
    });

    expect(decalInfo.count).toBe(1);
    expect(decalInfo.meshCount).toBe(1);
    expect(decalInfo.firstDecalId).not.toBeNull();

    // Verify Select Parent Face button is visible because decal is selected
    await expect(page.getByTestId("select-parent-face-button")).toBeVisible();

    // Verify Clear Material button is visible because decal is selected
    await expect(page.getByTestId("clear-material-button")).toBeVisible();

    // Verify Delete Decal Plane button is visible
    await expect(page.getByTestId("delete-decal-plane-button")).toBeVisible();
  });

  test("Delete Decal Plane button deletes selected decal plane and supports undo/redo", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select face and add decal
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("add-decal-plane-button").click();

    // Delete button should be visible
    const deleteDecalBtn = page.getByTestId("delete-decal-plane-button");
    await expect(deleteDecalBtn).toBeVisible();
    await deleteDecalBtn.click();

    // Verify decal is deleted from renderer
    let count = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      return canvasEl?.__viewportRenderer?.getCurrentDecals()?.length ?? 0;
    });
    expect(count).toBe(0);

    // Delete Decal Plane and Clear Material buttons should disappear
    await expect(page.getByTestId("delete-decal-plane-button")).toHaveCount(0);
    await expect(page.getByTestId("clear-material-button")).toHaveCount(0);

    // Undo deletion
    await page.getByTestId("undo-button").click();
    count = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      return canvasEl?.__viewportRenderer?.getCurrentDecals()?.length ?? 0;
    });
    expect(count).toBe(1);

    // Redo deletion
    await page.getByTestId("redo-button").click();
    count = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      return canvasEl?.__viewportRenderer?.getCurrentDecals()?.length ?? 0;
    });
    expect(count).toBe(0);
  });

  test("When decal plane is selected, forbidden actions are disabled (insert, fill, delete, center)", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select face and add decal
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("add-decal-plane-button").click();

    // Verify Insert, Fill, Delete vertex, Center object are disabled
    const insertBtn = page.getByTestId("mode-insert-button");
    const fillBtn = page.getByTestId("mode-fill-button");
    const deleteBtn = page.getByTestId("delete-vertex-button");
    const centerBtn = page.getByTestId("center-object-button");

    await expect(insertBtn).toBeDisabled();
    await expect(fillBtn).toBeDisabled();
    await expect(deleteBtn).toBeDisabled();
    await expect(centerBtn).toBeDisabled();
  });

  test("Decal plane selection in all views: can be selected in perspective view, shows Select Parent Face, hides Add Decal Plane, and supports selecting parent face", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select face and add decal
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("add-decal-plane-button").click();

    // Re-query canvas bounding box as Material Library panel opens and shifts the canvas
    const newCanvasBox = await canvas.boundingBox();
    const decalX = (newCanvasBox?.x ?? 0) + (newCanvasBox?.width ?? 0) / 2;
    const decalY = (newCanvasBox?.y ?? 0) + (newCanvasBox?.height ?? 0) / 2;

    // Decal is initially selected: Select Parent Face and Delete Decal Plane are visible, Add Decal Plane is hidden
    await expect(page.getByTestId("select-parent-face-button")).toBeVisible();
    await expect(page.getByTestId("delete-decal-plane-button")).toBeVisible();
    await expect(page.getByTestId("add-decal-plane-button")).toHaveCount(0);

    // Drag on canvas to orbit and switch view to perspective (small drag to stay focused on face)
    await page.mouse.move(decalX, decalY);
    await page.mouse.down();
    await page.mouse.move(decalX + 15, decalY + 15);
    await page.mouse.up();

    // Decal remains selected in perspective view: Select Parent Face and Delete Decal Plane are still visible
    await expect(page.getByTestId("select-parent-face-button")).toBeVisible();
    await expect(page.getByTestId("delete-decal-plane-button")).toBeVisible();
    await expect(page.getByTestId("add-decal-plane-button")).toHaveCount(0);

    // Clicking Select Parent Face switches selection to parent face
    await page.getByTestId("select-parent-face-button").click();

    // Parent face is now selected: Add Decal Plane and Flip Face are visible, Select Parent Face is hidden
    await expect(page.getByTestId("add-decal-plane-button")).toBeVisible();
    await expect(page.getByTestId("flip-face-button")).toBeVisible();
    await expect(page.getByTestId("select-parent-face-button")).toHaveCount(0);

    // In perspective view, clicking on the decal plane selects the decal plane again!
    await page.mouse.click(decalX, decalY);
    await expect(page.getByTestId("select-parent-face-button")).toBeVisible();
    await expect(page.getByTestId("delete-decal-plane-button")).toBeVisible();
    await expect(page.getByTestId("add-decal-plane-button")).toHaveCount(0);
  });

  test("Decal plane can be adjusted using Rotate mode with 4 corner handles", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select face and add decal (automatically enters face orthographic view and selects decal)
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("add-decal-plane-button").click();

    // Enter Rotate mode
    await page.getByTestId("mode-rotate-button").click();

    // 4 rotate handles should be visible around the decal plane
    const handleTl = page.getByTestId("rotate-handle-top-left");
    const handleTr = page.getByTestId("rotate-handle-top-right");
    const handleBr = page.getByTestId("rotate-handle-bottom-right");
    const handleBl = page.getByTestId("rotate-handle-bottom-left");

    await expect(handleTl).toBeVisible();
    await expect(handleTr).toBeVisible();
    await expect(handleBr).toBeVisible();
    await expect(handleBl).toBeVisible();

    // Drag rotate handle to rotate the decal
    const trBox = await handleTr.boundingBox();
    expect(trBox).not.toBeNull();
    const handleX = (trBox?.x ?? 0) + (trBox?.width ?? 0) / 2;
    const handleY = (trBox?.y ?? 0) + (trBox?.height ?? 0) / 2;

    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(handleX + 30, handleY + 30);
    await page.mouse.up();

    // Exit rotate mode
    await page.getByTestId("mode-rotate-button").click();
  });

  test("Assign material to decal plane and remove it using Clear Material button", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select face and add decal
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("add-decal-plane-button").click();

    // Material library panel should be open
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // Create a material
    await page.getByTestId("add-material-button").click();

    // Assign button should say "Assign to Decal Plane"
    const assignBtn = page.getByTestId("assign-material-button");
    await expect(assignBtn).toBeVisible();
    await expect(assignBtn).toHaveText("Assign to Decal Plane");

    // Assign material to decal
    await assignBtn.click();

    // Verify decal has materialId assigned
    let decalHasMat = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const decals = renderer?.getCurrentDecals();
      return decals?.[0]?.materialId !== null;
    });
    expect(decalHasMat).toBe(true);

    // Click Clear Material in toolbar
    const clearButton = page.getByTestId("clear-material-button");
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Verify decal materialId is cleared
    decalHasMat = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const decals = renderer?.getCurrentDecals();
      return decals?.[0]?.materialId !== null;
    });
    expect(decalHasMat).toBe(false);
  });

  test("Decal creation supports Undo and Redo", async ({ page }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Select face and add decal
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("add-decal-plane-button").click();

    let count = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      return canvasEl?.__viewportRenderer?.getCurrentDecals()?.length ?? 0;
    });
    expect(count).toBe(1);

    // Undo
    await page.getByTestId("undo-button").click();
    count = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      return canvasEl?.__viewportRenderer?.getCurrentDecals()?.length ?? 0;
    });
    expect(count).toBe(0);

    // Redo
    await page.getByTestId("redo-button").click();
    count = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      return canvasEl?.__viewportRenderer?.getCurrentDecals()?.length ?? 0;
    });
    expect(count).toBe(1);
  });
});
