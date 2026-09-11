import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Issue #5 Vertex Plane Placement Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Without vertex selected, placing vertex in +Z view adds it at Z=0", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    // Ensure no vertex is selected
    if (await page.getByTestId("clear-selection-button").isEnabled()) {
      await page.getByTestId("clear-selection-button").click();
    }

    // Enter Insert Mode
    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    // Click in open space
    await canvas.click({ position: { x: 250, y: 150 } });

    // Retrieve last vertex from model
    const lastVertex = await page.evaluate(() => {
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

    expect(lastVertex).not.toBeNull();
    expect(lastVertex?.coordinateZ).toBe(0);
  });

  test("With front vertex selected (Z=1), placing vertex in +Z view adds it at Z=1", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;

    // The cube has vertices at Z = 1 (front face).
    // In +Z orthographic view, the top-right corner of the front face is at centerX + 84, centerY - 84
    const vertexTopRight = { x: centerX + 84, y: centerY - 84 };

    // Tap the vertex to select it
    await canvas.click({ position: vertexTopRight });

    // Enter Insert mode
    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    // Click in open space
    await canvas.click({ position: { x: 200, y: 150 } });

    const lastVertex = await page.evaluate(() => {
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

    expect(lastVertex).not.toBeNull();
    // Must be placed on the exact same Z plane as selected vertex (Z=1)
    expect(lastVertex?.coordinateZ).toBe(1);
  });

  test("With top vertex selected (Y=1), placing vertex in +Y view adds it at Y=1", async ({
    page,
  }) => {
    // Switch to orthographic +Y view (looking down Y axis onto XZ plane)
    await page.getByTestId("gizmo-axis-+Y").click();

    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;

    // Tap top-right vertex on cube
    const vertexTopRight = { x: centerX + 84, y: centerY - 84 };
    await canvas.click({ position: vertexTopRight });

    // Enter Insert mode
    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    // Click in open space
    await canvas.click({ position: { x: 200, y: 150 } });

    const lastVertex = await page.evaluate(() => {
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

    expect(lastVertex).not.toBeNull();
    // Must be placed on the exact same Y plane as selected vertex (Y=1)
    expect(lastVertex?.coordinateY).toBe(1);
  });

  test("With right vertex selected (X=1), placing vertex in +X view adds it at X=1", async ({
    page,
  }) => {
    // Switch to orthographic +X view (looking along X axis onto YZ plane)
    await page.getByTestId("gizmo-axis-+X").click();

    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;

    // Tap top-right vertex on cube
    const vertexTopRight = { x: centerX + 84, y: centerY - 84 };
    await canvas.click({ position: vertexTopRight });

    // Enter Insert mode
    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    // Click in open space
    await canvas.click({ position: { x: 200, y: 150 } });

    const lastVertex = await page.evaluate(() => {
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

    expect(lastVertex).not.toBeNull();
    // Must be placed on the exact same X plane as selected vertex (X=1)
    expect(lastVertex?.coordinateX).toBe(1);
  });

  test("Clicking an existing vertex in Insert Mode selects it as the anchor", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    // Enter Insert mode directly
    const insertModeButton = page.getByTestId("mode-insert-button");
    await insertModeButton.click();

    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;

    // Tap vertex directly while in Insert mode
    const vertexBottomLeft = { x: centerX - 84, y: centerY + 84 };
    await canvas.click({ position: vertexBottomLeft });

    // Now click in open space
    await canvas.click({ position: { x: 180, y: 180 } });

    const lastVertex = await page.evaluate(() => {
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

    expect(lastVertex).not.toBeNull();
    expect(lastVertex?.coordinateZ).toBe(1);
  });
});
