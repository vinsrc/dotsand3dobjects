import { test, expect } from "@playwright/test";

test.describe("Issue #17: UX improvements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  const getVertexScreenCoords = async (page: any, vertexIndex: number) => {
    return page.evaluate((idx: number) => {
      const canvasEl = document.querySelector(
        '[data-testid="viewport-canvas"]'
      ) as any;
      const renderer = canvasEl?.__viewportRenderer;
      const camera = renderer?.getActiveCamera();
      const model = renderer?.getCurrentModel();
      const vertex = model?.vertices[idx];
      const THREE = (window as any).THREE;
      const vec = new THREE.Vector3(
        vertex.coordinateX,
        vertex.coordinateY,
        vertex.coordinateZ
      );
      vec.project(camera);
      const rect = canvasEl.getBoundingClientRect();
      const x = rect.left + ((vec.x + 1) * rect.width) / 2;
      const y = rect.top + ((-vec.y + 1) * rect.height) / 2;
      return { x, y };
    }, vertexIndex);
  };

  test("In INSERT mode with Auto Connect ON, clicking existing vertices connects them and preserves selection", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");

    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(100);

    // Enter INSERT mode
    await page.getByTestId("mode-insert-button").click();
    const autoConnectBtn = page.getByTestId("auto-connect-toggle-button");
    await expect(autoConnectBtn).toBeVisible();

    // Turn Auto Connect ON
    await autoConnectBtn.click();
    await expect(autoConnectBtn).toHaveText("Auto Connect: ON");

    // Get screen coordinates of Vertex 4 (-1, -1, 1) and Vertex 6 (1, 1, 1)
    // Note: in starter cube, 4 and 6 are diagonal corners and DO NOT share an edge
    const vertex4Coords = await getVertexScreenCoords(page, 4);
    const vertex6Coords = await getVertexScreenCoords(page, 6);

    // Initial check: no explicit edges
    let hasEdge46 = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.explicitEdges?.some(
        ([a, b]: [number, number]) =>
          (a === 4 && b === 6) || (a === 6 && b === 4)
      );
    });
    expect(hasEdge46).toBe(false);

    // Click Vertex 4 to select it
    await page.mouse.click(vertex4Coords.x, vertex4Coords.y);

    // Click Vertex 6: since Auto Connect is ON, this should connect 4 and 6!
    await page.mouse.click(vertex6Coords.x, vertex6Coords.y);

    // Verify explicit edge [4, 6] exists
    hasEdge46 = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.explicitEdges?.some(
        ([a, b]: [number, number]) =>
          (a === 4 && b === 6) || (a === 6 && b === 4)
      );
    });
    expect(hasEdge46).toBe(true);

    // Verify that Vertex 6 remains selected
    const activeVertex = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.currentSelectedIndices ?? [];
    });
    expect(activeVertex).toEqual([6]);

    // Now click Vertex 7 (-1, 1, 1) to select it, then Vertex 5 (1, -1, 1):
    // Vertices 7 and 5 do not share an edge in the starter cube, so they should connect!
    const vertex7Coords = await getVertexScreenCoords(page, 7);
    const vertex5Coords = await getVertexScreenCoords(page, 5);

    await page.mouse.click(vertex7Coords.x, vertex7Coords.y);
    await page.mouse.click(vertex5Coords.x, vertex5Coords.y);

    const hasEdge75 = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.explicitEdges?.some(
        ([a, b]: [number, number]) =>
          (a === 7 && b === 5) || (a === 5 && b === 7)
      );
    });
    expect(hasEdge75).toBe(true);

    const activeVertexFinal = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.currentSelectedIndices ?? [];
    });
    expect(activeVertexFinal).toEqual([5]);
  });

  test("In INSERT mode with Auto Connect OFF, clicking existing vertices does not connect them", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");

    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(100);

    // Enter INSERT mode (Auto Connect is OFF by default)
    await page.getByTestId("mode-insert-button").click();
    const autoConnectBtn = page.getByTestId("auto-connect-toggle-button");
    await expect(autoConnectBtn).toHaveText("Auto Connect: OFF");

    const vertex4Coords = await getVertexScreenCoords(page, 4);
    const vertex6Coords = await getVertexScreenCoords(page, 6);

    // Click Vertex 4, then Click Vertex 6
    await page.mouse.click(vertex4Coords.x, vertex4Coords.y);
    await page.mouse.click(vertex6Coords.x, vertex6Coords.y);

    // Verify NO explicit edge was created
    const hasEdge46 = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.explicitEdges?.some(
        ([a, b]: [number, number]) =>
          (a === 4 && b === 6) || (a === 6 && b === 4)
      );
    });
    expect(hasEdge46).toBe(false);

    // Only Vertex 6 is selected
    const selectedIndices = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.currentSelectedIndices ?? [];
    });
    expect(selectedIndices).toEqual([6]);
  });

  test("Selecting two vertices and entering FILL mode automatically connects them with an edge", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");

    // Switch to orthographic +Z view
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.waitForTimeout(100);

    // Enter MULTI_SELECT mode to select vertices 4 and 6
    await page.getByTestId("mode-multi-select-button").click();

    const vertex4Coords = await getVertexScreenCoords(page, 4);
    const vertex6Coords = await getVertexScreenCoords(page, 6);

    await page.mouse.click(vertex4Coords.x, vertex4Coords.y);
    await page.mouse.click(vertex6Coords.x, vertex6Coords.y);

    const selectedBefore = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      return renderer?.currentSelectedIndices ?? [];
    });
    expect(selectedBefore).toHaveLength(2);

    // Initial check: no explicit edges
    let hasEdge46 = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.explicitEdges?.some(
        ([a, b]: [number, number]) =>
          (a === 4 && b === 6) || (a === 6 && b === 4)
      );
    });
    expect(hasEdge46).toBe(false);

    // Now enter FILL mode
    await page.getByTestId("mode-fill-button").click();

    // Verify explicit edge [4, 6] was automatically created!
    hasEdge46 = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.explicitEdges?.some(
        ([a, b]: [number, number]) =>
          (a === 4 && b === 6) || (a === 6 && b === 4)
      );
    });
    expect(hasEdge46).toBe(true);

    // Click Undo: edge should be undone
    await page.getByTestId("undo-button").click();
    hasEdge46 = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.explicitEdges?.some(
        ([a, b]: [number, number]) =>
          (a === 4 && b === 6) || (a === 6 && b === 4)
      );
    });
    expect(hasEdge46).toBe(false);

    // Click Redo: edge should be restored
    await page.getByTestId("redo-button").click();
    hasEdge46 = await canvas.evaluate((el) => {
      const renderer = (el as any).__viewportRenderer;
      const model = renderer?.getCurrentModel();
      return model?.explicitEdges?.some(
        ([a, b]: [number, number]) =>
          (a === 4 && b === 6) || (a === 6 && b === 4)
      );
    });
    expect(hasEdge46).toBe(true);
  });
});
