import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "src/app/(public)/page.tsx",
  "src/app/(public)/booking/page.tsx",
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

console.log("Smoke estático OK: rutas, documentación y endpoints críticos existen.");
