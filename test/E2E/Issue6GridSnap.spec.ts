import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Issue #6 Grid Snap as Option Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Grid Snap button toggles state between ON and OFF on toolbar", async ({
    page,
  }) => {
    const gridSnapButton = page.getByTestId("grid-snap-toggle-button");
    await expect(gridSnapButton).toBeVisible();
    await expect(gridSnapButton).toHaveText("Grid Snap: ON");

    await gridSnapButton.click();
    await expect(gridSnapButton).toHaveText("Grid Snap: OFF");

    await gridSnapButton.click();
    await expect(gridSnapButton).toHaveText("Grid Snap: ON");
  });

  test("In +Z orthographic view with Grid Snap ON, adding vertex snaps to integer coordinates", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    // Ensure Grid Snap is ON (default)
    const gridSnapButton = page.getByTestId("grid-snap-toggle-button");
    await expect(gridSnapButton).toHaveText("Grid Snap: ON");

    // Clear selection
    if (await page.getByTestId("clear-selection-button").isEnabled()) {
      await page.getByTestId("clear-selection-button").click();
    }

    // Enter Insert Mode
    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    // Click in open space away from existing vertices/edges
    await canvas.click({ position: { x: 233, y: 147 } });

    const addedVertex = await page.evaluate(() => {
      const canvasElement = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & {
        __viewportRenderer?: {
          getCurrentModel: () => {
            vertices: Array<{
              coordinateX: number;
              coordinateY: number;
              coordinateZ: number;
            }>;
          } | null;
        };
      }) | null;
      const model = canvasElement?.__viewportRenderer?.getCurrentModel();
      if (!model || model.vertices.length === 0) {
        return null;
      }
      return model.vertices[model.vertices.length - 1];
    });

    expect(addedVertex).not.toBeNull();
    // In XY grid plane, X and Y should snap to integers
    expect(Math.abs(addedVertex!.coordinateX - Math.round(addedVertex!.coordinateX))).toBeLessThan(0.0001);
    expect(Math.abs(addedVertex!.coordinateY - Math.round(addedVertex!.coordinateY))).toBeLessThan(0.0001);
  });

  test("In +Z orthographic view with Grid Snap OFF, adding vertex places it at continuous float coordinates", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    // Toggle Grid Snap to OFF
    const gridSnapButton = page.getByTestId("grid-snap-toggle-button");
    await gridSnapButton.click();
    await expect(gridSnapButton).toHaveText("Grid Snap: OFF");

    // Clear selection
    if (await page.getByTestId("clear-selection-button").isEnabled()) {
      await page.getByTestId("clear-selection-button").click();
    }

    // Enter Insert Mode
    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    // Click at an arbitrary float-producing position
    await canvas.click({ position: { x: 233, y: 147 } });

    const addedVertex = await page.evaluate(() => {
      const canvasElement = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & {
        __viewportRenderer?: {
          getCurrentModel: () => {
            vertices: Array<{
              coordinateX: number;
              coordinateY: number;
              coordinateZ: number;
            }>;
          } | null;
        };
      }) | null;
      const model = canvasElement?.__viewportRenderer?.getCurrentModel();
      if (!model || model.vertices.length === 0) {
        return null;
      }
      return model.vertices[model.vertices.length - 1];
    });

    expect(addedVertex).not.toBeNull();
    // When Grid Snap is OFF, the coordinate is unprojected continuous float, not an exact integer
    const diffFromIntegerX = Math.abs(addedVertex!.coordinateX - Math.round(addedVertex!.coordinateX));
    const diffFromIntegerY = Math.abs(addedVertex!.coordinateY - Math.round(addedVertex!.coordinateY));
    expect(diffFromIntegerX > 0.001 || diffFromIntegerY > 0.001).toBe(true);
  });

  test("In +Z orthographic view with Grid Snap ON, translating vertex keeps coordinates on integer grid", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    // Ensure Grid Snap is ON
    const gridSnapButton = page.getByTestId("grid-snap-toggle-button");
    await expect(gridSnapButton).toHaveText("Grid Snap: ON");

    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;

    // The front-face top-right vertex is at (1, 1, 1), projected at (centerX + 84, centerY - 84)
    const vertexPosition = { x: centerX + 84, y: centerY - 84 };

    // Select vertex
    await canvas.click({ position: vertexPosition });

    // Enter Translate Mode
    const translateModeButton = page.getByTestId("mode-translate-button");
    await translateModeButton.click();

    // Drag vertex by 60 pixels to the right
    await page.mouse.move(vertexPosition.x, vertexPosition.y);
    await page.mouse.down();
    await page.mouse.move(vertexPosition.x + 60, vertexPosition.y, { steps: 5 });
    await page.mouse.up();

    const translatedVertex = await page.evaluate(() => {
      const canvasElement = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & {
        __viewportRenderer?: {
          getCurrentModel: () => {
            vertices: Array<{
              coordinateX: number;
              coordinateY: number;
              coordinateZ: number;
            }>;
          } | null;
        };
      }) | null;
      const model = canvasElement?.__viewportRenderer?.getCurrentModel();
      if (!model) {
        return null;
      }
      // Return vertex with highest X coordinate
      return model.vertices.reduce((prevHighest, currentCandidate) => {
        return currentCandidate.coordinateX > prevHighest.coordinateX
          ? currentCandidate
          : prevHighest;
      }, model.vertices[0]);
    });

    expect(translatedVertex).not.toBeNull();
    // Grid snap on XY plane ensures X and Y are exact integers
    expect(Math.abs(translatedVertex!.coordinateX - Math.round(translatedVertex!.coordinateX))).toBeLessThan(0.0001);
    expect(Math.abs(translatedVertex!.coordinateY - Math.round(translatedVertex!.coordinateY))).toBeLessThan(0.0001);
  });

  test("In +Z orthographic view with Grid Snap OFF, translating vertex moves to continuous float coordinates", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    // Toggle Grid Snap OFF
    const gridSnapButton = page.getByTestId("grid-snap-toggle-button");
    await gridSnapButton.click();
    await expect(gridSnapButton).toHaveText("Grid Snap: OFF");

    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;

    const vertexPosition = { x: centerX + 84, y: centerY - 84 };

    // Select vertex
    await canvas.click({ position: vertexPosition });

    // Enter Translate Mode
    const translateModeButton = page.getByTestId("mode-translate-button");
    await translateModeButton.click();

    // Drag vertex by 25 pixels (not a whole grid step)
    await page.mouse.move(vertexPosition.x, vertexPosition.y);
    await page.mouse.down();
    await page.mouse.move(vertexPosition.x + 25, vertexPosition.y - 15, { steps: 5 });
    await page.mouse.up();

    const translatedVertex = await page.evaluate(() => {
      const canvasElement = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as (HTMLCanvasElement & {
        __viewportRenderer?: {
          getCurrentModel: () => {
            vertices: Array<{
              coordinateX: number;
              coordinateY: number;
              coordinateZ: number;
            }>;
          } | null;
        };
      }) | null;
      const model = canvasElement?.__viewportRenderer?.getCurrentModel();
      if (!model) {
        return null;
      }
      return model.vertices.reduce((prevHighest, currentCandidate) => {
        return currentCandidate.coordinateX > prevHighest.coordinateX
          ? currentCandidate
          : prevHighest;
      }, model.vertices[0]);
    });

    expect(translatedVertex).not.toBeNull();
    // Continuous coordinates: not an integer
    const diffFromIntegerX = Math.abs(translatedVertex!.coordinateX - Math.round(translatedVertex!.coordinateX));
    expect(diffFromIntegerX).toBeGreaterThan(0.001);
  });
});
