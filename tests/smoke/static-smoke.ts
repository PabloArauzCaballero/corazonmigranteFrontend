import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "src/app/page.tsx",
  "src/features/public-view/public-view.api.ts",
  "src/features/public-view/public-view.normalizer.ts",
  "src/features/public-view/public-landing-page.tsx",
  "src/features/public-view/public-landing-loader.tsx",
  "src/app/(public)/biblioteca/page.tsx",
  "src/app/(public)/booking/page.tsx",
  "src/app/paciente/booking/page.tsx",
  "src/app/admin/booking/page.tsx",
  "src/app/terapeuta/booking/page.tsx",
  "src/app/paciente/page.tsx",
  "src/app/terapeuta/page.tsx",
  "src/app/admin/page.tsx",
  "src/shared/auth/roles.ts",
  "src/shared/auth/session.ts",
  "src/shared/api/endpoints.ts",
  "docs/pending/pending-items.md",
  "docs/architecture/routes.md",
  "docs/api/api-contracts.md",
  "docs/security/auth-rbac.md",
  "docs/testing/test-plan.md",
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
if (missing.length > 0) {
  throw new Error(`Archivos requeridos faltantes:\n${missing.join("\n")}`);
}

const pending = readFileSync(join(root, "docs/pending/pending-items.md"), "utf8");
if (!pending.includes("PENDIENTE_CM")) {
  throw new Error("La documentacion de pendientes debe usar marca PENDIENTE_CM.");
}

const endpoints = readFileSync(join(root, "src/shared/api/endpoints.ts"), "utf8");
if (endpoints.includes('"api/') || endpoints.includes("'api/")) {
  throw new Error("Hay endpoints sin slash inicial.");
}

const homePage = readFileSync(join(root, "src/app/page.tsx"), "utf8");
if (!homePage.includes("PublicLandingLoader")) {
  throw new Error("La home publica debe montar PublicLandingLoader para Cloudflare Pages estatico.");
}

const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
if (!/output\s*:\s*["']export["']/.test(nextConfig)) {
  throw new Error('Cloudflare Pages requiere output: "export" para generar out.');
}

const publicViewApi = readFileSync(join(root, "src/features/public-view/public-view.api.ts"), "utf8");
if (!publicViewApi.includes("/api/v1/public/pages/:slug")) {
  throw new Error("Falta endpoint publico real: /api/v1/public/pages/:slug");
}
if (publicViewApi.includes('candidates.push({ label: "public-page-element"') || publicViewApi.includes('absoluteUrl(resolveTemplate("/api/v1/public/pages/:slug/elements/')) {
  throw new Error("No se debe llamar directamente /public/pages/:slug/elements/:code porque el backend actual no expone esa ruta.");
}

console.log("Smoke estatico OK: rutas, documentacion y endpoints criticos existen.");
