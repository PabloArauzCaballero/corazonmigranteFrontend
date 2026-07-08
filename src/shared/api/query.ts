export type SistemaListQuery = {
  search?: string;
  page?: number;
  pageSize?: number;
  /**
   * Solo se conserva para compatibilidad de tipos en tablas existentes.
   * No se envía desde este helper porque el PaginationQueryDto real del servidor
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

  // No enviamos sort/order desde el helper genérico. El servidor tiene orden por defecto
  // y varias versiones desplegadas rechazan esos campos con ValidationPipe estricto.

  for (const [key, value] of Object.entries(params)) {
    if (["search", "page", "pageSize", "status", "sortBy", "sortDir", "role", "rol"].includes(key)) continue;
    if (value !== undefined && String(value).trim()) searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
