import { apiRequest } from "@/shared/api/client";
import { API_PREFIX } from "@/shared/api/endpoints";
import { normalizePaginatedResponse, type PaginatedResult } from "@/shared/api/normalizers";
import type { SistemaListQuery } from "@/shared/api/query";
import type { AdsCampaign, AdsCompany, AdsCreative, AdsPlacement, Author, Category, ContentSubscriber, HomepagePayload, Publication, PublicationType, Tag } from "@/features/newsroom/newsroom.types";

type PublicationQuery = SistemaListQuery & { publicationType?: PublicationType | ""; accessType?: string; categorySlug?: string; tagSlug?: string; pageSlug?: string; authorId?: string; sort?: string; order?: "asc" | "desc" };
type AdsQuery = SistemaListQuery & { companyId?: string; sort?: string; order?: "asc" | "desc" };

function setParam(params: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  const text = String(value).trim();
  if (text) params.set(key, text);
}

function listQuery(query: PublicationQuery | AdsQuery = {}) {
  const params = new URLSearchParams();
  setParam(params, "search", query.search);
  setParam(params, "page", query.page);
  setParam(params, "pageSize", query.pageSize ?? 20);
  setParam(params, "status", query.status);
  // Evitamos sort/order por defecto para no provocar 400 en servidores con DTO estricto.
  Object.entries(query).forEach(([key, value]) => {
    if (["search", "page", "pageSize", "status", "sort", "order", "sortBy", "sortDir"].includes(key)) return;
    setParam(params, key, value);
  });
  const out = params.toString();
  return out ? `?${out}` : "";
}

function publicListQuery(query: PublicationQuery = {}) {
  const params = new URLSearchParams();
  setParam(params, "q", query.search);
  setParam(params, "page", query.page);
  setParam(params, "pageSize", query.pageSize ?? 20);
  setParam(params, "categorySlug", query.categorySlug);
  setParam(params, "tagSlug", query.tagSlug);
  setParam(params, "pageSlug", query.pageSlug);
  const out = params.toString();
  return out ? `?${out}` : "";
}
function items<T>(payload: unknown): T[] { return normalizePaginatedResponse<T>(payload, (item) => item as T).items; }
function mapCategory(item: unknown): Category {
  const record = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
  return {
    id: String(record.id ?? record.categoryId ?? record.category_id ?? ""),
    slug: String(record.slug ?? record.codigo ?? record.name ?? "").trim(),
    name: String(record.name ?? record.nombre ?? "Sin categoría").trim(),
    description: typeof record.description === "string" ? record.description : undefined,
    isActive: record.isActive === undefined ? record.is_active !== false : Boolean(record.isActive),
    sortOrder: Number(record.sortOrder ?? record.sort_order ?? 0)
  };
}
function mapTag(item: unknown): Tag {
  const record = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
  return {
    id: String(record.id ?? record.tagId ?? record.tag_id ?? ""),
    slug: String(record.slug ?? record.codigo ?? record.name ?? "").trim(),
    name: String(record.name ?? record.nombre ?? "Sin tag").trim()
  };
}
function compactValid<T extends { id: string; name: string }>(values: T[]) {
  return values.filter((item) => item.id && item.name && !item.id.startsWith("undefined"));
}
function qs(params: Record<string, string | number | undefined>) { const out = new URLSearchParams(); Object.entries(params).forEach(([k,v]) => { if (v !== undefined && String(v).trim()) out.set(k, String(v)); }); const s = out.toString(); return s ? `?${s}` : ""; }

