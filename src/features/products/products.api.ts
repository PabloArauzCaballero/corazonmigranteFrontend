import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";

export type CatalogRow = {
  id: string;
  name: string;
  type: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
  raw: Record<string, unknown>;
};

function replacePathParam(path: string, param: string, value: string) {
  return path.replace(`:${param}`, encodeURIComponent(value));
}

export function mapCatalogRow(defaultType: string) {
  return (item: unknown, index: number): CatalogRow => {
    const record = isRecord(item) ? item : {};
    return {
      id: getString(record, ["id", "producto_id", "enfoque_id", "uuid"], `${defaultType.toLowerCase()}-${index + 1}`),
      name: getString(record, ["name", "nombre", "titulo", "title", "descripcion_corta"], "Sin nombre"),
      type: getString(record, ["type", "tipo", "categoria"], defaultType),
      status: normalizeStatus(record.estado ?? record.status ?? record.activo),
      raw: record
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

export type ApproachInput = {
  name: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE";
  sortOrder?: number;
};

export async function createApproach(input: ApproachInput) {
  return apiRequest<unknown>(ENDPOINTS.products.approachesCreate, { method: "POST", body: input });
}

export async function updateApproach(id: string, input: ApproachInput) {
  return apiRequest<unknown>(replacePathParam(ENDPOINTS.products.approachesUpdate, "approachId", id), { method: "PATCH", body: input });
}

export type ServiceInput = {
  approachId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  currency?: string;
  status?: "ACTIVE" | "INACTIVE";
  sortOrder?: number;
};

export async function createService(input: ServiceInput) {
  return apiRequest<unknown>(ENDPOINTS.products.productsCreate, { method: "POST", body: input });
}

export async function updateService(id: string, input: ServiceInput) {
  return apiRequest<unknown>(replacePathParam(ENDPOINTS.products.productsUpdate, "productId", id), { method: "PATCH", body: input });
}
