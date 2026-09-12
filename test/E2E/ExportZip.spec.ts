import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import { unzipSync } from "fflate";

test.describe("Export as Zip", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  test("File menu exposes Export as Zip and downloads a zip containing OBJ, MTL, and texture", async ({
    page,
  }) => {
    // 1. Open Material Library Panel
    await page.getByTestId("material-library-button").click();
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // 2. Add material and rename it
    await page.getByTestId("add-material-button").click();
    await page.getByTestId("material-name-input").fill("StickerMat");

    // 3. Attach an image file to the material
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjAwMDAwAALgB/5O8B44AAAAASUVORK5CYII=",
      "base64"
    );
    await page.getByTestId("material-image-file-input").setInputFiles({
      name: "cool_decal.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });
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

    // 7. Click File Menu -> Export as Zip
    await page.getByTestId("file-menu-button").click();
    const exportZipButton = page.getByTestId("export-zip-button");
    await expect(exportZipButton).toBeVisible();
    await exportZipButton.click();

    // Wait for the single zip download
    await expect.poll(() => downloadedFiles.length, { timeout: 7000 }).toBe(1);
    expect(downloadedFiles[0].filename).toBe("model.zip");

    // 8. Verify the zip archive contents
    const zipBuffer = fs.readFileSync(downloadedFiles[0]!.path);
    expect(zipBuffer[0]).toBe(0x50); // 'P'
    expect(zipBuffer[1]).toBe(0x4b); // 'K'

    const unzipped = unzipSync(new Uint8Array(zipBuffer));
    const fileNames = Object.keys(unzipped).sort();
    expect(fileNames).toEqual(["cool_decal.png", "model.mtl", "model.obj"]);

    const objContent = new TextDecoder().decode(unzipped["model.obj"]);
    expect(objContent).toContain("mtllib model.mtl");
    expect(objContent).toContain("usemtl StickerMat");

    const mtlContent = new TextDecoder().decode(unzipped["model.mtl"]);
    expect(mtlContent).toContain("newmtl StickerMat");
    expect(mtlContent).toContain("map_Kd cool_decal.png");
    expect(mtlContent).not.toContain("data:image");
    expect(mtlContent).not.toContain("base64");

    const imageBytes = unzipped["cool_decal.png"];
    expect(imageBytes.length).toBeGreaterThan(0);
    expect(imageBytes[0]).toBe(0x89);
    expect(imageBytes[1]).toBe(0x50);
    expect(imageBytes[2]).toBe(0x4e);
    expect(imageBytes[3]).toBe(0x47);
  });

  test("Export as Zip without materials bundles only the OBJ file", async ({
    page,
  }) => {
    const downloadedFiles: Array<{ filename: string; path: string }> = [];
    page.on("download", async (download) => {
      const filename = download.suggestedFilename();
      const filePath = (await download.path()) || "";
      downloadedFiles.push({ filename, path: filePath });
    });

    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-zip-button").click();

    await expect.poll(() => downloadedFiles.length, { timeout: 7000 }).toBe(1);
    const zipBuffer = fs.readFileSync(downloadedFiles[0]!.path);
    const unzipped = unzipSync(new Uint8Array(zipBuffer));
    expect(Object.keys(unzipped).sort()).toEqual(["model.obj"]);

    const objContent = new TextDecoder().decode(unzipped["model.obj"]);
    expect(objContent).toContain("v ");
    expect(objContent).toContain("f ");
  });
});