import { test, expect } from "@playwright/test";

test.describe("Edge Line Width Configuration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  test("Edge line width is configurable via Customize UI modal and persists on save", async ({
    page,
  }) => {
    // Open File Menu and click Customize UI
    await page.getByTestId("file-menu-button").click();
    const customizeMenuItem = page.getByTestId("customize-ui-button");
    await expect(customizeMenuItem).toBeVisible();
    await customizeMenuItem.click();

    const modal = page.getByTestId("customize-ui-modal");
    await expect(modal).toBeVisible();

    // Verify Edge Line Width field and default value (2)
    await expect(modal.getByText("Edge Line Width:")).toBeVisible();
    const lineWidthInput = page.getByTestId("edge-line-width-input");
    await expect(lineWidthInput).toBeVisible();
    await expect(lineWidthInput).toHaveValue("2");
    await expect(page.getByTestId("edge-line-width-value")).toHaveText("2px");

    // Change value to 6 and close without saving
    await lineWidthInput.fill("6");
    await expect(page.getByTestId("edge-line-width-value")).toHaveText("6px");
    await page.getByTestId("customize-ui-close-button").click();
    await expect(modal).toHaveCount(0);

    // Reopen modal and verify discarded changes (reset to 2)
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("customize-ui-button").click();
    await expect(page.getByTestId("edge-line-width-input")).toHaveValue("2");
    await expect(page.getByTestId("edge-line-width-value")).toHaveText("2px");

    // Change value to 4 and save
    await page.getByTestId("edge-line-width-input").fill("4");
    await expect(page.getByTestId("edge-line-width-value")).toHaveText("4px");
    await page.getByTestId("customize-ui-save-button").click();
    await expect(modal).toHaveCount(0);

    // Reopen modal and verify persisted change (4)
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("customize-ui-button").click();
    await expect(page.getByTestId("edge-line-width-input")).toHaveValue("4");
    await expect(page.getByTestId("edge-line-width-value")).toHaveText("4px");
    await page.getByTestId("customize-ui-close-button").click();
  });

  test("Changing edge line width updates the renderer's wireframe line width", async ({
    page,
  }) => {
    // Initial renderer wireframe line width should be default 2
    const initialLineWidth = await page.evaluate(() => {
      const canvas = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as unknown as {
        __viewportRenderer?: { getEdgeLineWidth: () => number };
      };
      return canvas?.__viewportRenderer?.getEdgeLineWidth();
    });
    expect(initialLineWidth).toBe(2);

    // Open Customize UI dialog, set line width to 5 and save
    await page.getByTestId("file-menu-button").click();
    await page.getByTestId("customize-ui-button").click();
    await page.getByTestId("edge-line-width-input").fill("5");
    await page.getByTestId("customize-ui-save-button").click();

    // Verify renderer's line width updated to 5
    const updatedLineWidth = await page.evaluate(() => {
      const canvas = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as unknown as {
        __viewportRenderer?: { getEdgeLineWidth: () => number };
        __appController?: { getEdgeLineWidth: () => number };
      };
      return {
        rendererWidth: canvas?.__viewportRenderer?.getEdgeLineWidth(),
        controllerWidth: canvas?.__appController?.getEdgeLineWidth(),
      };
    });

    expect(updatedLineWidth.rendererWidth).toBe(5);
    expect(updatedLineWidth.controllerWidth).toBe(5);
  });

  test("Edge lines on axes remain visible and thicker than axis lines", async ({
    page,
  }) => {
    // Switch to orthographic view (+Y) where cube edges align along the axes
    const topViewGizmo = page.getByRole("button", { name: "+Y" });
    if (await topViewGizmo.isVisible()) {
      await topViewGizmo.click();
    }

    // Verify wireframe renderer settings:
    // 1. wireframeLines renderOrder is 2 (higher than axisLinesInstance renderOrder 1)
    // 2. wireframeMaterial line width is >= 2 (thicker than 1px axis line)
    const lineRenderProperties = await page.evaluate(() => {
      const canvas = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as unknown as {
        __viewportRenderer?: {
          getEdgeLineWidth: () => number;
          wireframeLines?: { renderOrder: number };
          wireframeMaterial?: { linewidth: number; depthTest: boolean };
          axisLinesInstance?: { renderOrder: number };
        };
      };
      const renderer = canvas?.__viewportRenderer;
      return {
        wireframeRenderOrder: (renderer as unknown as { wireframeLines?: { renderOrder: number } })?.wireframeLines?.renderOrder,
        wireframeLineWidth: renderer?.getEdgeLineWidth(),
        wireframeDepthTest: (renderer as unknown as { wireframeMaterial?: { depthTest: boolean } })?.wireframeMaterial?.depthTest,
        axisRenderOrder: (renderer as unknown as { axisLinesInstance?: { renderOrder: number } })?.axisLinesInstance?.renderOrder ?? 1,
      };
    });

    expect(lineRenderProperties.wireframeRenderOrder).toBe(2);
    expect(lineRenderProperties.axisRenderOrder).toBe(1);
    expect(lineRenderProperties.wireframeRenderOrder).toBeGreaterThan(
      lineRenderProperties.axisRenderOrder
    );
    expect(lineRenderProperties.wireframeLineWidth).toBeGreaterThanOrEqual(2);
    expect(lineRenderProperties.wireframeDepthTest).toBe(true);
  });
});
