import { test, expect } from "@playwright/test";
import * as fs from "node:fs";

test.describe("Export OBJ with Image Materials", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  test("Exporting model with an image material downloads OBJ, MTL, and image with matching filename", async ({
    page,
  }) => {
    // 1. Open Material Library Panel
    await page.getByTestId("material-library-button").click();
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // 2. Add material and rename it
    await page.getByTestId("add-material-button").click();
    const nameInput = page.getByTestId("material-name-input");
    await nameInput.fill("StickerMat");

    // 3. Attach an image file to the material
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjAwMDAwAALgB/5O8B44AAAAASUVORK5CYII=",
      "base64"
    );
    const fileInput = page.getByTestId("material-image-file-input");
    await fileInput.setInputFiles({
      name: "cool_decal.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    // Verify UI displays the filename
    await expect(page.getByText("cool_decal.png")).toBeVisible();

    // 4. Select front face in +Z orthographic view
    await page.getByTestId("gizmo-axis-+Z").click();
    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;
    await page.mouse.click(centerX, centerY);

    // 5. Assign material to selected face
    const assignBtn = page.getByTestId("assign-material-button");
    await expect(assignBtn).toBeEnabled();
    await assignBtn.click();

    // 6. Capture downloads on export
    const downloadedFiles: Array<{ filename: string; path: string }> = [];
    page.on("download", async (download) => {
      const filename = download.suggestedFilename();
      const filePath = (await download.path()) || "";
      downloadedFiles.push({ filename, path: filePath });
    });

    // 7. Click File Menu -> Export .obj
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-obj-button").click();

    // Wait for all 3 downloads: model.obj, model.mtl, cool_decal.png
    await expect.poll(() => downloadedFiles.length, { timeout: 7000 }).toBe(3);

    const filenames = downloadedFiles.map((d) => d.filename);
    expect(filenames).toContain("model.obj");
    expect(filenames).toContain("model.mtl");
    expect(filenames).toContain("cool_decal.png");

    // 8. Verify MTL file content: references cool_decal.png without base64
    const mtlFile = downloadedFiles.find((d) => d.filename === "model.mtl");
    expect(mtlFile).toBeDefined();
    const mtlContent = fs.readFileSync(mtlFile!.path, "utf-8");
    expect(mtlContent).toContain("newmtl StickerMat");
    expect(mtlContent).toContain("map_Kd cool_decal.png");
    expect(mtlContent).not.toContain("data:image");
    expect(mtlContent).not.toContain("base64");

    // 9. Verify OBJ file references model.mtl and StickerMat
    const objFile = downloadedFiles.find((d) => d.filename === "model.obj");
    expect(objFile).toBeDefined();
    const objContent = fs.readFileSync(objFile!.path, "utf-8");
    expect(objContent).toContain("mtllib model.mtl");
    expect(objContent).toContain("usemtl StickerMat");
  });

  test("Exporting model with multiple distinct image materials saves each with original name", async ({
    page,
  }) => {
    // 1. Open Material Library Panel
    await page.getByTestId("material-library-button").click();

    // 2. Add first material with texture1.png
    await page.getByTestId("add-material-button").click();
    await page.getByTestId("material-name-input").fill("PatternMat");
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    await page.getByTestId("material-image-file-input").setInputFiles({
      name: "pattern.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });
    await expect(page.getByText("pattern.png")).toBeVisible();

    // 3. Add second material with emblem.png
    await page.getByTestId("add-material-button").click();
    await page.getByTestId("material-name-input").fill("EmblemMat");
    await page.getByTestId("material-image-file-input").setInputFiles({
      name: "emblem.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });
    await expect(page.getByText("emblem.png")).toBeVisible();

    // 4. Capture downloads
    const downloadedFiles: Array<{ filename: string; path: string }> = [];
    page.on("download", async (download) => {
      const filename = download.suggestedFilename();
      const filePath = (await download.path()) || "";
      downloadedFiles.push({ filename, path: filePath });
    });

    // 5. Export
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-obj-button").click();

    // Expect 4 files: model.obj, model.mtl, pattern.png, emblem.png
    await expect.poll(() => downloadedFiles.length, { timeout: 7000 }).toBe(4);

    const filenames = downloadedFiles.map((d) => d.filename);
    expect(filenames).toContain("model.obj");
    expect(filenames).toContain("model.mtl");
    expect(filenames).toContain("pattern.png");
    expect(filenames).toContain("emblem.png");

    const mtlFile = downloadedFiles.find((d) => d.filename === "model.mtl");
    expect(mtlFile).toBeDefined();
    const mtlContent = fs.readFileSync(mtlFile!.path, "utf-8");
    expect(mtlContent).toContain("map_Kd pattern.png");
    expect(mtlContent).toContain("map_Kd emblem.png");
    expect(mtlContent).not.toContain("data:image");
    expect(mtlContent).not.toContain("base64");
  });
});

