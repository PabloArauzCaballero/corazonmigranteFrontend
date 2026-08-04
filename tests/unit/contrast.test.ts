import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Contraste WCAG 2.2 AA sobre los tokens, en los DOS temas.
 *
 * Cierra `PENDIENTE_CM_CONTRASTE_OSCURO`. Comprueba la relación real entre cada
 * par texto/fondo que el sistema de diseño promete, no una muestra de pantallas:
 * si un token cambia de luminosidad, el fallo aparece aquí y no semanas después
 * en una auditoría manual.
 *
 * Umbrales:
 *  - 4,5:1 para texto normal (WCAG 1.4.3)
 *  - 3:1 para componentes de interfaz y su indicador de foco (WCAG 1.4.11)
 *
 * NO se exige 3:1 a los bordes decorativos (`--line`, `--line-strong`). 1.4.11
 * aplica a los límites que son *el único* medio de identificar un control; aquí
 * cada borde acompaña a una superficie rellena y a su texto, así que subirlos a
 * 3:1 endurecería el diseño sin ganar información para nadie.
 */
const TOKENS_CSS = readFileSync(join(process.cwd(), "src/app/tokens.css"), "utf-8");

function themeTokens(selector: string): Record<string, string> {
  const start = TOKENS_CSS.indexOf(`${selector} {`);
  const end = TOKENS_CSS.indexOf("\n}", start);
  const block = TOKENS_CSS.slice(start, end);
  return Object.fromEntries(
    Array.from(block.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm), (m) => [m[1], m[2].trim()]),
  );
}

const LIGHT = themeTokens(":root");
const DARK = themeTokens(".dark");

function hslToRgb(value: string): [number, number, number] {
  const parsed = /^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(value);
  if (!parsed) throw new Error(`Valor HSL no reconocido: "${value}"`);
  const h = Number(parsed[1]);
  const s = Number(parsed[2]) / 100;
  const l = Number(parsed[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const sextant = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sextant];
  return [r + m, g + m, b + m];
}

/** Luminancia relativa según la definición de WCAG. */
function luminance(value: string): number {
  const channel = (u: number) => (u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = hslToRgb(value);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(tokens: Record<string, string>, a: string, b: string): number {
  const la = luminance(tokens[a]);
  const lb = luminance(tokens[b]);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** [texto, fondo, umbral, descripción] */
const PAIRS: Array<[string, string, number, string]> = [
  ["--foreground", "--background", 4.5, "texto principal sobre la página"],
  ["--foreground", "--card", 4.5, "texto principal sobre tarjeta"],
  ["--foreground", "--surface-raised", 4.5, "texto principal sobre panel"],
  ["--foreground", "--surface-sunken", 4.5, "texto principal sobre zona hundida"],
  ["--foreground", "--surface-accent", 4.5, "texto principal sobre realce"],
  ["--ink-soft", "--background", 4.5, "tinta suave sobre la página"],
  ["--ink-soft", "--card", 4.5, "tinta suave sobre tarjeta"],
  ["--ink-muted", "--background", 4.5, "texto secundario sobre la página"],
  ["--ink-muted", "--card", 4.5, "texto secundario sobre tarjeta"],
  ["--ink-muted", "--surface-sunken", 4.5, "texto secundario sobre zona hundida"],
  ["--ink-subtle", "--background", 4.5, "texto terciario sobre la página"],
  ["--ink-subtle", "--card", 4.5, "texto terciario sobre tarjeta"],
  ["--muted-foreground", "--muted", 4.5, "texto atenuado sobre fondo atenuado"],
  ["--primary-foreground", "--primary", 4.5, "texto del botón primario"],
  ["--secondary-foreground", "--secondary", 4.5, "texto del botón secundario"],
  ["--accent-foreground", "--accent", 4.5, "texto sobre acento"],
  ["--destructive-foreground", "--destructive", 4.5, "texto del botón destructivo"],
  ["--success", "--success-surface", 4.5, "éxito sobre su superficie"],
  ["--warning", "--warning-surface", 4.5, "aviso sobre su superficie"],
  ["--info", "--info-surface", 4.5, "información sobre su superficie"],
  ["--destructive", "--destructive-surface", 4.5, "error sobre su superficie"],
  ["--success-foreground", "--success", 4.5, "texto sobre éxito sólido"],
  ["--warning-foreground", "--warning", 4.5, "texto sobre aviso sólido"],
  ["--info-foreground", "--info", 4.5, "texto sobre información sólida"],
  ["--surface-inverse-foreground", "--surface-inverse", 4.5, "texto sobre sección oscura"],
  ["--surface-inverse-foreground", "--surface-inverse-deep", 4.5, "texto sobre el degradado"],
  // Componentes de interfaz e indicador de foco: 3:1 (WCAG 1.4.11 y 2.4.11).
  ["--ring", "--background", 3, "anillo de foco sobre la página"],
  ["--ring", "--card", 3, "anillo de foco sobre tarjeta"],
  ["--primary", "--background", 3, "primario como elemento de interfaz"],
  ["--primary", "--card", 3, "primario como elemento sobre tarjeta"],
  ["--brand-terracotta", "--background", 3, "acento terracota"],
  ["--brand-plum", "--background", 3, "acento ciruela"],
  ["--brand-clay", "--background", 3, "acento arcilla"],
];

describe.each([
  ["claro", LIGHT],
  ["oscuro", DARK],
])("tema %s", (_theme, tokens) => {
  it.each(PAIRS)("%s sobre %s cumple %s:1 — %s", (fg, bg, threshold, _label) => {
    expect(tokens[fg]).toBeDefined();
    expect(tokens[bg]).toBeDefined();
    // `toBeCloseTo` no sirve aquí: interesa el mínimo, no la igualdad.
    expect(Number(contrast(tokens, fg, bg).toFixed(2))).toBeGreaterThanOrEqual(threshold);
  });
});

it("el conversor HSL→RGB coincide con valores conocidos", () => {
  // Anclas de control: si el conversor se rompiera, todas las comprobaciones de
  // arriba pasarían a medir ruido en vez de contraste.
  expect(luminance("0 0% 100%")).toBeCloseTo(1, 5);
  expect(luminance("0 0% 0%")).toBeCloseTo(0, 5);
  // Blanco sobre negro es el máximo teórico de la escala WCAG.
  const bw = { a: "0 0% 100%", b: "0 0% 0%" };
  expect(contrast(bw, "a", "b")).toBeCloseTo(21, 1);
});