export const newsroomApi = {
  listPublications(query: PublicationQuery = {}): Promise<PaginatedResult<Publication>> {
    return apiRequest<unknown>(`${API_PREFIX}/admin/content/publications${listQuery(query)}`).then((payload) => normalizePaginatedResponse(payload, (item) => item as Publication, query));
  },
  createPublication(input: { authorId: string; categoryId: string; title: string; slug?: string; summary: string; body: string; publicationType: PublicationType; accessType: string; scheduledAt?: string; tagIds?: string[]; commentsEnabled?: boolean; reactionsEnabled?: boolean; seoMetadata?: Record<string, unknown> }) {
    return apiRequest<Publication>(`${API_PREFIX}/admin/content/publications`, { method: "POST", body: input });
  },
  updatePublication(id: string, input: Partial<{ authorId: string; categoryId: string; title: string; slug: string; summary: string; body: string; publicationType: PublicationType; accessType: string; scheduledAt?: string; tagIds: string[]; commentsEnabled: boolean; reactionsEnabled: boolean; seoMetadata: Record<string, unknown> }>) {
    return apiRequest<Publication>(`${API_PREFIX}/admin/content/publications/${id}`, { method: "PATCH", body: input });
  },
  publish(id: string) { return apiRequest<Publication>(`${API_PREFIX}/admin/content/publications/${id}/publish`, { method: "POST" }); },
  archive(id: string) { return apiRequest<Publication>(`${API_PREFIX}/admin/content/publications/${id}/archive`, { method: "POST" }); },
  async categories(activeOnly = false) {
    try {
      const payload = await apiRequest<unknown>(activeOnly ? `${API_PREFIX}/publications/categories` : `${API_PREFIX}/admin/content/categories`, { auth: !activeOnly });
      const values = compactValid(items<unknown>(payload).map(mapCategory));
      if (values.length || activeOnly) return values;
    } catch (error) {
      if (activeOnly) throw error;
    }
    const fallback = await apiRequest<unknown>(`${API_PREFIX}/publications/categories`, { auth: false });
    return compactValid(items<unknown>(fallback).map(mapCategory));
  },
  createCategory(input: { name: string; slug?: string; description?: string; isActive?: boolean; sortOrder?: number }) { return apiRequest<Category>(`${API_PREFIX}/admin/content/categories`, { method: "POST", body: input }); },
  async tags() {
    try {
      const payload = await apiRequest<unknown>(`${API_PREFIX}/admin/content/tags`);
      const values = compactValid(items<unknown>(payload).map(mapTag));
      if (values.length) return values;
    } catch {
      // Fallback público para que los selects no queden vacíos por permisos administrativos incompletos.
    }
    const fallback = await apiRequest<unknown>(`${API_PREFIX}/publications/tags`, { auth: false });
    return compactValid(items<unknown>(fallback).map(mapTag));
  },
  createTag(input: { name: string; slug?: string }) { return apiRequest<Tag>(`${API_PREFIX}/admin/content/tags`, { method: "POST", body: input }); },
  authors() { return apiRequest<unknown>(`${API_PREFIX}/admin/content/authors`).then(items<Author>); },
  createAuthor(input: { displayName: string; headline?: string; bio?: string; status?: string; userId?: string }) { return apiRequest<Author>(`${API_PREFIX}/admin/content/authors`, { method: "POST", body: input }); },
  publicNews(query: PublicationQuery = {}) { return apiRequest<unknown>(`${API_PREFIX}/publications/news${publicListQuery(query)}`, { auth: false }).then((payload) => normalizePaginatedResponse(payload, (item) => item as Publication, query)); },
  publicColumns(query: PublicationQuery = {}) { return apiRequest<unknown>(`${API_PREFIX}/publications/columns${publicListQuery(query)}`, { auth: false }).then((payload) => normalizePaginatedResponse(payload, (item) => item as Publication, query)); },
  publicPublication(slug: string, kind: "news" | "columns") { return apiRequest<Publication>(`${API_PREFIX}/publications/${kind}/${slug}`, { auth: false }); },
  homepagePreview() { return apiRequest<HomepagePayload>(`${API_PREFIX}/admin/homepage/preview`); },
  subscribers(query: SistemaListQuery = {}): Promise<PaginatedResult<ContentSubscriber>> {
    return apiRequest<unknown>(`${API_PREFIX}/admin/content/subscribers${listQuery(query)}`).then((payload) => normalizePaginatedResponse(payload, (item) => item as ContentSubscriber, query));
  },
  upsertSubscriber(input: { email: string; displayName?: string; userId?: string; status?: string; subscriptionTier?: string; premiumUntil?: string; source?: string }) {
    return apiRequest<ContentSubscriber>(`${API_PREFIX}/admin/content/subscribers`, { method: "POST", body: input });
  },
  updateSubscriber(id: string, input: Partial<{ userId: string; email: string; displayName: string; status: string; subscriptionTier: string; premiumUntil: string; source: string }>) {
    return apiRequest<ContentSubscriber>(`${API_PREFIX}/admin/content/subscribers/${id}`, { method: "PATCH", body: input });
  },
  updateSubscriberByUser(userId: string, input: Partial<{ status: string; subscriptionTier: string; premiumUntil: string; source: string; metadata: Record<string, unknown> }>) {
    return apiRequest<ContentSubscriber>(`${API_PREFIX}/admin/content/subscribers/${userId}/subscription`, { method: "PATCH", body: input });
  },
  approveSubscriberRequest(userId: string, premiumUntil?: string) {
    return apiRequest<ContentSubscriber>(`${API_PREFIX}/admin/content/subscribers/${userId}/approve`, { method: "POST", body: premiumUntil ? { premiumUntil } : {} });
  },
  rejectSubscriberRequest(userId: string) {
    return apiRequest<ContentSubscriber>(`${API_PREFIX}/admin/content/subscribers/${userId}/reject`, { method: "POST" });
  },
  publicSlots(placementCode = "home_hero", publicationId?: string, pageSlug?: string) { return apiRequest<unknown>(`${API_PREFIX}/advertising/slots${qs({ placementCode, publicationId, pageSlug })}`, { auth: false }); }
};

