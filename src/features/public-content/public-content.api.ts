import { env } from "@/config/env";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";

export type PublicContentRow = {
  id: string;
  name: string;
  page: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

type PublicContentQuery = SistemaListQuery & {
  slug?: string;
};

function replacePathParam(path: string, param: string, value: string) {
  return path.replace(`:${param}`, encodeURIComponent(value));
}

export function mapPublicContentRow(item: unknown, index: number): PublicContentRow {
  const record = isRecord(item) ? item : {};
  const content = isRecord(record.content) ? record.content : {};
  return {
    id: getString(record, ["id", "elemento_id", "key", "uuid"], `elemento-${index + 1}`),
    name: getString(content, ["title", "titulo", "name", "nombre"], getString(record, ["code", "codigo", "section", "seccion"], "Sin nombre")),
    page: getString(record, ["page", "pagina", "pageId", "page_id"], "Página pública"),
    status: normalizeStatus(record.estado ?? record.status ?? record.visible)
  };
}

export async function listPublicContent(query: PublicContentQuery = {}): Promise<PaginatedResult<PublicContentRow>> {
  const { slug = env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG, ...listQuery } = query;
  const path = replacePathParam(ENDPOINTS.publicUi.elementsList, "slug", slug);
  const payload = await apiRequest<unknown>(`${path}${buildQueryString(listQuery)}`);
  return normalizePaginatedResponse(payload, mapPublicContentRow, listQuery);
}
