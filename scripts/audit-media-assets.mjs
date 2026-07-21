#!/usr/bin/env node
/**
 * Auditoría de recursos visuales de la landing / contenido público.
 *
 * Detecta:
 *  - URLs de imagen vacías o nulas.
 *  - URLs malformadas.
 *  - Referencias a archivos locales inexistentes en /public.
 *  - (Opcional, con --net) recursos remotos inaccesibles (HEAD).
 *
 * Uso:
 *   node scripts/audit-media-assets.mjs           # revisión estática
 *   node scripts/audit-media-assets.mjs --net     # además comprueba HEAD remoto
 *
 * Sale con código 1 si encuentra problemas bloqueantes (URLs vacías/malformadas
 * o archivos locales faltantes), para poder usarse en CI.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");
const PUBLIC = join(ROOT, "public");

const IMG_EXT = /\.(webp|jpe?g|png|avif|gif|svg)$/i;
const net = process.argv.includes("--net");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(name)) continue;
      walk(full, acc);
    } else if (/\.(tsx?|jsx?|json|css)$/.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

// Extrae posibles URLs/paths de imagen de un archivo de texto.
function extractImageRefs(content) {
  const refs = new Set();
  // src="..." | src={'...'} | "/landing/x.webp" | https://.../x.jpg
  const re = /["'`](\/[^"'`]+?\.(?:webp|jpe?g|png|avif|gif|svg)|https?:\/\/[^"'`]+?\.(?:webp|jpe?g|png|avif|gif|svg))["'`]/gi;
  let m;
  while ((m = re.exec(content))) refs.add(m[1]);
  return [...refs];
}

const problems = { empty: [], malformed: [], missingLocal: [], remoteUnreachable: [] };
const remoteToCheck = new Set();

// 1) Detecta src vacío explícito en JSX/props.
for (const file of walk(SRC)) {
  const content = readFileSync(file, "utf8");
  const rel = file.replace(ROOT + "/", "");

  if (/\bsrc=\{?["'`]\s*["'`]\}?/.test(content) || /\bsrc=\{(?:""|''|``|null|undefined)\}/.test(content)) {
    problems.empty.push(rel);
  }

  for (const ref of extractImageRefs(content)) {
    if (ref.startsWith("/")) {
      // archivo local en /public
      const localPath = join(PUBLIC, ref);
      if (!existsSync(localPath)) problems.missingLocal.push(`${rel} -> ${ref}`);
    } else {
      try {
        // eslint-disable-next-line no-new
        new URL(ref);
        if (net) remoteToCheck.add(ref);
      } catch {
        problems.malformed.push(`${rel} -> ${ref}`);
      }
    }
  }
}

// 2) Comprobación remota opcional (HEAD).
if (net && remoteToCheck.size) {
  await Promise.all(
    [...remoteToCheck].map(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (!res.ok) problems.remoteUnreachable.push(`${url} (HTTP ${res.status})`);
      } catch (e) {
        problems.remoteUnreachable.push(`${url} (${e.message})`);
      }
    }),
  );
}

// 3) Reporte
function section(title, list) {
  console.log(`\n${title}: ${list.length}`);
  for (const item of list.slice(0, 50)) console.log("  - " + item);
  if (list.length > 50) console.log(`  … y ${list.length - 50} más`);
}

console.log("== Auditoría de recursos visuales ==");
section("src con `src` vacío", problems.empty);
section("URLs malformadas", problems.malformed);
section("Archivos locales faltantes en /public", problems.missingLocal);
if (net) section("Recursos remotos inaccesibles", problems.remoteUnreachable);

const blocking =
  problems.empty.length + problems.malformed.length + problems.missingLocal.length;
console.log(`\nProblemas bloqueantes: ${blocking}`);
process.exit(blocking > 0 ? 1 : 0);
