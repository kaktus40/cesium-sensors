import { expect, test } from "@playwright/test";

test.describe("scène minimale — terrain et imagerie", () => {
  test("charge la scène avec globe activé et imagerie OpenStreetMap", async ({
    page,
  }) => {
    await page.goto("/prototype/minimal.html");
    await page.waitForTimeout(4000);

    await expect(page.locator("#status")).toContainText(
      "Imagerie OpenStreetMap + terrain activés",
    );
  });

  test("pas d'erreur de shader WebGL dans la scène minimal avec terrain", async ({
    page,
  }) => {
    const shaderErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /shader|webgl|program/i.test(message.text())) {
        shaderErrors.push(message.text());
      }
    });

    await page.goto("/prototype/minimal.html");
    await page.waitForTimeout(4000);

    const errorCount = await page
      .locator('text="An error occurred while rendering"')
      .count();
    expect(errorCount).toBe(0);
    expect(shaderErrors).toEqual([]);
  });
});
