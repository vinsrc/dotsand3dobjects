import { test, expect } from "@playwright/test";

test.describe("Issue #16: Setting face front or back", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  test("Set Front button is only visible in face orthographic view", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const setFrontButton = page.getByTestId("set-front-button");

    // Initially in perspective view: Set Front is not visible
    await expect(setFrontButton).toHaveCount(0);

    // Switch to standard orthographic +Z view via gizmo: Set Front is not visible
    await page.getByTestId("gizmo-axis-+Z").click();
    await expect(setFrontButton).toHaveCount(0);

    // Double-click center of canvas to enter face orthographic view
    // Material panel may open on first click; wait for canvas bounds
    const materialButton = page.getByTestId("material-library-button");
    // Ensure material panel is open so canvas bounds remain stable during double click
    await materialButton.click();
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    await page.mouse.click(centerX, centerY);
    await page.getByTestId("nearest-ortho-view-button").click();

    // Now in Face orthographic view: Set Front button must be visible!
    await expect(setFrontButton).toBeVisible();
    await expect(setFrontButton).toHaveText("Set Front");

    // Switch to standard orthographic axis +X via gizmo: Set Front button disappears
    await page.getByTestId("gizmo-axis-+X").click();
    await expect(setFrontButton).toHaveCount(0);
  });

  test("Clicking Set Front re-orders vertices for the face and supports undo/redo", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");

    // Open material panel so canvas bounds remain stable
    await page.getByTestId("material-library-button").click();
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // Switch to +Z orthographic view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Click front face and switch to face orthographic view via Nearest Orthographic View button
    await page.mouse.click(centerX, centerY);
    await page.getByTestId("nearest-ortho-view-button").click();

    const setFrontButton = page.getByTestId("set-front-button");
    await expect(setFrontButton).toBeVisible();

    // Export OBJ initially to check original face vertex order
    const downloadPromiseInitial = page.waitForEvent("download");
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-obj-button").click();
    const initialDownload = await downloadPromiseInitial;
    const initialStream = await initialDownload.createReadStream();
    expect(initialStream).not.toBeNull();

    const initialChunks: Buffer[] = [];
    if (initialStream) {
      for await (const chunk of initialStream) {
        initialChunks.push(
          typeof chunk === "string" ? Buffer.from(chunk) : chunk
        );
      }
    }
    const initialObjText = Buffer.concat(initialChunks).toString("utf-8");
    // Face 1 vertices in starter cube: [4, 5, 6, 7] -> in 1-based OBJ: "f 5 6 7 8"
    expect(initialObjText).toContain("f 5 6 7 8");

    // Click "Set Front" button
    await setFrontButton.click();

    // Export OBJ after clicking Set Front
    const downloadPromiseAfter = page.waitForEvent("download");
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-obj-button").click();
    const afterDownload = await downloadPromiseAfter;
    const afterStream = await afterDownload.createReadStream();
    expect(afterStream).not.toBeNull();

    const afterChunks: Buffer[] = [];
    if (afterStream) {
      for await (const chunk of afterStream) {
        afterChunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
    }
    const afterObjText = Buffer.concat(afterChunks).toString("utf-8");
    // Face 1 vertices should now be reversed: [7, 6, 5, 4] -> in 1-based OBJ: "f 8 7 6 5"
    expect(afterObjText).toContain("f 8 7 6 5");

    // Click Undo in side toolbar
    await page.getByTestId("undo-button").click();

    // Export OBJ after Undo
    const downloadPromiseUndo = page.waitForEvent("download");
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-obj-button").click();
    const undoDownload = await downloadPromiseUndo;
    const undoStream = await undoDownload.createReadStream();
    expect(undoStream).not.toBeNull();

    const undoChunks: Buffer[] = [];
    if (undoStream) {
      for await (const chunk of undoStream) {
        undoChunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
    }
    const undoObjText = Buffer.concat(undoChunks).toString("utf-8");
    expect(undoObjText).toContain("f 5 6 7 8");

    // Click Redo in side toolbar
    await page.getByTestId("redo-button").click();

    // Export OBJ after Redo
    const downloadPromiseRedo = page.waitForEvent("download");
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-obj-button").click();
    const redoDownload = await downloadPromiseRedo;
    const redoStream = await redoDownload.createReadStream();
    expect(redoStream).not.toBeNull();

    const redoChunks: Buffer[] = [];
    if (redoStream) {
      for await (const chunk of redoStream) {
        redoChunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
    }
    const redoObjText = Buffer.concat(redoChunks).toString("utf-8");
    expect(redoObjText).toContain("f 8 7 6 5");
  });
});
