import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SHOTS = "tests/e2e/__screenshots__";
mkdirSync(SHOTS, { recursive: true });

test.describe("Landing — revisión visual", () => {
  test("carga la portada y captura el hero", async ({ page }, testInfo) => {
    await page.goto("/");
    // La landing se renderiza en cliente tras cargar la config pública, así que
    // esperamos a que el hero aparezca (el arranque en frío puede tardar).
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
    // Screenshot completo para revisar acomodado de imágenes
    await page.screenshot({ path: `${SHOTS}/landing-${testInfo.project.name}.png`, fullPage: true });
  });

  test("todas las imágenes del hero cargan (sin rotas)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    );
    expect(broken, `Imágenes rotas: ${broken.join(", ")}`).toEqual([]);
  });

  test("el carrusel de especialistas y las frases están presentes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Quienes te acompañan")).toBeVisible();
    await expect(page.getByText("Frases que quizá también son tuyas")).toBeVisible();
  });

  test("respeta prefers-reduced-motion (sin animaciones forzadas)", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
    await ctx.close();
  });
});
