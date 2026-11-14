import { expect, test } from "@playwright/test";

test.describe("scène minimale — occlusion ellipsoïde", () => {
  test("affiche le cône avec ellipsoidOcclusion désactivé (capture)", async ({
    page,
  }) => {
    await page.goto("/prototype/minimal.html");
    await page.waitForTimeout(1000);

    // Cône visible (occlusion OFF par défaut via le bouton ou l'état initial)
    await page.click("#btn-occlusion-off");
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/minimal-occlusion-off.png" });

    const primitiveCount = await page.evaluate(
      () => window.openSensorMinimal.viewer.scene.primitives.length,
    );
    expect(primitiveCount).toBeGreaterThan(0);
  });

  test("affiche le cône avec ellipsoidOcclusion activé (capture)", async ({
    page,
  }) => {
    await page.goto("/prototype/minimal.html");
    await page.waitForTimeout(1000);

    await page.click("#btn-occlusion-on");
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/minimal-occlusion-on.png" });

    const uniforms = await page.evaluate(() => {
      const { sensor } = window.openSensorMinimal;
      return sensor.primitive.appearance.uniforms.u_ellipsoidOcclusion;
    });
    expect(uniforms).toBe(true);
  });

  test("pas d'erreur de shader WebGL dans la scène minimale", async ({ page }) => {
    const shaderErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /shader|webgl|program/i.test(message.text())) {
        shaderErrors.push(message.text());
      }
    });

    await page.goto("/prototype/minimal.html");
    await page.waitForTimeout(2000);

    const errorCount = await page
      .locator('text="An error occurred while rendering"')
      .count();
    expect(errorCount).toBe(0);
    expect(shaderErrors).toEqual([]);
  });
});
