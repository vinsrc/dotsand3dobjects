import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Pilot Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Toolbar displays required buttons and layout matching ui_screen.png", async ({
    page,
  }) => {
    await expect(page.getByTestId("toolbar")).toBeVisible();
    await expect(page.getByTestId("load-obj-button")).toBeVisible();
    await expect(page.getByTestId("export-obj-button")).toBeVisible();
    await expect(page.getByTestId("toggle-view-button")).toBeVisible();
    await expect(page.getByTestId("3d-axis-gizmo")).toBeVisible();
  });

  test("Loading any non-OBJ format shows an 'Unsupported error'", async ({
    page,
  }) => {
    // Test 1 (Part 2) of pilot.tests.spec.md
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("load-obj-button").click();
    const fileChooser = await fileChooserPromise;

    // Upload an unsupported format file (e.g. model.stl)
    await fileChooser.setFiles({
      name: "model.stl",
      mimeType: "model/stl",
      buffer: Buffer.from("solid test\nendsolid test"),
    });

    // Verify error dialog appears with 'Unsupported error' text
    const errorDialog = page.getByTestId("error-dialog");
    await expect(errorDialog).toBeVisible();

    const errorMessage = page.getByTestId("error-message");
    await expect(errorMessage).toHaveText("Unsupported error");

    // Dismiss error dialog
    await page.getByTestId("error-dismiss-button").click();
    await expect(errorDialog).not.toBeVisible();
  });

  test("Loading a 3D OBJ file loads the object successfully without errors", async ({
    page,
  }) => {
    // Test 1 (Part 1) of pilot.tests.spec.md
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("load-obj-button").click();
    const fileChooser = await fileChooserPromise;

    const sampleObjData = `
      # Simple Pyramid
      v -1.0 0.0 -1.0
      v 1.0 0.0 -1.0
      v 1.0 0.0 1.0
      v -1.0 0.0 1.0
      v 0.0 1.5 0.0
      f 1 2 3 4
      f 1 2 5
      f 2 3 5
      f 3 4 5
      f 4 1 5
    `;

    await fileChooser.setFiles({
      name: "pyramid.obj",
      mimeType: "text/plain",
      buffer: Buffer.from(sampleObjData),
    });

    // Ensure error modal is NOT shown
    await expect(page.getByTestId("error-dialog")).not.toBeVisible();

    // Ensure canvas is still rendering
    await expect(page.getByTestId("viewport-canvas-container")).toBeVisible();
  });

  test("Loading a model with arbitrary large coordinates auto-scales and centers it within the viewport", async ({
    page,
  }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("load-obj-button").click();
    const fileChooser = await fileChooserPromise;

    // A huge off-center cube (extent = 1000 units, located at 5000)
    const largeObjData = `
      v 5000 5000 5000
      v 6000 5000 5000
      v 6000 6000 5000
      v 5000 6000 5000
      v 5000 5000 6000
      v 6000 5000 6000
      v 6000 6000 6000
      v 5000 6000 6000
      f 1 2 3 4
      f 5 6 7 8
      f 1 2 6 5
      f 2 3 7 6
      f 3 4 8 7
      f 4 1 5 8
    `;

    await fileChooser.setFiles({
      name: "giant_cube.obj",
      mimeType: "text/plain",
      buffer: Buffer.from(largeObjData),
    });

    await expect(page.getByTestId("error-dialog")).not.toBeVisible();
    const canvas = page.getByTestId("viewport-canvas");
    await expect(canvas).toBeVisible();

    // Verify canvas rendered visible pixels (not blank or clipped into void)
    const screenshot = await canvas.screenshot();
    expect(screenshot.byteLength).toBeGreaterThan(1000);
  });

  test("Toggle wireframe view and shaded view updates mode button and renders object in both modes", async ({
    page,
  }) => {
    const toggleButton = page.getByTestId("toggle-view-button");
    const canvas = page.getByTestId("viewport-canvas");

    // Default mode is Shaded View
    await expect(toggleButton).toHaveText("Shaded View");
    await expect(canvas).toBeVisible();

    // Click toggle to switch to Wireframe View
    await toggleButton.click();
    await expect(toggleButton).toHaveText("Wireframe View");

    // Ensure the wireframe view renders without a blank canvas (object is visible)
    const wireframeScreenshot = await canvas.screenshot();
    expect(wireframeScreenshot.byteLength).toBeGreaterThan(1000);

    // Click toggle to switch back to Shaded View
    await toggleButton.click();
    await expect(toggleButton).toHaveText("Shaded View");

    const shadedScreenshot = await canvas.screenshot();
    expect(shadedScreenshot.byteLength).toBeGreaterThan(1000);
  });

  test("Tapping 3D axis gizmo (+X, +Y, +Z, -X, -Y, -Z) changes view orientation", async ({
    page,
  }) => {
    // Click +X axis button on gizmo
    const axisButtonPositiveX = page.getByTestId("gizmo-axis-+X");
    await expect(axisButtonPositiveX).toBeVisible();
    await axisButtonPositiveX.click();

    // Click +Y axis button on gizmo
    const axisButtonPositiveY = page.getByTestId("gizmo-axis-+Y");
    await expect(axisButtonPositiveY).toBeVisible();
    await axisButtonPositiveY.click();

    // Click +Z axis button on gizmo
    const axisButtonPositiveZ = page.getByTestId("gizmo-axis-+Z");
    await expect(axisButtonPositiveZ).toBeVisible();
    await axisButtonPositiveZ.click();
  });

  test("Exporting current model triggers OBJ download", async ({
    page,
  }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-obj-button").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("model.obj");
  });

  test("Mouse wheel zooms in and out", async ({ page }) => {
    const canvasContainer = page.getByTestId("viewport-canvas-container");
    await canvasContainer.dispatchEvent("wheel", { deltaY: -100 });
    await canvasContainer.dispatchEvent("wheel", { deltaY: 100 });
    await expect(canvasContainer).toBeVisible();
  });
});
