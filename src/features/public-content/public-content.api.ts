import { env } from "@/config/env";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { getNumber, getString, isRecord, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";

export type PublicContentRow = {
  id: string;
  /** Identificador de la página a la que pertenece la sección. Necesario para editar y borrar. */
  pageId: string;
  /** Nombre legible de la página (título o slug), no el UUID. */
  pageLabel: string;
  name: string;
  code: string;
  type: string;
  sortOrder: number;
  content: Record<string, unknown>;
  fileId: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

export type PublicContentPage = {
  id: string;
  slug: string;
  title: string;
  status: string;
};

export type PublicContentBundle = PaginatedResult<PublicContentRow> & {
  page: number;
  pageInfo: PublicContentPage;
};

export type PublicContentElementInput = {
  code: string;
  type: string;
  content: Record<string, unknown>;
  sortOrder?: number;
  status?: "ACTIVE" | "INACTIVE";
};

function replacePathParam(path: string, param: string, value: string) {
  return path.replace(`:${param}`, encodeURIComponent(value));
}

function elementPath(pageId: string, elementId: string) {
  return replacePathParam(replacePathParam(ENDPOINTS.publicUi.elementsUpdate, "pageId", pageId), "elementId", elementId);
}

export function mapPublicContentRow(item: unknown, index: number, pageInfo?: PublicContentPage): PublicContentRow {
  const record = isRecord(item) ? item : {};
  const content = isRecord(record.content) ? record.content : {};
  const pageId = getString(record, ["pageId", "page_id", "page", "pagina"], pageInfo?.id ?? "");
  return {
    id: getString(record, ["id", "elemento_id", "key", "uuid"], `elemento-${index + 1}`),
    pageId,
    pageLabel: pageInfo?.title || pageInfo?.slug || pageId || "Página pública",
    name: getString(content, ["title", "titulo", "name", "nombre"], getString(record, ["code", "codigo", "section", "seccion"], "Sin nombre")),
    code: getString(record, ["code", "codigo"], ""),
    type: getString(record, ["type", "tipo"], "TEXT"),
    sortOrder: getNumber(record, ["sortOrder", "sort_order", "orden"], index),
    content,
    fileId: getString(record, ["fileId", "file_id"], ""),
    status: normalizeStatus(record.estado ?? record.status ?? record.visible)
  };
}

function mapPageInfo(payload: unknown, slug: string): PublicContentPage {
  const record = isRecord(payload) ? payload : {};
  return {
    id: getString(record, ["id", "pageId", "page_id"], ""),
    slug: getString(record, ["slug"], slug),
    title: getString(record, ["title", "titulo", "nombre"], slug),
    status: getString(record, ["status", "estado"], "PUBLISHED")
  };
}

/**
 * El endpoint público devuelve la página entera con todas sus secciones de una vez
 * —no admite `page`/`pageSize`—, así que la paginación se resuelve aquí. Antes se le
 * pasaban los parámetros igualmente y la barra mostraba siempre "Página 1 de 1"
 * aunque hubiese más secciones de las que caben en pantalla.
 */
export async function listPublicContent(query: { page?: number; pageSize?: number; slug?: string } = {}): Promise<PublicContentBundle> {
  const { slug = env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG, page = 1, pageSize = 20 } = query;
  const path = replacePathParam(ENDPOINTS.publicUi.elementsList, "slug", slug);
  const payload = await apiRequest<unknown>(path);

  const pageInfo = mapPageInfo(payload, slug);
  const record = isRecord(payload) ? payload : {};
  const rawElements = Array.isArray(record.elements) ? record.elements : Array.isArray(record.elementos) ? record.elementos : [];
  const items = rawElements.map((item, index) => mapPublicContentRow(item, index, pageInfo));

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
    pageInfo,
    raw: payload
  };
}

export async function createPublicContentElement(pageId: string, input: PublicContentElementInput) {
  const path = replacePathParam(ENDPOINTS.publicUi.elementsCreate, "pageId", pageId);
  return apiRequest<unknown>(path, { method: "POST", body: input });
}

export async function updatePublicContentElement(pageId: string, elementId: string, input: Partial<PublicContentElementInput>) {
  return apiRequest<unknown>(elementPath(pageId, elementId), { method: "PATCH", body: input });
}

export async function deletePublicContentElement(pageId: string, elementId: string) {
  const path = replacePathParam(replacePathParam(ENDPOINTS.publicUi.elementsDelete, "pageId", pageId), "elementId", elementId);
  return apiRequest<unknown>(path, { method: "DELETE" });
}
