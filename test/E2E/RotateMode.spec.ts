import { test, expect } from "@playwright/test";

test.describe("Rotate Mode Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Rotate button exists in side toolbar and requires orthographic view", async ({
    page,
  }) => {
    const rotateButton = page.getByTestId("mode-rotate-button");
    await expect(rotateButton).toBeVisible();
    await expect(rotateButton).toHaveText("Rotate");

    // Click Rotate while in default perspective view
    await rotateButton.click();

    // Error modal should appear indicating orthographic view is required
    const errorDialog = page.getByTestId("error-dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText("Switch to an Orthographic view");

    // Close error modal
    await page.getByTestId("error-dismiss-button").click();
  });

  test("Entering Rotate mode in orthographic view displays 4 rotate handles at mesh boundary", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    // Enter Rotate mode
    const rotateButton = page.getByTestId("mode-rotate-button");
    await rotateButton.click();

    // Four rotate handles should be visible
    const topLeft = page.getByTestId("rotate-handle-top-left");
    const topRight = page.getByTestId("rotate-handle-top-right");
    const bottomRight = page.getByTestId("rotate-handle-bottom-right");
    const bottomLeft = page.getByTestId("rotate-handle-bottom-left");
    const boundaryBox = page.getByTestId("rotate-boundary-box");

    await expect(topLeft).toBeVisible();
    await expect(topRight).toBeVisible();
    await expect(bottomRight).toBeVisible();
    await expect(bottomLeft).toBeVisible();
    await expect(boundaryBox).toBeVisible();

    // Capture visual screenshot of Rotate mode
    const artifactDir =
      "C:/Users/vinot/.gemini/antigravity/brain/8e432451-e813-4120-ae7e-4ad3989cb47d";
    await page.screenshot({ path: `${artifactDir}/rotate_mode_ortho_handles.png` });
  });

  test("Dragging a rotate handle rotates the mesh and supports undo/redo", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(200);

    // Enter Rotate mode
    await page.getByTestId("mode-rotate-button").click();

    // Get initial vertex position of starter cube vertex 0
    const initialVertex0 = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const model = canvas?.__viewportRenderer?.getCurrentModel();
      return model?.vertices[0]
        ? {
            x: model.vertices[0].coordinateX,
            y: model.vertices[0].coordinateY,
            z: model.vertices[0].coordinateZ,
          }
        : null;
    });

    expect(initialVertex0).not.toBeNull();

    // Drag top-right rotate handle in an arc
    const topRightHandle = page.getByTestId("rotate-handle-top-right");
    const box = await topRightHandle.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Move downward and leftward in a quarter circle
      await page.mouse.move(startX + 80, startY + 80, { steps: 5 });
      await page.mouse.up();
    }

    await page.waitForTimeout(200);

    // Get rotated vertex position
    const rotatedVertex0 = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const model = canvas?.__viewportRenderer?.getCurrentModel();
      return model?.vertices[0]
        ? {
            x: model.vertices[0].coordinateX,
            y: model.vertices[0].coordinateY,
            z: model.vertices[0].coordinateZ,
          }
        : null;
    });

    // Vertex 0 should have changed positions
    expect(rotatedVertex0?.x).not.toBeCloseTo(initialVertex0!.x, 2);

    // Test Undo
    const undoButton = page.getByTestId("undo-button");
    await undoButton.click();
    await page.waitForTimeout(200);

    const undoneVertex0 = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const model = canvas?.__viewportRenderer?.getCurrentModel();
      return model?.vertices[0]
        ? {
            x: model.vertices[0].coordinateX,
            y: model.vertices[0].coordinateY,
            z: model.vertices[0].coordinateZ,
          }
        : null;
    });

    expect(undoneVertex0?.x).toBeCloseTo(initialVertex0!.x, 3);
    expect(undoneVertex0?.y).toBeCloseTo(initialVertex0!.y, 3);

    // Test Redo
    const redoButton = page.getByTestId("redo-button");
    await redoButton.click();
    await page.waitForTimeout(200);

    const redoneVertex0 = await page.evaluate(() => {
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const model = canvas?.__viewportRenderer?.getCurrentModel();
      return model?.vertices[0]
        ? {
            x: model.vertices[0].coordinateX,
            y: model.vertices[0].coordinateY,
            z: model.vertices[0].coordinateZ,
          }
        : null;
    });

    expect(redoneVertex0?.x).toBeCloseTo(rotatedVertex0!.x, 3);
    expect(redoneVertex0?.y).toBeCloseTo(rotatedVertex0!.y, 3);
  });
});
