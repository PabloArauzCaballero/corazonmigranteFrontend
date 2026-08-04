import { expect, test, type Page } from "@playwright/test";

/**
 * Red de seguridad responsiva.
 *
 * Comprueba la propiedad que ninguna pantalla debe romper — ausencia de desplazamiento
 * horizontal accidental — sobre la matriz de anchos acordada, además del cajón de
 * navegación móvil y las áreas táctiles.
 *
 * Se ejecuta en el proyecto `responsive`, que NO emula un dispositivo: con
 * `isMobile: true` Chrome aplica su propia escala de meta-viewport y un
 * `setViewportSize(320)` acaba midiendo ~257 px de maquetación, con lo que la matriz
 * comprobaría anchos distintos de los declarados. Ver `playwright.config.ts`.
 *
 * Uso:
 *   yarn dev                                    # levanta la app
 *   npx playwright test --project=responsive
 */

/** Matriz de la auditoría + anchos intermedios donde el contenido suele romperse. */
const WIDTHS = [
  { label: "movil-muy-pequeno", width: 320, height: 640 },
  { label: "movil-344", width: 344, height: 700 },
  { label: "movil-pequeno", width: 360, height: 740 },
  { label: "movil-estandar", width: 390, height: 844 },
  { label: "movil-412", width: 412, height: 892 },
  { label: "movil-grande", width: 430, height: 932 },
  { label: "600", width: 600, height: 900 },
  { label: "tablet-vertical", width: 768, height: 1024 },
  { label: "834", width: 834, height: 1112 },
  { label: "tablet-horizontal", width: 1024, height: 768 },
  { label: "1152", width: 1152, height: 800 },
  { label: "laptop", width: 1280, height: 800 },
  { label: "escritorio", width: 1440, height: 900 },
  { label: "escritorio-grande", width: 1920, height: 1080 },
  { label: "ultraancha", width: 2560, height: 1440 },
] as const;

/** Rutas alcanzables sin sesión. Las de portal exigen token y quedan fuera. */
const PUBLIC_ROUTES = [
  "/",
  "/biblioteca",
  "/novedades",
  "/cursos",
  "/login",
  "/registro",
  "/privacidad",
  "/terminos",
] as const;

/**
 * Margen de 1 px: los navegadores redondean los anchos subpíxel y una diferencia de
 * exactamente 1 px es ruido de renderizado, no un defecto de maquetación.
 */
const OVERFLOW_TOLERANCE = 1;

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      /* Identifica al culpable concreto: sin esto, un fallo solo dice "hay
         desbordamiento" y hay que buscar el elemento a mano. */
      offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          const style = getComputedStyle(el);
          if (style.visibility === "hidden" || style.display === "none") return false;
          // Los elementos fijos/decorativos se salen del flujo a propósito.
          if (style.position === "fixed") return false;
          return rect.right > doc.clientWidth + 1 || rect.left < -1;
        })
        .slice(0, 5)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 70)} [${Math.round(rect.left)}..${Math.round(rect.right)}]`;
        }),
    };
  });
}

test.describe("Sin desplazamiento horizontal accidental", () => {
  for (const route of PUBLIC_ROUTES) {
    for (const { label, width, height } of WIDTHS) {
      test(`${route} @ ${width}px (${label})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(route, { waitUntil: "domcontentloaded" });
        // Deja asentar fuentes e imágenes: una fuente de reserva más ancha puede
        // producir un falso positivo antes de que cargue la definitiva.
        await page.waitForTimeout(600);

        const result = await horizontalOverflow(page);
        expect(
          result.scrollWidth,
          `Desbordamiento horizontal en ${route} a ${width}px. Elementos implicados:\n${result.offenders.join("\n")}`
        ).toBeLessThanOrEqual(result.clientWidth + OVERFLOW_TOLERANCE);
      });
    }
  }
});

test.describe("Navegación móvil", () => {
  test("el menú público abre, es alcanzable y cierra con Escape", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/biblioteca", { waitUntil: "domcontentloaded" });

    const toggle = page.getByRole("button", { name: /abrir menú/i });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const menu = page.locator("#menu-movil");
    await expect(menu).toBeVisible();

    // Todo enlace del menú debe ser realmente alcanzable, no solo estar pintado.
    const links = menu.getByRole("link");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(links.nth(i)).toBeInViewport({ ratio: 0.01 });
    }

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("abrir el menú no introduce desbordamiento", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const toggle = page.getByRole("button", { name: /abrir menú/i });
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(300);
      const result = await horizontalOverflow(page);
      expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth + OVERFLOW_TOLERANCE);
    }
  });
});

test.describe("Objetivos táctiles", () => {
  test("los controles de la cabecera alcanzan el mínimo cómodo", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const toggle = page.getByRole("button", { name: /abrir menú/i }).first();
    if (await toggle.isVisible().catch(() => false)) {
      const box = await toggle.boundingBox();
      expect(box).not.toBeNull();
      // WCAG 2.2 AA (2.5.8) exige 24×24; el objetivo propio del sistema es 44.
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
    }
  });
});

test.describe("Zoom al 200 %", () => {
  test("la landing no desborda con la mitad de ancho efectivo", async ({ page }) => {
    // Un zoom del 200 % equivale, en cuanto a maquetación, a la mitad del ancho de
    // ventana en píxeles CSS. 1280 → 640 es el caso realista de un portátil.
    await page.setViewportSize({ width: 640, height: 400 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    const result = await horizontalOverflow(page);
    expect(
      result.scrollWidth,
      `Desbordamiento con zoom 200 %. Elementos implicados:\n${result.offenders.join("\n")}`
    ).toBeLessThanOrEqual(result.clientWidth + OVERFLOW_TOLERANCE);
  });
});
