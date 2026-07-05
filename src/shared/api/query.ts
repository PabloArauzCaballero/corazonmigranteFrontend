export type SistemaListQuery = {
  search?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export function buildQueryString(params: SistemaListQuery & Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();
  const search = params.search?.trim();

  if (search) {
    searchParams.set("search", search);
    searchParams.set("p_search", search);
  }

  if (params.page && params.page > 0) {
    searchParams.set("page", String(params.page));
    searchParams.set("p_page", String(params.page));
  }

  if (params.pageSize && params.pageSize > 0) {
    searchParams.set("limit", String(params.pageSize));
    searchParams.set("p_limit", String(params.pageSize));
  }

  if (params.status?.trim()) {
    searchParams.set("status", params.status.trim());
    searchParams.set("p_estado", params.status.trim());
  }

  if (params.sortBy?.trim()) searchParams.set("sortBy", params.sortBy.trim());
  if (params.sortDir) searchParams.set("sortDir", params.sortDir);

  for (const [key, value] of Object.entries(params)) {
    if (["search", "page", "pageSize", "status", "sortBy", "sortDir"].includes(key)) continue;
    if (value !== undefined && String(value).trim()) searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