export const adsApi = {
  companies() { return apiRequest<unknown>(`${API_PREFIX}/admin/advertising/companies`).then(items<AdsCompany>); },
  createCompany(input: { businessName: string; commercialName: string; taxId?: string; contactName?: string; contactEmail?: string; contactPhone?: string; status?: string; metadata?: Record<string, unknown> }) { return apiRequest<AdsCompany>(`${API_PREFIX}/admin/advertising/companies`, { method: "POST", body: input }); },
  updateCompany(id: string, input: Partial<{ businessName: string; commercialName: string; taxId: string; contactName: string; contactEmail: string; contactPhone: string; status: string; metadata: Record<string, unknown> }>) { return apiRequest<AdsCompany>(`${API_PREFIX}/admin/advertising/companies/${id}`, { method: "PATCH", body: input }); },
  placements() { return apiRequest<unknown>(`${API_PREFIX}/admin/advertising/placements`).then(items<AdsPlacement>); },
  createPlacement(input: { code: string; name: string; description?: string; context?: string; isActive?: boolean; dimensions?: Record<string, unknown> }) { return apiRequest<AdsPlacement>(`${API_PREFIX}/admin/advertising/placements`, { method: "POST", body: input }); },
  campaigns(query: AdsQuery = {}) { return apiRequest<unknown>(`${API_PREFIX}/admin/advertising/campaigns${listQuery(query)}`).then((payload) => normalizePaginatedResponse(payload, (item) => item as AdsCampaign, query)); },
  createCampaign(input: { companyId: string; name: string; objective?: string; startsAt: string; endsAt: string; budgetAmount?: number; currency?: string; priority?: number; placementIds?: string[]; publicationIds?: string[]; categoryIds?: string[]; pageSlugs?: string[]; notes?: string }) { return apiRequest<AdsCampaign>(`${API_PREFIX}/admin/advertising/campaigns`, { method: "POST", body: input }); },
  setStatus(id: string, status: string) { return apiRequest<AdsCampaign>(`${API_PREFIX}/admin/advertising/campaigns/${id}/status`, { method: "POST", body: { status } }); },
  createCreative(campaignId: string, input: { title: string; mediaType?: string; fileId?: string; assetUrl: string; destinationUrl: string; altText: string; mimeType?: string; width?: number; height?: number; sizeBytes?: number; isPrimary?: boolean }) { return apiRequest<AdsCreative>(`${API_PREFIX}/admin/advertising/campaigns/${campaignId}/creatives`, { method: "POST", body: input }); },
  createAd(input: { campaignId: string; title: string; mediaType?: string; fileId?: string; assetUrl: string; destinationUrl: string; altText: string; mimeType?: string; width?: number; height?: number; sizeBytes?: number; isPrimary?: boolean; publicationId?: string; publicationIds?: string[]; categoryId?: string; categoryIds?: string[]; placementId?: string; placementIds?: string[]; pageSlug?: string; pageSlugs?: string[] }) { return apiRequest<AdsCreative>(`${API_PREFIX}/admin/advertising/ads`, { method: "POST", body: input }); },
  publicSlots(placementCode = "home_hero", publicationId?: string, pageSlug?: string) { return apiRequest<unknown>(`${API_PREFIX}/advertising/slots${qs({ placementCode, publicationId, pageSlug })}`, { auth: false }); }
};
