import { test, expect } from "@playwright/test";

test.describe("Viewport Pan Support", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas']");
  });

  test("Desktop right-click drag in perspective view pans the camera and changes camera position", async ({
    page,
  }) => {
    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const startX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const startY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    const initialCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });
    expect(initialCameraPos).not.toBeNull();

    // Right-click and drag across viewport canvas
    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(startX + 80, startY + 50, { steps: 10 });
    await page.mouse.up({ button: "right" });

    const pannedCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });
    expect(pannedCameraPos).not.toBeNull();

    // Verify camera moved in 3D space
    const distanceMoved = Math.hypot(
      (pannedCameraPos?.x ?? 0) - (initialCameraPos?.x ?? 0),
      (pannedCameraPos?.y ?? 0) - (initialCameraPos?.y ?? 0),
      (pannedCameraPos?.z ?? 0) - (initialCameraPos?.z ?? 0)
    );
    expect(distanceMoved).toBeGreaterThan(0.2);

    // Clicking Center Object resets camera back
    const centerButton = page.getByTestId("center-object-button");
    await centerButton.click();

    const resetCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });

    expect(resetCameraPos?.x).toBeCloseTo(initialCameraPos?.x ?? 0, 1);
    expect(resetCameraPos?.y).toBeCloseTo(initialCameraPos?.y ?? 0, 1);
    expect(resetCameraPos?.z).toBeCloseTo(initialCameraPos?.z ?? 0, 1);
  });

  test("Desktop right-click drag in orthographic view pans the camera and changes position", async ({
    page,
  }) => {
    // Switch to +Z orthographic view
    const gizmoZ = page.getByTestId("gizmo-axis-+Z");
    await gizmoZ.click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const startX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const startY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    const initialCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });
    expect(initialCameraPos).not.toBeNull();

    // Right-click drag in orthographic view
    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(startX + 100, startY + 60, { steps: 10 });
    await page.mouse.up({ button: "right" });

    const pannedCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });
    expect(pannedCameraPos).not.toBeNull();

    // In +Z view, right-click drag shifts X and Y (depth Z remains unchanged)
    expect(Math.abs((pannedCameraPos?.x ?? 0) - (initialCameraPos?.x ?? 0))).toBeGreaterThan(0.2);
    expect(Math.abs((pannedCameraPos?.y ?? 0) - (initialCameraPos?.y ?? 0))).toBeGreaterThan(0.2);
    expect(pannedCameraPos?.z).toBeCloseTo(initialCameraPos?.z ?? 0, 3);

    // Clicking Center Object resets pan
    const centerButton = page.getByTestId("center-object-button");
    await centerButton.click();

    const resetCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });
    expect(resetCameraPos?.x).toBeCloseTo(initialCameraPos?.x ?? 0, 1);
    expect(resetCameraPos?.y).toBeCloseTo(initialCameraPos?.y ?? 0, 1);
  });

  test("Right-click prevents browser context menu on canvas", async ({
    page,
  }) => {
    const isPrevented = await page.evaluate(() => {
      const canvas = document.querySelector("[data-testid='viewport-canvas']");
      const event = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      canvas?.dispatchEvent(event);
      return event.defaultPrevented;
    });

    expect(isPrevented).toBe(true);
  });

  test("Right-click does not select vertices or trigger UI mode operations", async ({
    page,
  }) => {
    // Switch to orthographic view
    await page.getByTestId("gizmo-axis-+Z").click();

    const canvas = page.getByTestId("viewport-canvas");
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    const startX = (canvasBox?.x ?? 0) + (canvasBox?.width ?? 0) / 2;
    const startY = (canvasBox?.y ?? 0) + (canvasBox?.height ?? 0) / 2;

    // Right-click on center where a vertex or edge may be
    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: "right" });
    await page.mouse.up({ button: "right" });

    // Selection count / clear selection button should remain disabled (no vertex selected)
    const clearSelectionButton = page.getByTestId("clear-selection-button");
    await expect(clearSelectionButton).toBeDisabled();
  });

  test("Two-finger touch drag in orthographic view pans the camera", async ({
    page,
  }) => {
    await page.getByTestId("gizmo-axis-+Z").click();

    const initialCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });

    // Simulate two-finger touch drag on container
    await page.evaluate(() => {
      const container = document.querySelector(
        "[data-testid='viewport-canvas-container']"
      ) as HTMLElement;
      if (!container) return;

      const t1Start = new Touch({
        identifier: 1,
        target: container,
        clientX: 200,
        clientY: 200,
      });
      const t2Start = new Touch({
        identifier: 2,
        target: container,
        clientX: 250,
        clientY: 200,
      });
      container.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [t1Start, t2Start],
          bubbles: true,
        })
      );

      const t1Move = new Touch({
        identifier: 1,
        target: container,
        clientX: 260,
        clientY: 240,
      });
      const t2Move = new Touch({
        identifier: 2,
        target: container,
        clientX: 310,
        clientY: 240,
      });
      container.dispatchEvent(
        new TouchEvent("touchmove", {
          touches: [t1Move, t2Move],
          bubbles: true,
          cancelable: true,
        })
      );

      container.dispatchEvent(
        new TouchEvent("touchend", {
          touches: [],
          bubbles: true,
        })
      );
    });

    const pannedCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });

    // Verify panning occurred
    expect(
      Math.abs((pannedCameraPos?.x ?? 0) - (initialCameraPos?.x ?? 0)) +
      Math.abs((pannedCameraPos?.y ?? 0) - (initialCameraPos?.y ?? 0))
    ).toBeGreaterThan(0.1);
  });

  test("Two-finger touch drag in perspective view pans the camera", async ({
    page,
  }) => {
    // Starts in perspective view by default
    const initialCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });

    // Simulate two-finger touch drag on container
    await page.evaluate(() => {
      const container = document.querySelector(
        "[data-testid='viewport-canvas-container']"
      ) as HTMLElement;
      if (!container) return;

      const t1Start = new Touch({
        identifier: 1,
        target: container,
        clientX: 200,
        clientY: 200,
      });
      const t2Start = new Touch({
        identifier: 2,
        target: container,
        clientX: 250,
        clientY: 200,
      });
      container.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [t1Start, t2Start],
          bubbles: true,
        })
      );

      const t1Move = new Touch({
        identifier: 1,
        target: container,
        clientX: 270,
        clientY: 250,
      });
      const t2Move = new Touch({
        identifier: 2,
        target: container,
        clientX: 320,
        clientY: 250,
      });
      container.dispatchEvent(
        new TouchEvent("touchmove", {
          touches: [t1Move, t2Move],
          bubbles: true,
          cancelable: true,
        })
      );

      container.dispatchEvent(
        new TouchEvent("touchend", {
          touches: [],
          bubbles: true,
        })
      );
    });

    const pannedCameraPos = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      const camera = canvasEl?.__viewportRenderer?.getActiveCamera();
      return camera
        ? { x: camera.position.x, y: camera.position.y, z: camera.position.z }
        : null;
    });

    // Verify panning moved the camera in perspective view
    const distanceMoved = Math.hypot(
      (pannedCameraPos?.x ?? 0) - (initialCameraPos?.x ?? 0),
      (pannedCameraPos?.y ?? 0) - (initialCameraPos?.y ?? 0),
      (pannedCameraPos?.z ?? 0) - (initialCameraPos?.z ?? 0)
    );
    expect(distanceMoved).toBeGreaterThan(0.1);
  });

  test("Two-finger touch drag does not trigger phantom tap/vertex creation upon touch lift", async ({
    page,
  }) => {
    // Switch to orthographic view and enter INSERT mode
    await page.getByTestId("gizmo-axis-+Z").click();
    await page.getByTestId("mode-insert-button").click();

    const initialVertexCount = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      return canvasEl?.__viewportRenderer?.getCurrentModel()?.vertices?.length ?? 0;
    });
    expect(initialVertexCount).toBe(8); // starter cube has 8 vertices

    // Simulate two-finger touch start, move (pan), and release with realistic PointerEvent sequence
    await page.evaluate(() => {
      const container = document.querySelector(
        "[data-testid='viewport-canvas-container']"
      ) as HTMLElement;
      const canvas = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as HTMLCanvasElement;
      if (!container || !canvas) return;

      // Primary touch pointerdown
      canvas.dispatchEvent(
        new PointerEvent("pointerdown", {
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true,
          clientX: 200,
          clientY: 200,
          bubbles: true,
        })
      );

      // Two-finger touchstart
      const t1 = new Touch({ identifier: 1, target: container, clientX: 200, clientY: 200 });
      const t2 = new Touch({ identifier: 2, target: container, clientX: 260, clientY: 200 });
      container.dispatchEvent(new TouchEvent("touchstart", { touches: [t1, t2], bubbles: true }));

      // Two-finger touchmove (pan)
      const t1m = new Touch({ identifier: 1, target: container, clientX: 240, clientY: 240 });
      const t2m = new Touch({ identifier: 2, target: container, clientX: 300, clientY: 240 });
      container.dispatchEvent(new TouchEvent("touchmove", { touches: [t1m, t2m], bubbles: true }));

      // Two-finger touchend
      container.dispatchEvent(new TouchEvent("touchend", { touches: [], bubbles: true }));

      // Pointerup on finger lift
      canvas.dispatchEvent(
        new PointerEvent("pointerup", {
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true,
          clientX: 240,
          clientY: 240,
          bubbles: true,
        })
      );
    });

    // Verify vertex count is STILL 8 (no accidental vertex was created on touch lift!)
    const finalVertexCount = await page.evaluate(() => {
      const canvasEl = document.querySelector(
        "[data-testid='viewport-canvas']"
      ) as any;
      return canvasEl?.__viewportRenderer?.getCurrentModel()?.vertices?.length ?? 0;
    });
    expect(finalVertexCount).toBe(initialVertexCount);
  });
});
