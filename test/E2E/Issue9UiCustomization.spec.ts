import { test, expect } from "@playwright/test";

test.describe("Issue #9: UI Customization", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  test("File Menu contains Customize UI menu item which opens dialog with form fields and buttons", async ({
    page,
  }) => {
    // Open File Menu
    await page.getByTestId("file-menu-button").click();
    const customizeMenuItem = page.getByTestId("customize-ui-button");
    await expect(customizeMenuItem).toBeVisible();
    await expect(customizeMenuItem).toHaveText("Customize UI");

    // Open Customize UI dialog
    await customizeMenuItem.click();
    const modal = page.getByTestId("customize-ui-modal");
    await expect(modal).toBeVisible();

    // Verify form fields
    await expect(modal.getByText("Side Tool Bar:")).toBeVisible();
    await expect(page.getByTestId("side-toolbar-toggle-button")).toBeVisible();

    await expect(modal.getByText("Material Library:")).toBeVisible();
    await expect(page.getByTestId("material-library-toggle-button")).toBeVisible();

    // Verify buttons
    await expect(page.getByTestId("customize-ui-save-button")).toBeVisible();
    await expect(page.getByTestId("customize-ui-close-button")).toBeVisible();

    // Close button closes modal
    await page.getByTestId("customize-ui-close-button").click();
    await expect(modal).toHaveCount(0);
  });

  test("Closing dialog without saving discards pending dock changes", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const sideToolBar = page.getByTestId("side-toolbar");

    // Initially Side Tool Bar is docked to the right
    let canvasBox = await canvas.boundingBox();
    let sideToolBarBox = await sideToolBar.boundingBox();
    expect((canvasBox?.x ?? 0) < (sideToolBarBox?.x ?? 0)).toBe(true);

    // Open Customize UI dialog
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("customize-ui-button").click();

    // Toggle Side Tool Bar to Left
    await page.getByTestId("side-toolbar-toggle-button").click();

    // Click Close (discard)
    await page.getByTestId("customize-ui-close-button").click();

    // Side Tool Bar should remain on the right
    canvasBox = await canvas.boundingBox();
    sideToolBarBox = await sideToolBar.boundingBox();
    expect((canvasBox?.x ?? 0) < (sideToolBarBox?.x ?? 0)).toBe(true);
  });

  test("Docking Side Tool Bar to Left and Right", async ({ page }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const sideToolBar = page.getByTestId("side-toolbar");

    // Open dialog
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("customize-ui-button").click();

    // Toggle Side Tool Bar to Left Side and Save
    await page.getByTestId("side-toolbar-toggle-button").click();
    await page.getByTestId("customize-ui-save-button").click();

    // Side Tool Bar should now be docked to the LEFT of the 3D viewport
    let canvasBox = await canvas.boundingBox();
    let sideToolBarBox = await sideToolBar.boundingBox();
    expect((sideToolBarBox?.x ?? 0) < (canvasBox?.x ?? 0)).toBe(true);

    // Toggle back to Right Side and Save
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("customize-ui-button").click();
    await page.getByTestId("side-toolbar-toggle-button").click();
    await page.getByTestId("customize-ui-save-button").click();

    // Side Tool Bar should be on the RIGHT of the viewport
    canvasBox = await canvas.boundingBox();
    sideToolBarBox = await sideToolBar.boundingBox();
    expect((canvasBox?.x ?? 0) < (sideToolBarBox?.x ?? 0)).toBe(true);
  });

  test("Docking both Side Tool Bar and Material Library to the LEFT stacks horizontally with Side Tool Bar left-most", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const sideToolBar = page.getByTestId("side-toolbar");

    // Open Material Library
    await page.getByTestId("material-library-button").click();
    const panel = page.getByTestId("material-library-panel");
    await expect(panel).toBeVisible();

    // Open Customize UI dialog
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("customize-ui-button").click();

    // Dock both to Left Side
    const sideToggle = page.getByTestId("side-toolbar-toggle-button");
    const matToggle = page.getByTestId("material-library-toggle-button");

    // Check current state: if active (right), toggle to left
    if ((await sideToggle.getAttribute("aria-checked")) === "true") {
      await sideToggle.click();
    }
    if ((await matToggle.getAttribute("aria-checked")) === "true") {
      await matToggle.click();
    }

    await page.getByTestId("customize-ui-save-button").click();

    // Both are on the LEFT side of the viewport:
    // Order from left to right must be: Side Tool Bar (left-most) -> Material Library -> Viewport Canvas
    const sideToolBarBox = await sideToolBar.boundingBox();
    const panelBox = await panel.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(sideToolBarBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    expect((sideToolBarBox?.x ?? 0)).toBeLessThan(panelBox?.x ?? 0);
    expect((panelBox?.x ?? 0)).toBeLessThan(canvasBox?.x ?? 0);
  });

  test("Docking both Side Tool Bar and Material Library to the RIGHT stacks horizontally with Side Tool Bar right-most", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const sideToolBar = page.getByTestId("side-toolbar");

    // Open Material Library
    await page.getByTestId("material-library-button").click();
    const panel = page.getByTestId("material-library-panel");
    await expect(panel).toBeVisible();

    // Open Customize UI dialog
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("customize-ui-button").click();

    // Dock both to Right Side
    const sideToggle = page.getByTestId("side-toolbar-toggle-button");
    const matToggle = page.getByTestId("material-library-toggle-button");

    if ((await sideToggle.getAttribute("aria-checked")) !== "true") {
      await sideToggle.click();
    }
    if ((await matToggle.getAttribute("aria-checked")) !== "true") {
      await matToggle.click();
    }

    await page.getByTestId("customize-ui-save-button").click();

    // Both are on the RIGHT side of the viewport:
    // Order from left to right must be: Viewport Canvas -> Material Library -> Side Tool Bar (right-most)
    const canvasBox = await canvas.boundingBox();
    const panelBox = await panel.boundingBox();
    const sideToolBarBox = await sideToolBar.boundingBox();

    expect(canvasBox).not.toBeNull();
    expect(panelBox).not.toBeNull();
    expect(sideToolBarBox).not.toBeNull();

    expect((canvasBox?.x ?? 0)).toBeLessThan(panelBox?.x ?? 0);
    expect((panelBox?.x ?? 0)).toBeLessThan(sideToolBarBox?.x ?? 0);
  });
});
