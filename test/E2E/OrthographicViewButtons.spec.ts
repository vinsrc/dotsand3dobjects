import { test, expect, Page } from "@playwright/test";

const AXES = ["+Z", "-Z", "+Y", "-Y", "+X", "-X"] as const;

async function readCameraState(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("[data-testid='viewport-canvas']") as any;
    const strategy = canvas.__appController.getCameraStateService().getActiveStrategy();
    const view = strategy.getViewDirection();
    const up = strategy.getUpDirection();
    return {
      isOrthographic: strategy.isOrthographic(),
      label: strategy.getAxisLabel(),
      view: [view.coordinateX, view.coordinateY, view.coordinateZ],
      up: [up.coordinateX, up.coordinateY, up.coordinateZ],
    };
  });
}

test.describe("Orthographic view buttons below 3D gizmo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='viewport-canvas-container']");
  });

  test("renders six square buttons below the gizmo in +Z,-Z,+Y,-Y,+X,-X order", async ({ page }) => {
    const gizmoBox = await page.getByTestId("3d-axis-gizmo").boundingBox();
    const buttons = page.getByTestId("orthographic-view-buttons").getByRole("button");
    await expect(buttons).toHaveCount(6);
    await expect(buttons).toHaveText([...AXES]);
    for (const axis of AXES) {
      const button = page.getByRole("button", { name: `Orthographic ${axis} View` }).and(
        page.getByTestId(`ortho-view-button-${axis}`)
      );
      await expect(button).toHaveAttribute("title", `Orthographic ${axis} View`);
      const box = await button.boundingBox();
      expect(Math.abs(box!.width - box!.height)).toBeLessThanOrEqual(1);
      expect(box!.y).toBeGreaterThanOrEqual(gizmoBox!.y + gizmoBox!.height);
    }
  });

  for (const axis of AXES) {
    test(`${axis} button matches gizmo ${axis} click exactly`, async ({ page }) => {
      await page.getByTestId(`gizmo-axis-${axis}`).click();
      const gizmoState = await readCameraState(page);
      // Up direction depends on the prior view, so compare from the same fresh state
      await page.reload();
      await page.waitForSelector("[data-testid='viewport-canvas-container']");
      expect((await readCameraState(page)).isOrthographic).toBe(false);
      await page.getByTestId(`ortho-view-button-${axis}`).click();
      const buttonState = await readCameraState(page);
      expect(buttonState).toEqual(gizmoState);
      expect(buttonState.isOrthographic).toBe(true);
    });
  }
});
