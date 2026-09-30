import { test, expect } from "@playwright/test";

test.describe("Active Plane Vertex Filtering in Orthographic View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("viewport-canvas")).toBeVisible();
  });

  test("renders vertices outside the active depth plane as low-opacity outlines and restricts interaction to the active plane", async ({
    page,
  }) => {
    // 1. Load an OBJ with vertices at two distinct Y planes: Y=0 and Y=5
    const objContent = `
v -2.0 0.0 -2.0
v 2.0 0.0 -2.0
v 2.0 0.0 2.0
v -2.0 0.0 2.0
v -2.0 5.0 -2.0
v 2.0 5.0 -2.0
v 2.0 5.0 2.0
v -2.0 5.0 2.0
f 1 2 3 4
f 5 6 7 8
`;
    await page.getByTestId("file-input").setInputFiles({
      name: "planes.obj",
      mimeType: "text/plain",
      buffer: Buffer.from(objContent),
    });

    // 2. Switch to +Y orthographic view (looking down Y axis at XZ plane)
    await page.getByTestId("gizmo-axis-+Y").click();

    // Verify initial state: with no vertex selected, getVisibleVertexIndices is null (all visible)
    const initialVisible = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      return canvas?.__appController?.getVisibleVertexIndices();
    });
    expect(initialVisible).toBeNull();

    // 3. Select vertex 4 (which is at Y = 5)
    await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      canvas?.__appController?.selectSingleVertex(4);
    });

    // 4. Verify only vertices at Y = 5 (indices 4, 5, 6, 7) are in active plane indices
    const visibleAfterSelection = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      return canvas?.__appController?.getVisibleVertexIndices();
    });
    expect(visibleAfterSelection).toEqual([4, 5, 6, 7]);

    // Verify active vertices count is 4, and inactive (outline) vertices count is 4
    const vertexRenderCounts = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      const renderer = canvas?.__viewportRenderer;
      return {
        activeCount: renderer?.vertexPoints?.geometry?.attributes?.position?.count,
        inactiveCount: renderer?.inactiveVertexPoints?.geometry?.attributes?.position?.count,
        inactiveOpacity: renderer?.inactiveVertexPoints?.material?.opacity,
        inactiveTransparent: renderer?.inactiveVertexPoints?.material?.transparent,
      };
    });
    expect(vertexRenderCounts.activeCount).toBe(4);
    expect(vertexRenderCounts.inactiveCount).toBe(4);
    expect(vertexRenderCounts.inactiveTransparent).toBe(true);
    expect(vertexRenderCounts.inactiveOpacity).toBeLessThanOrEqual(0.4);

    // 5. In INSERT mode, clicking adds a new vertex on the Y=5 plane
    await page.getByTestId("mode-insert-button").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    // Click in open space on the canvas
    const clickX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) * 0.4;
    const clickY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) * 0.4;
    await page.mouse.click(clickX, clickY);

    // Verify a new vertex was added and its Y coordinate matches the selected vertex (vertex 4)
    const [lastVertexY, selectedVertexY] = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="viewport-canvas"]') as any;
      const controller = canvasEl?.__appController;
      const vertices = controller.getModelService().getCurrentModel().vertices;
      return [vertices[vertices.length - 1]?.coordinateY, vertices[4]?.coordinateY];
    });
    expect(lastVertexY).toBeCloseTo(selectedVertexY, 3);

    // 6. Clearing selection makes all vertices active again and resets inactive points
    await page.getByTestId("clear-selection-button").click();

    const visibleAfterClear = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="viewport-canvas"]') as any;
      return canvasEl?.__appController?.getVisibleVertexIndices();
    });
    expect(visibleAfterClear).toBeNull();

    const allRenderedCounts = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      const renderer = canvas?.__viewportRenderer;
      return {
        activeCount: renderer?.vertexPoints?.geometry?.attributes?.position?.count,
        inactiveCount: renderer?.inactiveVertexPoints?.geometry?.attributes?.position?.count ?? 0,
      };
    });
    // 8 original vertices + 1 added vertex = 9 active vertices, 0 inactive vertices
    expect(allRenderedCounts.activeCount).toBe(9);
    expect(allRenderedCounts.inactiveCount).toBe(0);
  });

  test("in INSERT mode, clicking at screen position occluded by a background vertex adds on active plane instead of selecting background vertex", async ({
    page,
  }) => {
    // 1. Load an OBJ with vertices at two distinct Y planes:
    // Vertex 0 at (-1, 0, -1) [plane Y=0]
    // Vertex 1 at ( 1, 0,  1) [plane Y=0]
    // Vertex 2 at ( 0, 5,  0) [plane Y=5, background along Y axis]
    const objContent = `
v -1.0 0.0 -1.0
v 1.0 0.0 1.0
v 0.0 5.0 0.0
f 1 2 3
`;
    await page.getByTestId("file-input").setInputFiles({
      name: "occlusion.obj",
      mimeType: "text/plain",
      buffer: Buffer.from(objContent),
    });

    // 2. Switch to +Y orthographic view (looking down Y axis at XZ plane)
    await page.getByTestId("gizmo-axis-+Y").click();

    // 3. Select vertex 0 (which is on the active plane Y=0)
    await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      canvas?.__appController?.selectSingleVertex(0);
    });

    // Verify visible vertex indices only include vertices at Y=0 (indices 0 and 1)
    const visibleIndices = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      return canvas?.__appController?.getVisibleVertexIndices();
    });
    expect(visibleIndices).toEqual([0, 1]);

    // 4. Enter INSERT mode
    await page.getByTestId("mode-insert-button").click();

    // 5. Get the screen coordinates of vertex 2 (which is at Y=5, but shares X=0, Z=0 in +Y view)
    const vertex2ScreenPos = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="viewport-canvas"]') as any;
      const renderer = canvasEl?.__viewportRenderer;
      const camera = renderer?.getActiveCamera();
      const model = canvasEl?.__appController?.getModelService()?.getCurrentModel();
      const vertex = model?.vertices[2];
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
    });

    // 6. Click directly at vertex 2's screen position!
    // Since vertex 2 is on Y=5 and hidden, raycasting should NOT select or connect vertex 2.
    // Instead, it should add a new vertex on the active plane (Y coordinate matching vertex 0).
    await page.mouse.click(vertex2ScreenPos.x, vertex2ScreenPos.y);

    const result = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="viewport-canvas"]') as any;
      const controller = canvasEl?.__appController;
      const model = controller.getModelService().getCurrentModel();
      const vertices = model.vertices;
      const activeVertex = controller.getSelectionService().getActiveVertex();
      return {
        totalVertices: vertices.length,
        lastVertex: {
          x: vertices[vertices.length - 1].coordinateX,
          y: vertices[vertices.length - 1].coordinateY,
          z: vertices[vertices.length - 1].coordinateZ,
        },
        selectedVertexY: vertices[0].coordinateY,
        activeVertex,
      };
    });

    // Total vertices should now be 4 (3 original + 1 newly added)
    expect(result.totalVertices).toBe(4);
    // The newly added vertex's Y must match vertex 0's Y (the active plane)
    expect(result.lastVertex.y).toBeCloseTo(result.selectedVertexY, 3);
    // Vertex 2 (background vertex) was NOT selected; the newly inserted vertex (index 3) is active
    expect(result.activeVertex).toBe(3);
  });

  test("in DEFAULT mode, clicking directly on an inactive background vertex does not select it", async ({
    page,
  }) => {
    const objContent = `
v -1.0 0.0 -1.0
v 1.0 0.0 1.0
v 0.0 5.0 0.0
f 1 2 3
`;
    await page.getByTestId("file-input").setInputFiles({
      name: "inactive_selection.obj",
      mimeType: "text/plain",
      buffer: Buffer.from(objContent),
    });

    // 2. Switch to +Y orthographic view
    await page.getByTestId("gizmo-axis-+Y").click();

    // 3. Select vertex 0 (on plane Y=0)
    await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      canvas?.__appController?.selectSingleVertex(0);
    });

    // Verify vertex 2 (at Y=5) is inactive
    const inactiveCount = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      return canvas?.__viewportRenderer?.inactiveVertexPoints?.geometry?.attributes?.position?.count;
    });
    expect(inactiveCount).toBe(1);

    // 4. Get screen position of vertex 2
    const vertex2Pos = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="viewport-canvas"]') as any;
      const renderer = canvasEl?.__viewportRenderer;
      const camera = renderer?.getActiveCamera();
      const model = canvasEl?.__appController?.getModelService()?.getCurrentModel();
      const vertex = model?.vertices[2];
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
    });

    // 5. In DEFAULT mode, click directly at vertex 2's screen position
    await page.mouse.click(vertex2Pos.x, vertex2Pos.y);

    // Inactive vertex 2 should NOT be selected
    const selectedIndices = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="viewport-canvas"]') as any;
      return canvas?.__appController?.getSelectionService()?.getSelectedIndices();
    });
    expect(selectedIndices).not.toContain(2);
  });
});


