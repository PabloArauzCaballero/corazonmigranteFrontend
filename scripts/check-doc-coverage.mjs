#!/usr/bin/env node
/**
 * Verifica que toda ruta del App Router está documentada en docs/routes/route-catalog.md.
 *
 * INSTRUMENTACIÓN SEGURA: solo lee. No modifica archivos, no toca el bundle ni el
 * build de la aplicación, y no requiere dependencias externas.
 *
 * Uso:
 *   node scripts/check-doc-coverage.mjs
 *
 * Salida: 0 si el 100 % de las rutas aparece en el catálogo; 1 si falta alguna.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "src", "app");
const CATALOG = join(ROOT, "docs", "routes", "route-catalog.md");

/**
 * Deriva la URL de un `page.tsx` a partir de su ruta en disco.
 * - Los grupos `(public)` no aportan segmento.
 * - Los segmentos dinámicos `[slug]` se conservan tal cual: así aparecen en el catálogo.
 */
function toRoute(fileDir) {
  const relative = fileDir.slice(APP.length).split(sep).filter(Boolean);
  const segments = relative.filter((s) => !(s.startsWith("(") && s.endsWith(")")));
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

async function collectPages(dir) {
  const routes = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return routes;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...(await collectPages(full)));
    } else if (entry.name === "page.tsx") {
      routes.push(toRoute(dir));
    }
  }
  return routes;
}

const routes = [...new Set(await collectPages(APP))].sort();

let catalog;
try {
  catalog = await readFile(CATALOG, "utf8");
} catch {
  console.error(`FALLO: no se encontró ${CATALOG}`);
  process.exit(1);
}

/**
 * Una ruta se considera documentada si su patrón aparece en el catálogo. Se busca
 * delimitado por backticks para evitar que `/admin` valide por aparecer dentro de
 * `/admin/usuarios`.
 */
const missing = routes.filter((route) => !catalog.includes(`\`${route}\``));

if (missing.length > 0) {
  console.error("\nRutas sin documentar en docs/routes/route-catalog.md:\n");
  for (const route of missing) console.error(`  ${route}`);
  console.error("");
  console.error(`FALLO: ${routes.length} rutas · ${missing.length} sin documentar`);
  process.exit(1);
}

console.log(`Cobertura de rutas OK: ${routes.length}/${routes.length} documentadas (100 %)`);
process.exit(0);
