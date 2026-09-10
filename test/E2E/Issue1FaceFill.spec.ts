import { test, expect } from "@playwright/test";

test.describe("WireframeVibe3D Issue #1 Face Fill Functional Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("Face Fill button is visible only when Fill Mode is selected", async ({
    page,
  }) => {
    // Initially in Default Mode: Face Fill button must not be visible
    await expect(page.getByTestId("face-fill-button")).not.toBeVisible();

    // Switch to Multi Select Mode: still not visible
    await page.getByTestId("mode-multi-select-button").click();
    await expect(page.getByTestId("face-fill-button")).not.toBeVisible();

    // Switch to Fill Mode: Face Fill button must now be visible
    await page.getByTestId("mode-fill-button").click();
    await expect(page.getByTestId("face-fill-button")).toBeVisible();

    // Switch to Insert Mode: Face Fill button should disappear
    await page.getByTestId("mode-insert-button").click();
    await expect(page.getByTestId("face-fill-button")).not.toBeVisible();
  });

  test("Face Fill button is disabled when fewer than 3 vertices are selected", async ({
    page,
  }) => {
    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();

    // Enter Fill Mode with 0 selected vertices
    await page.getByTestId("mode-fill-button").click();
    await expect(page.getByTestId("face-fill-button")).toBeVisible();
    await expect(page.getByTestId("face-fill-button")).toBeDisabled();

    // Click 1 vertex in canvas
    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;
    const vertexPosition = { x: centerX + 84, y: centerY - 84 };

    await canvas.click({ position: vertexPosition });
    // 1 vertex selected: Face Fill should still be disabled
    await expect(page.getByTestId("face-fill-button")).toBeDisabled();
  });

  test("Selecting 3 vertices enables Face Fill, creating a face clears selection, and supports Undo/Redo", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();
    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;

    // In Multi Select Mode, select 3 vertices of the cube front face
    await page.getByTestId("mode-multi-select-button").click();

    // Vertex 1: top-right
    await canvas.click({ position: { x: centerX + 84, y: centerY - 84 } });
    // Vertex 2: bottom-right
    await canvas.click({ position: { x: centerX + 84, y: centerY + 84 } });
    // Vertex 3: bottom-left
    await canvas.click({ position: { x: centerX - 84, y: centerY + 84 } });

    // Switch to Fill Mode
    await page.getByTestId("mode-fill-button").click();
    await expect(page.getByTestId("face-fill-button")).toBeVisible();

    // With 3 vertices selected, Face Fill must be enabled
    await expect(page.getByTestId("face-fill-button")).toBeEnabled();

    // Click Face Fill
    await page.getByTestId("face-fill-button").click();

    // Selection should be cleared, disabling Face Fill button
    await expect(page.getByTestId("face-fill-button")).toBeDisabled();

    // Undo should be enabled
    await expect(page.getByTestId("undo-button")).toBeEnabled();

    // Undo face creation: restores selection of 3 vertices, enabling Face Fill again
    await page.getByTestId("undo-button").click();
    await expect(page.getByTestId("face-fill-button")).toBeEnabled();

    // Redo face creation: applies face, clears selection, disabling Face Fill
    await page.getByTestId("redo-button").click();
    await expect(page.getByTestId("face-fill-button")).toBeDisabled();
  });

  test("Selecting 4 vertices enables Face Fill and creates a quad face", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();
    const canvas = page.getByTestId("viewport-canvas");
    const boundingBox = await canvas.boundingBox();
    const centerX = (boundingBox?.width ?? 1280) / 2;
    const centerY = (boundingBox?.height ?? 672) / 2;

    // In Multi Select Mode, select 4 vertices
    await page.getByTestId("mode-multi-select-button").click();

    // Select 4 vertices
    await canvas.click({ position: { x: centerX + 84, y: centerY - 84 } });
    await canvas.click({ position: { x: centerX + 84, y: centerY + 84 } });
    await canvas.click({ position: { x: centerX - 84, y: centerY + 84 } });
    await canvas.click({ position: { x: centerX - 84, y: centerY - 84 } });

    // Switch to Fill Mode
    await page.getByTestId("mode-fill-button").click();
    await expect(page.getByTestId("face-fill-button")).toBeVisible();
    await expect(page.getByTestId("face-fill-button")).toBeEnabled();

    // Click Face Fill
    await page.getByTestId("face-fill-button").click();

    // Selection cleared, button disabled
    await expect(page.getByTestId("face-fill-button")).toBeDisabled();
  });
});
