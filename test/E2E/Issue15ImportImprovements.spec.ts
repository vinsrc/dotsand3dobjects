import { test, expect } from "@playwright/test";

test.describe("Issue #15: Import Improvements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  test("File Menu contains Load .mtl action button", async ({ page }) => {
    const fileMenuButton = page.getByTestId("file-menu-button");
    await expect(fileMenuButton).toBeVisible();

    await fileMenuButton.click();
    await expect(page.getByTestId("file-menu-dropdown")).toBeVisible();

    const loadMtlButton = page.getByTestId("load-mtl-button");
    await expect(loadMtlButton).toBeVisible();
    await expect(loadMtlButton).toHaveText("Load .mtl");
  });

  test("Loads OBJ and MTL files together, preserving extra properties and populating materials", async ({
    page,
  }) => {
    const fileInput = page.getByTestId("file-input");

    const objContent = `
      v 0 0 0
      v 1 0 0
      v 1 1 0
      v 0 1 0
      v 0 0 1
      v 1 0 1
      v 1 1 1
      v 0 1 1
      usemtl CyberBlue
      f 1 2 3 4
      usemtl GoldPlate
      f 5 6 7 8
    `;

    const mtlContent = `
      # Blender exported material file
      newmtl CyberBlue
      Kd 0.0 0.5 1.0
      Pr 0.2
      Pm 0.1
      map_Bump textures/cyber_normal.png
      Ks 0.8 0.8 0.8
      illum 2

      newmtl GoldPlate
      Kd 1.0 0.84 0.0
      Pr 0.3
      Pm 0.95
      norm textures/gold_norm.png
    `;

    // Upload both files together
    await fileInput.setInputFiles([
      {
        name: "cyber_model.obj",
        mimeType: "text/plain",
        buffer: Buffer.from(objContent, "utf-8"),
      },
      {
        name: "cyber_model.mtl",
        mimeType: "text/plain",
        buffer: Buffer.from(mtlContent, "utf-8"),
      },
    ]);

    // Open Material Library Panel
    await page.getByTestId("material-library-button").click();
    const panel = page.getByTestId("material-library-panel");
    await expect(panel).toBeVisible();

    // Verify materials CyberBlue and GoldPlate are in the list
    await expect(panel.getByText("CyberBlue")).toBeVisible();
    await expect(panel.getByText("GoldPlate")).toBeVisible();

    // Verify CyberBlue details
    await panel.getByText("CyberBlue").click();
    const roughnessInput = page.getByTestId("material-roughness-input");
    const metalnessInput = page.getByTestId("material-metalness-input");
    await expect(roughnessInput).toHaveValue("0.2");
    await expect(metalnessInput).toHaveValue("0.1");

    // Intercept export download and verify extraProperties are preserved intact
    const downloadPromise = page.waitForEvent("download", (download) =>
      download.suggestedFilename().endsWith(".mtl")
    );

    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("export-obj-button").click();

    const download = await downloadPromise;
    const downloadStream = await download.createReadStream();
    expect(downloadStream).not.toBeNull();

    if (downloadStream) {
      const chunks: Buffer[] = [];
      for await (const chunk of downloadStream) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      const exportedMtlText = Buffer.concat(chunks).toString("utf-8");

      expect(exportedMtlText).toContain("newmtl CyberBlue");
      expect(exportedMtlText).toContain("map_Bump textures/cyber_normal.png");
      expect(exportedMtlText).toContain("Ks 0.8 0.8 0.8");
      expect(exportedMtlText).toContain("illum 2");
      expect(exportedMtlText).toContain("newmtl GoldPlate");
      expect(exportedMtlText).toContain("norm textures/gold_norm.png");
    }
  });

  test("Loads standalone MTL file via File Menu and merges into Material Library", async ({
    page,
  }) => {
    const mtlFileInput = page.getByTestId("mtl-file-input");

    const standaloneMtlContent = `
      newmtl EmeraldStone
      Kd 0.0 0.8 0.4
      Pr 0.15
      Pm 0.05
      bump textures/emerald_bump.png
    `;

    // Upload via mtl-file-input
    await mtlFileInput.setInputFiles({
      name: "gems.mtl",
      mimeType: "text/plain",
      buffer: Buffer.from(standaloneMtlContent, "utf-8"),
    });

    // Open Material Library Panel
    await page.getByTestId("material-library-button").click();
    const panel = page.getByTestId("material-library-panel");
    await expect(panel).toBeVisible();

    // Verify EmeraldStone is present
    await expect(panel.getByText("EmeraldStone")).toBeVisible();
    await panel.getByText("EmeraldStone").click();

    const roughnessInput = page.getByTestId("material-roughness-input");
    await expect(roughnessInput).toHaveValue("0.15");
  });
});
