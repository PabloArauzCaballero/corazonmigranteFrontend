import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";

export type CatalogRow = {
  id: string;
  name: string;
  type: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

export function mapCatalogRow(defaultType: string) {
  return (item: unknown, index: number): CatalogRow => {
    const record = isRecord(item) ? item : {};
    return {
      id: getString(record, ["id", "producto_id", "enfoque_id", "uuid"], `${defaultType.toLowerCase()}-${index + 1}`),
      name: getString(record, ["name", "nombre", "titulo", "title", "descripcion_corta"], "Sin nombre"),
      type: getString(record, ["type", "tipo", "categoria"], defaultType),
      status: normalizeStatus(record.estado ?? record.status ?? record.activo)
    };
  };
}

export async function listApproaches(query: SistemaListQuery = {}): Promise<PaginatedResult<CatalogRow>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.products.approachesList}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapCatalogRow("Enfoque"), query);
}

export async function listServices(query: SistemaListQuery = {}): Promise<PaginatedResult<CatalogRow>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.products.productsList}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapCatalogRow("Servicio"), query);
}
