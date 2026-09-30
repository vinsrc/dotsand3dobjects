import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Issue #8 Top Tool Bar Changes Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("toolbar")).toBeVisible();
  });

  test("Top toolbar displays File menu button and not standalone Load/Export buttons", async ({
    page,
  }) => {
    const fileMenuButton = page.getByTestId("file-menu-button");
    await expect(fileMenuButton).toBeVisible();
    await expect(fileMenuButton).toHaveText("File");

    // Dropdown should be initially closed
    const fileMenuDropdown = page.getByTestId("file-menu-dropdown");
    await expect(fileMenuDropdown).not.toBeVisible();
  });

  test("Clicking File menu button toggles dropdown displaying Load .obj and Export .obj", async ({
    page,
  }) => {
    const fileMenuButton = page.getByTestId("file-menu-button");
    await fileMenuButton.click();

    const fileMenuDropdown = page.getByTestId("file-menu-dropdown");
    await expect(fileMenuDropdown).toBeVisible();

    const loadObjButton = page.getByTestId("load-obj-button");
    const exportObjButton = page.getByTestId("export-obj-button");

    await expect(loadObjButton).toBeVisible();
    await expect(loadObjButton).toHaveText("Load .obj");
    await expect(exportObjButton).toBeVisible();
    await expect(exportObjButton).toHaveText("Export .obj");

    // Clicking File menu button again toggles it closed
    await fileMenuButton.click();
    await expect(fileMenuDropdown).not.toBeVisible();
  });

  test("Clicking outside the File menu dropdown closes it", async ({ page }) => {
    const fileMenuButton = page.getByTestId("file-menu-button");
    await fileMenuButton.click();

    const fileMenuDropdown = page.getByTestId("file-menu-dropdown");
    await expect(fileMenuDropdown).toBeVisible();

    // Click on canvas container outside the menu
    await page.getByTestId("viewport-canvas-container").click({ position: { x: 200, y: 200 } });
    await expect(fileMenuDropdown).not.toBeVisible();
  });

  test("Pressing Escape key closes the File menu dropdown", async ({ page }) => {
    const fileMenuButton = page.getByTestId("file-menu-button");
    await fileMenuButton.click();

    const fileMenuDropdown = page.getByTestId("file-menu-dropdown");
    await expect(fileMenuDropdown).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(fileMenuDropdown).not.toBeVisible();
  });

  test("Clicking Load .obj from File menu triggers file input", async ({ page }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("load-obj-button").click();
    const fileChooser = await fileChooserPromise;

    expect(fileChooser).toBeDefined();
    // Dropdown should close after clicking item
    await expect(page.getByTestId("file-menu-dropdown")).not.toBeVisible();
  });

  test("Clicking Export .obj from File menu triggers OBJ download", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-obj-button").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("model.obj");
    // Dropdown should close after clicking item
    await expect(page.getByTestId("file-menu-dropdown")).not.toBeVisible();
  });

  test("File menu dropdown is rendered in front of the 3D viewport canvas", async ({
    page,
  }) => {
    const fileMenuButton = page.getByTestId("file-menu-button");
    await fileMenuButton.click();

    const loadObjButton = page.getByTestId("load-obj-button");
    const loadBox = await loadObjButton.boundingBox();
    expect(loadBox).not.toBeNull();
    // Dropdown extends below the 48px toolbar into the viewport area
    expect(loadBox!.y + loadBox!.height).toBeGreaterThan(48);

    // Verify the element at the center of the menu item (which is over the viewport area) is the menu button, not the canvas behind it
    const elementAtPoint = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el?.getAttribute("data-testid");
      },
      { x: loadBox!.x + loadBox!.width / 2, y: 55 }
    );

    expect(elementAtPoint).toBe("load-obj-button");
  });
});
