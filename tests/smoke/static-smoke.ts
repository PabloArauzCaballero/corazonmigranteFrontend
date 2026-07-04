import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "src/app/page.tsx",
  "src/features/public-view/public-view.api.ts",
  "src/features/public-view/public-view.normalizer.ts",
  "src/features/public-view/public-landing-page.tsx",
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
  "docs/testing/test-plan.md"
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
if (missing.length > 0) {
  throw new Error(`Archivos requeridos faltantes:\n${missing.join("\n")}`);
}

const pending = readFileSync(join(root, "docs/pending/pending-items.md"), "utf8");
if (!pending.includes("PENDIENTE_CM")) {
  throw new Error("La documentación de pendientes debe usar marca PENDIENTE_CM.");
}

const endpoints = readFileSync(join(root, "src/shared/api/endpoints.ts"), "utf8");
if (endpoints.includes('"api/') || endpoints.includes("'api/")) {
  throw new Error("Hay endpoints sin slash inicial.");
}


const homePage = readFileSync(join(root, "src/app/page.tsx"), "utf8");
if (homePage.includes('"use client"') || homePage.includes("'use client'")) {
  throw new Error("La home pública no puede ser client-only: debe renderizar la landing desde backend en el primer HTML.");
}
if (homePage.includes("useEffect") || homePage.includes("Cargando página principal")) {
  throw new Error("La home pública no debe quedar como pantalla de carga persistente.");
}

const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
if (/output\s*:\s*["']export["']/.test(nextConfig)) {
  throw new Error('output: "export" rompe el render inicial de la landing pública configurable.');
}

const publicViewApi = readFileSync(join(root, "src/features/public-view/public-view.api.ts"), "utf8");
for (const expected of [
  "/api/v1/public-views/:id",
  "/api/v1/public-views/:id/elements/:code",
  "/api/v1/public/pages/by-id/:id",
  "/api/v1/public/pages/:slug",
  "/api/v1/public/pages/:slug/elements/:code",
  "/api/v1/public/page-elements/"
]) {
  if (!publicViewApi.includes(expected)) {
    throw new Error(`Falta endpoint público configurable: ${expected}`);
  }
}

console.log("Smoke estático OK: rutas, documentación y endpoints críticos existen.");
