import type { SistemaListQuery } from "@/shared/api/query";

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  raw: unknown;
};

type RecordValue = Record<string, unknown>;

export function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getString(record: RecordValue, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

export function getNumber(record: RecordValue, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function nestedNumber(record: RecordValue, objectKeys: string[], valueKeys: string[], fallback: number) {
  for (const objectKey of objectKeys) {
    const objectValue = record[objectKey];
    if (isRecord(objectValue)) {
      const value = getNumber(objectValue, valueKeys, Number.NaN);
      if (Number.isFinite(value)) return value;
    }
  }
  return fallback;
}

function findArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const directKeys = ["data", "items", "rows", "results", "result", "records", "usuarios", "solicitudes", "productos", "enfoques", "cuentas", "grupos", "centros", "transacciones", "elementos", "elements"];
  for (const key of directKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = findArray(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

export function normalizePaginatedResponse<T>(payload: unknown, mapper: (item: unknown, index: number) => T, query: SistemaListQuery = {}): PaginatedResult<T> {
  const sourceItems = findArray(payload);
  const items = sourceItems.map(mapper);
  const record = isRecord(payload) ? payload : {};
  const page = getNumber(record, ["page", "currentPage", "pagina", "p_page"], nestedNumber(record, ["meta", "pagination", "paginacion"], ["page", "currentPage", "pagina"], query.page ?? 1));
  const pageSize = getNumber(record, ["pageSize", "limit", "perPage", "per_page", "p_limit"], nestedNumber(record, ["meta", "pagination", "paginacion"], ["pageSize", "limit", "perPage", "per_page"], query.pageSize ?? Math.max(items.length, 1)));
  const total = Math.max(
    getNumber(record, ["total", "totalItems", "count", "totalCount", "cantidad"], nestedNumber(record, ["meta", "pagination", "paginacion"], ["total", "totalItems", "count"], items.length)),
    items.length
  );
  const totalPages = Math.max(1, getNumber(record, ["totalPages", "pages", "paginas"], nestedNumber(record, ["meta", "pagination", "paginacion"], ["totalPages", "pages", "paginas"], Math.ceil(total / Math.max(pageSize, 1)))));

  return { items, page, pageSize, total, totalPages, raw: payload };
}

export function normalizeStatus(value: unknown) {
  const raw = String(value ?? "activo").trim().toLowerCase();
  if (["false", "0", "inactivo", "inactive", "apagado", "deleted", "eliminado"].includes(raw)) return "inactivo";
  if (["pendiente", "pending", "solicitada", "requested", "borrador"].includes(raw)) return "pendiente";
  if (["bloqueado", "blocked", "suspendido", "suspended"].includes(raw)) return "bloqueado";
  return "activo";
}
