#!/usr/bin/env node
/**
 * Sube las imágenes de public/landing a Cloudinary y muestra las URLs finales.
 *
 * Uso (desde la raíz del frontend, donde SÍ hay salida a internet):
 *   node scripts/upload-landing-cloudinary.mjs
 *
 * Lee las credenciales desde variables de entorno o desde el .env del backend:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * No requiere dependencias externas: firma la petición con el crypto nativo
 * de Node y sube vía fetch (Node >= 18).
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LANDING_DIR = join(ROOT, "public", "landing");
const FOLDER = "corazon-migrante/landing_page/media";

function loadEnv() {
  const out = {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  };
  if (out.cloud && out.key && out.secret) return out;
  // fallback: buscar el .env del backend hermano
  const candidates = [
    join(ROOT, ".env"),
    join(ROOT, "..", "backend", ".env"),
  ];
  for (const p of candidates) {
    try {
      const txt = readFileSync(p, "utf8");
      for (const line of txt.split("\n")) {
        const m = line.match(/^(CLOUDINARY_[A-Z_]+)=(.*)$/);
        if (!m) continue;
        const v = m[2].trim().replace(/^["']|["']$/g, "");
        if (m[1] === "CLOUDINARY_CLOUD_NAME") out.cloud ||= v;
        if (m[1] === "CLOUDINARY_API_KEY") out.key ||= v;
        if (m[1] === "CLOUDINARY_API_SECRET") out.secret ||= v;
      }
    } catch {}
  }
  return out;
}

async function uploadOne(file, cfg) {
  const publicId = basename(file, extname(file)); // p.ej. "carrusel-1"
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: FOLDER, public_id: publicId, overwrite: "true", timestamp: String(timestamp) };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const signature = createHash("sha1").update(toSign + cfg.secret).digest("hex");

  const form = new FormData();
  const buf = readFileSync(join(LANDING_DIR, file));
  form.append("file", new Blob([buf]), file);
  form.append("api_key", cfg.key);
  form.append("timestamp", String(timestamp));
  form.append("folder", FOLDER);
  form.append("public_id", publicId);
  form.append("overwrite", "true");
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || res.statusText);
  return json.secure_url;
}

async function main() {
  const cfg = loadEnv();
  if (!cfg.cloud || !cfg.key || !cfg.secret) {
    console.error("Faltan credenciales CLOUDINARY_*. Definilas como variables de entorno o en backend/.env");
    process.exit(1);
  }
  console.log("Cloud:", cfg.cloud, "\nSubiendo desde:", LANDING_DIR, "\n");
  const files = readdirSync(LANDING_DIR).filter((f) => /\.(webp|jpg|jpeg|png|avif)$/i.test(f));
  const urls = {};
  for (const f of files) {
    try {
      urls[basename(f, extname(f))] = await uploadOne(f, cfg);
      console.log("OK  ", f);
    } catch (e) {
      console.error("FALLÓ", f, "-", e.message);
    }
  }
  console.log("\n=== URLs finales ===");
  console.log(JSON.stringify(urls, null, 2));
}

main();
