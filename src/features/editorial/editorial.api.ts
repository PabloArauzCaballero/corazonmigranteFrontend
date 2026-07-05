import { fileServer, buildPublicAssetUrl } from "@/config/file-server";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { buildFileDownloadUrl } from "@/shared/api/files";
import { getNumber, getString, isRecord } from "@/shared/api/normalizers";
import type {
  CmsElement,
  CmsElementStatus,
  CmsFileAsset,
  CmsPage,
  CmsPageStatus,
  CreateCmsElementInput,
  CreateCmsPageInput,
  EditorialHero,
  EditorialResource
} from "@/features/editorial/editorial.types";

function replacePathParam(path: string, param: string, value: string) {
  return path.replace(`:${param}`, encodeURIComponent(value));
}

function upperStatus(value: unknown, fallback: string) {
  return String(value ?? fallback).trim().toUpperCase();
}

function unwrap(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  for (const key of ["data", "page", "pagina", "result", "item"]) {
    const value = payload[key];
    if (isRecord(value)) return value;
  }
  return payload;
}

function normalizeContent(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function normalizeBodyBlocks(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function getContentString(content: Record<string, unknown>, keys: string[], fallback = "") {
  return getString(content, keys, fallback);
}

function getNestedImageRecord(content: Record<string, unknown>) {
  for (const key of ["image", "imagen", "cover", "portada", "picture"]) {
    const value = content[key];
    if (isRecord(value)) return value;
  }
  return undefined;
}

function resolveImageUrl(content: Record<string, unknown>, fileId?: string, fallback?: string) {
  const direct = getContentString(content, ["imageUrl", "image_url", "imagen", "urlImagen", "coverImageUrl", "cover_url", "mediaUrl", "url", "link"], "");
  if (direct) return direct;

  const nestedImage = getNestedImageRecord(content);
  if (nestedImage) {
    const nestedDirect = getContentString(nestedImage, ["src", "url", "imageUrl", "image_url"], "");
    if (nestedDirect) return nestedDirect;
    const nestedObjectKey = getContentString(nestedImage, ["objectKey", "object_key"], "");
    const nestedPublicUrl = buildPublicAssetUrl(nestedObjectKey);
    if (nestedPublicUrl) return nestedPublicUrl;
  }

  const objectKey = getContentString(content, ["objectKey", "object_key", "fileObjectKey", "archivoObjectKey"], "");
  const publicUrl = buildPublicAssetUrl(objectKey);
  if (publicUrl) return publicUrl;

  const fileUrl = buildFileDownloadUrl(fileId);
  if (fileUrl) return fileUrl;

  return fallback;
}

export function mapCmsElement(item: unknown, index: number): CmsElement {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "elementId", "element_id", "uuid"], `cms-element-${index + 1}`),
    pageId: getString(record, ["pageId", "page_id"], "") || undefined,
    code: getString(record, ["code", "codigo", "key"], `element-${index + 1}`),
    type: getString(record, ["type", "tipo"], "SECTION").toUpperCase(),
    content: normalizeContent(record.content ?? record.contenido ?? record.payload),
    fileId: getString(record, ["fileId", "file_id", "archivoId"], "") || undefined,
    sortOrder: getNumber(record, ["sortOrder", "sort_order", "orden"], index),
    status: upperStatus(record.status ?? record.estado, "ACTIVE") as CmsElementStatus
  };
}

export function mapCmsPage(payload: unknown): CmsPage {
  const record = isRecord(unwrap(payload)) ? (unwrap(payload) as Record<string, unknown>) : {};
  const rawElements = record.elements ?? record.elementos ?? [];
  const elements = Array.isArray(rawElements) ? rawElements.map(mapCmsElement).sort((a, b) => a.sortOrder - b.sortOrder) : [];

  return {
    id: getString(record, ["id", "pageId", "page_id", "uuid"], ""),
    slug: getString(record, ["slug", "path"], ""),
    title: getString(record, ["title", "titulo", "name", "nombre"], "Página CMS"),
    status: upperStatus(record.status ?? record.estado, "DRAFT") as CmsPageStatus,
    seoMetadata: normalizeContent(record.seoMetadata ?? record.seo_metadata),
    publishedAt: getString(record, ["publishedAt", "published_at"], "") || undefined,
    elements,
    raw: payload
  };
}

