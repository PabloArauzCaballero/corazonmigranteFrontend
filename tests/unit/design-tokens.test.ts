import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Contrato del sistema de diseño.
 *
 * La regresión más probable al mantener dos temas es añadir un token al bloque
 * claro y olvidarlo en el oscuro: no rompe el build ni el lint, y solo se nota
 * cuando alguien abre esa pantalla en oscuro y ve un color heredado del tema
 * claro. Esta prueba lo detecta sin necesitar un navegador.
 */
const TOKENS_CSS = readFileSync(join(process.cwd(), "src/app/tokens.css"), "utf-8");

function extractBlock(selector: string): string {
  // Los bloques son de un solo nivel (sin anidamiento), así que basta con leer
  // hasta la primera llave de cierre en columna 0.
  const start = TOKENS_CSS.indexOf(`${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = TOKENS_CSS.indexOf("\n}", start);
  expect(end).toBeGreaterThan(start);
  return TOKENS_CSS.slice(start, end);
}

function customProperties(block: string): Set<string> {
  return new Set(Array.from(block.matchAll(/^\s*(--[\w-]+):/gm), (m) => m[1]));
}

const lightBlock = extractBlock(":root");
const darkBlock = extractBlock(".dark");
const light = customProperties(lightBlock);
const dark = customProperties(darkBlock);

/**
 * Tokens que a propósito NO se redefinen en oscuro porque no dependen del tema:
 * geometría, duraciones, curvas y la escala de apilamiento.
 */
const THEME_INDEPENDENT = new Set([
  "--radius",
  "--duration-fast",
  "--duration-base",
  "--duration-slow",
  "--ease-out",
  "--z-sticky",
  "--z-header",
  "--z-overlay",
  "--z-toast",
  "--z-skip-link",
]);

it("el tema claro define tokens", () => {
  expect(light.size).toBeGreaterThan(40);
});

it("todo token de color/elevación del tema claro tiene contrapartida en oscuro", () => {
  const missing = [...light].filter((token) => !THEME_INDEPENDENT.has(token) && !dark.has(token));
  expect(missing).toEqual([]);
});

it("el tema oscuro no inventa tokens que el claro no declare", () => {
  const extra = [...dark].filter((token) => !light.has(token));
  expect(extra).toEqual([]);
});

it("los tokens independientes del tema no se repiten en oscuro", () => {
  const repeated = [...THEME_INDEPENDENT].filter((token) => dark.has(token));
  expect(repeated).toEqual([]);
});

describe("formato de los valores de color", () => {
  // Los tokens de color se declaran como HSL SIN envolver (`38 44% 97%`) para poder
  // componerlos con opacidad desde Tailwind (`bg-primary/10`). Un valor envuelto en
  // `hsl(...)` o un hexadecimal rompe silenciosamente TODAS las clases con opacidad
  // de ese token: el color se aplica, la transparencia no.
  const COLOR_VALUE = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/;
  const NON_COLOR_PREFIXES = ["--radius", "--duration", "--ease", "--z-", "--shadow"];

  it.each([
    [":root", lightBlock],
    [".dark", darkBlock],
  ])("%s declara los colores como HSL sin envolver", (_name, block) => {
    const offenders = Array.from(block.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm))
      .filter(([, token]) => !NON_COLOR_PREFIXES.some((prefix) => token.startsWith(prefix)))
      .filter(([, , value]) => !COLOR_VALUE.test(value.trim()))
      .map(([, token, value]) => `${token}: ${value.trim()}`);
    expect(offenders).toEqual([]);
  });
});

describe("escalas numéricas que alimentan las paletas de Tailwind", () => {
  const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const SCALES = ["brand", "neutral", "positive", "caution", "negative"];

  it.each(SCALES)("la escala %s está completa en ambos temas", (scale) => {
    for (const shade of SHADES) {
      expect(light.has(`--${scale}-${shade}`)).toBe(true);
      expect(dark.has(`--${scale}-${shade}`)).toBe(true);
    }
  });
});

it("no quedan literales hexadecimales en la hoja de tokens", () => {
  // Los hexadecimales del archivo solo pueden aparecer en comentarios, que
  // documentan el color original de cada token.
  const withoutComments = TOKENS_CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  expect(withoutComments.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();
});
