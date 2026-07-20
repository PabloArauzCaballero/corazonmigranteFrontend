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
  "src/app/admin/publicidad/page.tsx",
  "src/app/admin/archivos/page.tsx",
  "src/app/admin/contenido/publico/page.tsx",
  "src/app/admin/contenido/paginas/page.tsx",
  "src/app/paciente/premium/page.tsx",
  "src/app/(public)/[slug]/page.tsx",
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


const filesApi = readFileSync(join(root, "src/shared/api/files.ts"), "utf8");
if (!filesApi.includes("cloudinary/signature") && !endpoints.includes("cloudinarySignature")) {
  throw new Error("Falta flujo de subida directa firmada a Cloudinary.");
}
if (!filesApi.includes("uploadDirectlyToCloudinary") || !filesApi.includes("completeCloudinaryUpload")) {
  throw new Error("El frontend debe subir directo a Cloudinary y luego completar registro en backend.");
}
if (!filesApi.includes("adminCloudinarySignature") || !filesApi.includes("adminCloudinaryComplete")) {
  throw new Error("El flujo administrativo debe usar los alias /admin/files/cloudinary/* para banners y logos.");
}


const sidebar = readFileSync(join(root, "src/features/dashboard/sidebar.tsx"), "utf8");
for (const label of ["Publicidad", "Archivos", "Contenido Público", "Páginas públicas", "Publicaciones", "Categorias", "Tags", "Autores"]) {
  if (!sidebar.includes(label)) {
    throw new Error(`Sidebar admin incompleto: falta ${label}.`);
  }
}
if (sidebar.includes("CMS") || sidebar.includes("Biblioteca CMS")) {
  throw new Error("No se debe exponer CMS como módulo visual en el sidebar.");
}

const advertisingAdmin = readFileSync(join(root, "src/features/newsroom/newsroom-admin.tsx"), "utf8");
if (!advertisingAdmin.includes("Publicación relacionada")) {
  throw new Error("El formulario de anuncio debe permitir asociar una publicación específica.");
}
if (!advertisingAdmin.includes("Página pública relacionada")) {
  throw new Error("El formulario de anuncio debe permitir asociar una página pública específica.");
}
if (advertisingAdmin.includes('entityId: fstr(form, "commercialName")')) {
  throw new Error("El logo de empresa no debe subirse con entityId textual; debe usarse el UUID de la empresa creada.");
}
if (!advertisingAdmin.includes("entityId: company.id")) {
  throw new Error("El logo de empresa debe subirse después de crear la empresa y vincularse por UUID.");
}
if (!advertisingAdmin.includes("fileId: uploadedFileId")) {
  throw new Error("El creativo publicitario debe enviar fileId al backend luego de subir el banner.");
}
if (!advertisingAdmin.includes("pageSlug: pageSlug || undefined")) {
  throw new Error("El creativo publicitario debe enviar pageSlug al backend cuando se asocia a una página pública.");
}

const newsroomApi = readFileSync(join(root, "src/features/newsroom/newsroom.api.ts"), "utf8");
if (!newsroomApi.includes("/admin/advertising/ads")) {
  throw new Error("Falta endpoint frontend para crear anuncios administrativos.");
}
if (!newsroomApi.includes("updateCompany") || !newsroomApi.includes("pageSlugs")) {
  throw new Error("Faltan contratos frontend para actualizar logo de empresa o asociar campañas a páginas públicas.");
}

console.log("Smoke estatico OK: rutas, documentacion y endpoints criticos existen.");
