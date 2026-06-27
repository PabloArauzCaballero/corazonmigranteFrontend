import { expect, test } from "@playwright/test";

test("home pública carga", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /acompañamiento emocional/i })).toBeVisible();
});
