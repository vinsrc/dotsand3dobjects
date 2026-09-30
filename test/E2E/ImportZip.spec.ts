import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import { zipSync } from "fflate";

test.describe("Import Zip", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  test("File menu exposes Import as Zip button and loads OBJ, MTL, and texture images into scene", async ({
    page,
  }) => {
    // 1. Verify File menu contains Import as Zip button
    await page.getByTestId("file-menu-button").click();
    const importZipButton = page.getByTestId("import-zip-button");
    await expect(importZipButton).toBeVisible();

    // 2. Prepare a test zip package with OBJ, MTL, and texture image
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjAwMDAwAALgB/5O8B44AAAAASUVORK5CYII=";
    const pngBytes = Buffer.from(pngBase64, "base64");
    const encodeText = (text: string): Uint8Array =>
      new TextEncoder().encode(text);

    const objContent = `
# Exported by WireframeVibe3D
mtllib test_box.mtl
v -1.0 -1.0 0.0
v 1.0 -1.0 0.0
v 1.0 1.0 0.0
v -1.0 1.0 0.0
v -0.5 -0.5 0.01
v 0.5 -0.5 0.01
v 0.5 0.5 0.01
v -0.5 0.5 0.01
vt 0.0 0.0
vt 1.0 0.0
vt 1.0 1.0
vt 0.0 1.0
o MainModel
g MainModel
usemtl BasePlastic
f 1 2 3 4
o Decal_sticker_1
g Decal_sticker_1
usemtl StickerLogo
f 5/1 6/2 7/3 8/4
`;

    const mtlContent = `
newmtl BasePlastic
Kd 0.2 0.4 0.8
Pr 0.3
Pm 0.0

newmtl StickerLogo
map_Kd logo.png
`;

    const zipBytes = zipSync({
      "test_box.obj": encodeText(objContent),
      "test_box.mtl": encodeText(mtlContent),
      "logo.png": new Uint8Array(pngBytes),
    });

    // 3. Upload the zip package via zip-file-input
    await page.getByTestId("zip-file-input").setInputFiles({
      name: "imported_package.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(zipBytes),
    });

    // 4. Verify materials were imported and loaded in Material Library
    await page.getByTestId("material-library-button").click();
    await expect(page.getByTestId("material-library-panel")).toBeVisible();

    // Check that BasePlastic and StickerLogo materials are present
    await expect(page.getByText("BasePlastic")).toBeVisible();
    await expect(page.getByText("StickerLogo")).toBeVisible();

    // Click StickerLogo and verify it has image loaded
    await page.getByText("StickerLogo").click();
    await expect(page.getByText("logo.png")).toBeVisible();
  });

  test("Round-trip export and import of zip preserves model, materials, and decal planes", async ({
    page,
  }) => {
    // 1. Create a decal plane on the front face of default cube
    await page.getByTestId("gizmo-axis-+Z").click();
    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const centerY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;
    await page.mouse.click(centerX, centerY);

    const addDecalButton = page.getByTestId("add-decal-plane-button");
    await expect(addDecalButton).toBeEnabled();
    await addDecalButton.click();
    await expect(page.getByTestId("delete-decal-plane-button")).toBeVisible();

    // 2. Add an image material and assign to decal
    await expect(page.getByTestId("material-library-panel")).toBeVisible();
    await page.getByTestId("add-material-button").click();
    await page.getByTestId("material-name-input").fill("RoundtripMat");

    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjAwMDAwAALgB/5O8B44AAAAASUVORK5CYII=",
      "base64"
    );
    await page.getByTestId("material-image-file-input").setInputFiles({
      name: "roundtrip_art.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });
    await expect(page.getByText("roundtrip_art.png")).toBeVisible();

    const assignButton = page.getByTestId("assign-material-button");
    await expect(assignButton).toBeEnabled();
    await assignButton.click();

    // 3. Export as Zip
    const downloadedFiles: Array<{ filename: string; path: string }> = [];
    page.on("download", async (download) => {
      const filename = download.suggestedFilename();
      const filePath = (await download.path()) || "";
      downloadedFiles.push({ filename, path: filePath });
    });

    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-zip-button").click();
    await expect.poll(() => downloadedFiles.length, { timeout: 7000 }).toBe(1);

    const exportedZipPath = downloadedFiles[0]!.path;
    const exportedZipBuffer = fs.readFileSync(exportedZipPath);

    // 4. Re-import the exported zip file
    await page.getByTestId("zip-file-input").setInputFiles({
      name: "roundtrip.zip",
      mimeType: "application/zip",
      buffer: exportedZipBuffer,
    });

    // 5. Verify the imported scene has RoundtripMat with roundtrip_art.png
    await expect(page.getByText("RoundtripMat")).toBeVisible();
    await page.getByText("RoundtripMat").click();
    await expect(page.getByText("roundtrip_art.png")).toBeVisible();
  });
});