export function mapResourceFromElement(element: CmsElement, index: number): EditorialResource {
  const content = element.content;
  const title = getContentString(content, ["title", "titulo", "name", "nombre"], `Recurso ${index + 1}`);
  const slug = getContentString(content, ["slug", "path", "urlSlug"], element.code || element.id);
  const body = normalizeBodyBlocks(content.bodyBlocks ?? content.blocks ?? content.body ?? content.contenido ?? content.text ?? content.texto);

  return {
    id: element.id,
    slug,
    title,
    eyebrow: getContentString(content, ["eyebrow", "kicker", "antetitulo"], "Biblioteca"),
    summary: getContentString(content, ["summary", "resumen", "excerpt", "descripcion", "description"], ""),
    category: getContentString(content, ["category", "categoria", "section", "seccion"], "Acompañamiento"),
    imageUrl: resolveImageUrl(content, element.fileId, fileServer.editorialFallbackImageUrl),
    imageAlt: getContentString(content, ["imageAlt", "alt", "imagenAlt"], title),
    readTimeLabel: getContentString(content, ["readTimeLabel", "tiempoLectura", "readingTime"], body.length > 0 ? `${Math.max(2, body.length * 2)} min` : "Lectura breve"),
    authorLabel: getContentString(content, ["author", "autor", "authorLabel"], "Equipo Corazón Migrante"),
    publishedAt: getContentString(content, ["publishedAt", "published_at", "fecha"], "") || undefined,
    bodyBlocks: body,
    ctaLabel: getContentString(content, ["ctaLabel", "boton", "buttonLabel"], "") || undefined,
    ctaHref: getContentString(content, ["ctaHref", "href", "linkCta"], "") || undefined,
    sourceElement: element
  };
}

export function getHeroFromPage(page: CmsPage): EditorialHero {
  const heroElement = page.elements.find((element) => element.type === "HERO" || element.code.toLowerCase().includes("hero"));
  const content = heroElement?.content ?? {};
  return {
    eyebrow: getContentString(content, ["eyebrow", "kicker", "antetitulo"], "Biblioteca emocional"),
    title: getContentString(content, ["title", "titulo"], page.title || "Recursos para acompañar procesos migrantes con humanidad."),
    subtitle: getContentString(
      content,
      ["subtitle", "subtitulo", "description", "descripcion"],
      "Guías, lecturas y orientación psicoeducativa preparadas por Corazón Migrante."
    ),
    imageUrl: resolveImageUrl(content, heroElement?.fileId, fileServer.editorialHeroImageUrl),
    imageAlt: getContentString(content, ["imageAlt", "alt", "imagenAlt"], page.title || "Corazón Migrante"),
    ctaLabel: getContentString(content, ["ctaLabel", "buttonLabel"], "Agendar desde mi portal"),
    ctaHref: getContentString(content, ["ctaHref", "href"], "/booking")
  };
}

export function getResourcesFromPage(page: CmsPage) {
  return page.elements
    .filter((element) => element.status === "ACTIVE")
    .filter((element) => !["HERO", "CTA", "QUOTE"].includes(element.type))
    .map(mapResourceFromElement);
}

function publicCmsPageFallbacks(slug: string) {
  const normalizedSlug = slug.trim() || "biblioteca";
  return [replacePathParam(ENDPOINTS.cms.publicPage, "slug", normalizedSlug)];
}

export async function getPublicCmsPage(slug: string): Promise<CmsPage> {
  const paths = publicCmsPageFallbacks(slug);
  let lastError: unknown;

  for (const path of paths) {
    try {
      const payload = await apiRequest<unknown>(path, { auth: false });
      return mapCmsPage(payload);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`No se pudo cargar la página pública ${slug}.`);
}

export async function createCmsPage(input: CreateCmsPageInput): Promise<CmsPage> {
  const payload = await apiRequest<unknown>(ENDPOINTS.cms.adminCreatePage, {
    method: "POST",
    body: input
  });
  return mapCmsPage(payload);
}

export async function addCmsElement(pageId: string, input: CreateCmsElementInput): Promise<CmsElement> {
  const payload = await apiRequest<unknown>(replacePathParam(ENDPOINTS.cms.adminAddElement, "pageId", pageId), {
    method: "POST",
    body: input
  });
  return mapCmsElement(unwrap(payload), 0);
}

export async function uploadCmsFile(file: File, entityId?: string): Promise<CmsFileAsset> {
  const form = new FormData();
  form.append("file", file);
  form.append("module", "CMS");
  form.append("visibility", "PUBLIC");
  if (entityId) form.append("entityId", entityId);
  form.append("entityType", "CmsElement");

  const payload = await apiRequest<unknown>(ENDPOINTS.files.upload, {
    method: "POST",
    body: form
  });
  const record = isRecord(unwrap(payload)) ? (unwrap(payload) as Record<string, unknown>) : {};
  const objectKey = getString(record, ["objectKey", "object_key"], "");
  return {
    id: getString(record, ["id", "fileId", "file_id"], ""),
    module: getString(record, ["module", "modulo"], "CMS"),
    entityType: getString(record, ["entityType", "entity_type"], "") || undefined,
    entityId: getString(record, ["entityId", "entity_id"], "") || undefined,
    storageProvider: getString(record, ["storageProvider", "storage_provider"], "LOCAL"),
    bucket: getString(record, ["bucket"], "") || undefined,
    objectKey,
    originalName: getString(record, ["originalName", "original_name"], file.name),
    mimeType: getString(record, ["mimeType", "mime_type"], file.type),
    visibility: getString(record, ["visibility", "visibilidad"], "PUBLIC"),
    status: getString(record, ["status", "estado"], "ACTIVE"),
    publicUrl: getString(record, ["publicUrl", "url", "signedUrl"], "") || buildPublicAssetUrl(objectKey)
  };
}
