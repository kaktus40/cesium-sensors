import { expect, test } from "@playwright/test";

test("loads the 500 satellite benchmark fixture", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#status")).toHaveText("Loaded 500 benchmark entities");
  const entityCount = await page.evaluate(
    () => window.openSensorPrototype.source.entities.values.length,
  );
  expect(entityCount).toBe(500);
});

test("adds and renders the standalone conic sensor primitive", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#status")).toHaveText("Loaded 500 benchmark entities");
  const primitiveCount = await page.evaluate(
    () => window.openSensorPrototype.viewer.scene.primitives.length,
  );
  expect(primitiveCount).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/conic-sensor-prototype.png" });
});

test("compiles the ellipsoid occlusion shader and exposes its runtime switch", async ({ page }) => {
  const shaderErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /shader|webgl|program/i.test(message.text())) {
      shaderErrors.push(message.text());
    }
  });

  await page.goto("/");
  await expect(page.locator("#status")).toHaveText("Loaded 500 benchmark entities");
  await page.waitForTimeout(1000);
  await expect(page.getByText("An error occurred while rendering")).toHaveCount(0);

  const state = await page.evaluate(() => {
    const { viewer, prototypeSensor } = window.openSensorPrototype;
    const uniforms = prototypeSensor.appearance.uniforms;
    const enabled = uniforms.u_ellipsoidOcclusion;
    window.openSensorPrototype.setEllipsoidOcclusion = (value) => {
      window.openSensorPrototype.prototypeSensor.appearance.uniforms.u_ellipsoidOcclusion = value;
      viewer.scene.requestRender();
    };
    return { enabled, primitiveReady: prototypeSensor.ready };
  });

  expect(state.enabled).toBe(true);
  expect(state.primitiveReady).toBe(true);
  await page.evaluate(() => window.openSensorPrototype.setEllipsoidOcclusion(false));
  await page.waitForTimeout(100);
  await expect(page.getByText("An error occurred while rendering")).toHaveCount(0);
  await page.screenshot({ path: "test-results/conic-sensor-no-ellipsoid-occlusion.png" });
  expect(shaderErrors).toEqual([]);
});
