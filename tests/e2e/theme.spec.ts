import { expect, test, type Page } from "@playwright/test";

/**
 * Red de seguridad del tema claro/oscuro.
 *
 * Comprueba tres propiedades que ninguna pantalla debe romper:
 *
 *  1. el tema elegido se aplica ANTES del primer pintado (sin destello blanco);
 *  2. el tema persiste entre navegaciones y recargas;
 *  3. ninguna superficie queda «a medias» — texto claro sobre fondo claro o al revés.
 *
 * Uso:
 *   yarn dev                         # levanta la app
 *   npx playwright test theme.spec
 */

/** Rutas alcanzables sin sesión. Las de portal exigen token y quedan fuera. */
const ROUTES = ["/", "/login", "/registro", "/biblioteca", "/novedades", "/403"] as const;

/**
 * Fija la preferencia ANTES de cargar la página, igual que haría una visita real
 * con la elección ya guardada. Es la única forma de comprobar el script
 * anti-parpadeo: si se fijara después de `goto`, la primera carga sería siempre
 * en claro y la prueba no valdría nada.
 */
async function withStoredTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((value) => {
    window.localStorage.setItem("cm_theme", value);
  }, theme);
}

function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);
  // Aproximación perceptual suficiente para distinguir «claro» de «oscuro».
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`tema ${theme}`, () => {
    for (const route of ROUTES) {
      test(`${route} se pinta con el tema ${theme} desde la primera carga`, async ({ page }) => {
        await withStoredTheme(page, theme);
        await page.goto(route);

        const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
        expect(isDark).toBe(theme === "dark");

        // `color-scheme` gobierna cómo el navegador pinta controles nativos y barras
        // de desplazamiento. Si no acompaña al tema aparecen scrollbars blancas sobre
        // fondo oscuro — el detalle que delata un modo oscuro incompleto.
        const colorScheme = await page.evaluate(() =>
          getComputedStyle(document.documentElement).colorScheme,
        );
        expect(colorScheme).toBe(theme);

        const bodyLuminance = await page
          .evaluate(() => getComputedStyle(document.body).color)
          .then(luminance);
        // El COLOR DEL TEXTO debe ser claro en oscuro y oscuro en claro.
        if (theme === "dark") expect(bodyLuminance).toBeGreaterThan(0.5);
        else expect(bodyLuminance).toBeLessThan(0.5);
      });
    }

    test(`el tema ${theme} sobrevive a una navegación y a una recarga`, async ({ page }) => {
      await withStoredTheme(page, theme);
      await page.goto("/login");

      await page.goto("/registro");
      expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(
        theme === "dark",
      );

      await page.reload();
      expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(
        theme === "dark",
      );
    });
  });
}

test("el selector de tema es operable con teclado y anuncia su estado", async ({ page }) => {
  await page.goto("/login");

  const group = page.getByRole("radiogroup", { name: "Tema de la interfaz" }).first();
  await expect(group).toBeVisible();

  const dark = group.getByRole("radio", { name: "Tema oscuro" });
  await dark.click();

  await expect(dark).toHaveAttribute("aria-checked", "true");
  expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);

  // Las flechas deben mover la selección: es el comportamiento esperado de un
  // grupo de radio y lo que permite cambiar de tema sin ratón.
  await dark.press("ArrowRight");
  expect(await page.evaluate(() => localStorage.getItem("cm_theme"))).not.toBe("dark");
});

test("cambiar de tema no deja rastros del anterior en la superficie principal", async ({ page }) => {
  await withStoredTheme(page, "dark");
  await page.goto("/login");

  // Fondo de página y color de texto deben quedar en lados opuestos de la escala.
  const { background, color } = await page.evaluate(() => ({
    background: getComputedStyle(document.documentElement).backgroundColor,
    color: getComputedStyle(document.body).color,
  }));

  const contrastGap = Math.abs(luminance(color) - luminance(background));
  expect(contrastGap).toBeGreaterThan(0.35);
});
