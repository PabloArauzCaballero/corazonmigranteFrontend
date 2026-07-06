export type SistemaListQuery = {
  search?: string;
  page?: number;
  pageSize?: number;
  /**
   * Solo se conserva para compatibilidad de tipos en tablas existentes.
   * No se envía desde este helper porque el PaginationQueryDto real del backend
   * no acepta `status` en endpoints genéricos como /admin/users, /therapy/products
   * o /admin/accounting/*.
   */
  status?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export function buildQueryString(params: SistemaListQuery & Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();
  const search = params.search?.trim();

  if (search) searchParams.set("search", search);

  if (params.page && params.page > 0) searchParams.set("page", String(params.page));
  if (params.pageSize && params.pageSize > 0) searchParams.set("pageSize", String(params.pageSize));

  if (params.sortBy?.trim()) searchParams.set("sort", params.sortBy.trim());
  if (params.sortDir) searchParams.set("order", params.sortDir);

  for (const [key, value] of Object.entries(params)) {
    if (["search", "page", "pageSize", "status", "sortBy", "sortDir", "role", "rol"].includes(key)) continue;
    if (value !== undefined && String(value).trim()) searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
