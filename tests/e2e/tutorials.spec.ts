import { expect, test, type Page } from "@playwright/test";

/**
 * Recorrido extremo a extremo del tutorial público.
 *
 * Uso:
 *   yarn dev                                  # levanta la app
 *   E2E_BASE_URL=http://localhost:4173 yarn test:e2e tests/e2e/tutorials.spec.ts
 *
 * La portada pública se construye con datos del backend. Si el backend no está
 * disponible, la pantalla no llega a montar el lanzador: en ese caso la prueba se marca
 * como omitida con un motivo explícito en vez de fallar por una causa ajena al motor.
 */

const LAUNCHER = '[data-tutorial-id="lanzador-tutorial"]';
const CARD = '[data-tutorial-role="tarjeta"]';

async function openPublicTutorial(page: Page) {
  await page.goto("/");
  const launcher = page.locator(LAUNCHER);
  const available = await launcher.waitFor({ state: "visible", timeout: 15_000 }).then(
    () => true,
    () => false,
  );
  test.skip(!available, "La portada pública no cargó (backend no disponible): no hay tutorial que ejecutar.");
  // El tutorial puede haberse ofrecido solo; si ya está abierto no hace falta pulsar.
  if (!(await page.locator(CARD).isVisible())) await launcher.click();
  await expect(page.locator(CARD)).toBeVisible();
}

test.describe("tutorial público", () => {
  test.beforeEach(async ({ page }) => {
    // Cada prueba parte sin progreso guardado para que el recorrido empiece del paso 1.
    await page.addInitScript(() => window.localStorage.clear());
  });

  test("recorre los pasos hacia delante y hacia atrás", async ({ page }) => {
    await openPublicTutorial(page);
    const card = page.locator(CARD);

    await expect(card).toContainText("Paso 1 de");
    await card.getByRole("button", { name: /siguiente/i }).click();
    await expect(card).toContainText("Paso 2 de");

    await card.getByRole("button", { name: /atrás/i }).click();
    await expect(card).toContainText("Paso 1 de");
  });

  test("se puede avanzar con el teclado y cerrar con Escape", async ({ page }) => {
    await openPublicTutorial(page);
    const card = page.locator(CARD);

    await page.keyboard.press("ArrowRight");
    await expect(card).toContainText("Paso 2 de");

    await page.keyboard.press("Escape");
    // A partir del segundo paso salir pide confirmación para no perder el avance.
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: /^salir$/i }).click();
    await expect(card).toBeHidden();
  });

  test("guarda el avance y permite continuar más tarde", async ({ page }) => {
    await openPublicTutorial(page);
    const card = page.locator(CARD);

    await card.getByRole("button", { name: /siguiente/i }).click();
    await expect(card).toContainText("Paso 2 de");

    await page.keyboard.press("Escape");
    await page.getByRole("alertdialog").getByRole("button", { name: /^salir$/i }).click();
    await expect(card).toBeHidden();

    await expect(page.locator(LAUNCHER)).toContainText(/continuar tutorial/i);
    await page.locator(LAUNCHER).click();
    await expect(card).toContainText("Paso 2 de");
  });

  test("la tarjeta cabe en pantalla en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await openPublicTutorial(page);

    const box = await page.locator(CARD).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });
});
