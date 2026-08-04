#!/usr/bin/env node
/**
 * Verifica que los enlaces internos de docs/ apuntan a archivos existentes.
 *
 * INSTRUMENTACIÓN SEGURA: solo lee. No modifica ningún archivo, no toca el bundle
 * ni el build de la aplicación, y no requiere dependencias externas.
 *
 * Uso:
 *   node scripts/check-doc-links.mjs
 *   node scripts/check-doc-links.mjs --quiet    # solo el resumen
 *
 * Salida: 0 si todos los enlaces internos resuelven; 1 si hay alguno roto.
 */
import { readdir, readFile, access } from "node:fs/promises";
import { join, dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = join(ROOT, "docs");
const QUIET = process.argv.includes("--quiet");

/**
 * Extrae los destinos de los enlaces markdown `[texto](destino)`, excluyendo
 * imágenes `![...](...)`.
 *
 * No sirve una expresión regular simple: CommonMark permite PARÉNTESIS BALANCEADOS
 * dentro del destino, y este repositorio los usa constantemente al enlazar el grupo
 * de rutas `src/app/(public)/...`. Un `[^)]+` cortaría el destino en el primer `)`
 * y produciría falsos positivos. Por eso se recorre con un contador de profundidad.
 */
function extractTargets(content) {
  const targets = [];
  const openers = /(!?)\[[^\]]*\]\(/g;

  for (const match of content.matchAll(openers)) {
    if (match[1] === "!") continue; // imagen

    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;

    while (i < content.length && depth > 0) {
      const ch = content[i];
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      else if (ch === "\n") break; // un enlace no abarca varias líneas
      i += 1;
    }
    if (depth !== 0) continue; // enlace mal formado: se ignora

    // Se descarta el título opcional: [texto](destino "título")
    const raw = content.slice(start, i - 1).trim();
    const target = raw.split(/\s+"/)[0].trim();
    if (target) targets.push(target);
  }

  return targets;
}

/** Destinos que no se comprueban: externos, anclas puras y protocolos especiales. */
function isExternal(target) {
  return (
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("mailto:") ||
    target.startsWith("#")
  );
}

async function collectMarkdown(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collectMarkdown(full)));
    } else if (extname(entry.name) === ".md") {
      found.push(full);
    }
  }
  return found;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Un destino puede apuntar a un archivo o a un directorio con README/index.
 * Se acepta cualquiera de las tres formas para no producir falsos positivos.
 */
async function resolves(fromFile, target) {
  // Se descarta el ancla: lo que se verifica es la existencia del archivo.
  const [path] = target.split("#");
  if (!path) return true; // era un ancla pura dentro del mismo documento

  const decoded = decodeURIComponent(path).replace(/\\/g, "");
  const base = resolve(dirname(fromFile), decoded);

  if (await exists(base)) return true;
  if (await exists(`${base}.md`)) return true;
  if (await exists(join(base, "README.md"))) return true;
  if (await exists(join(base, "index.md"))) return true;
  return false;
}

const files = await collectMarkdown(DOCS);
const broken = [];
let checked = 0;

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const target of extractTargets(content)) {
    if (isExternal(target)) continue;
    checked += 1;
    if (!(await resolves(file, target))) {
      broken.push({ file: relative(ROOT, file), target });
    }
  }
}

if (!QUIET && broken.length > 0) {
  console.error("\nEnlaces internos rotos:\n");
  for (const { file, target } of broken) {
    console.error(`  ${file}\n    -> ${target}`);
  }
  console.error("");
}

const summary = `${files.length} documentos · ${checked} enlaces internos · ${broken.length} rotos`;

if (broken.length === 0) {
  console.log(`Enlaces documentales OK: ${summary}`);
  process.exit(0);
}

console.error(`FALLO: ${summary}`);
process.exit(1);
