import { apiRequest } from "@/shared/api/client";
import { API_PREFIX } from "@/shared/api/endpoints";
import { normalizePaginatedResponse, type PaginatedResult } from "@/shared/api/normalizers";
import type { SistemaListQuery } from "@/shared/api/query";
import type { AdsCampaign, AdsCompany, AdsCreative, AdsPlacement, Author, Category, ContentSubscriber, HomepagePayload, Publication, PublicationType, Tag } from "@/features/newsroom/newsroom.types";

type PublicationQuery = SistemaListQuery & { publicationType?: PublicationType | ""; accessType?: string; categorySlug?: string; tagSlug?: string; authorId?: string; sort?: string; order?: "asc" | "desc" };
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
  setParam(params, "sort", query.sort ?? query.sortBy ?? "createdAt");
  setParam(params, "order", query.order ?? query.sortDir ?? "desc");
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
  const out = params.toString();
  return out ? `?${out}` : "";
}
function items<T>(payload: unknown): T[] { return normalizePaginatedResponse<T>(payload, (item) => item as T).items; }
function qs(params: Record<string, string | number | undefined>) { const out = new URLSearchParams(); Object.entries(params).forEach(([k,v]) => { if (v !== undefined && String(v).trim()) out.set(k, String(v)); }); const s = out.toString(); return s ? `?${s}` : ""; }

export const newsroomApi = {
  listPublications(query: PublicationQuery = {}): Promise<PaginatedResult<Publication>> {
    return apiRequest<unknown>(`${API_PREFIX}/admin/content/publications${listQuery(query)}`).then((payload) => normalizePaginatedResponse(payload, (item) => item as Publication, query));
  },
  createPublication(input: { authorId: string; categoryId: string; title: string; slug?: string; summary: string; body: string; publicationType: PublicationType; accessType: string; scheduledAt?: string; tagIds?: string[]; commentsEnabled?: boolean; reactionsEnabled?: boolean; seoMetadata?: Record<string, unknown> }) {
    return apiRequest<Publication>(`${API_PREFIX}/admin/content/publications`, { method: "POST", body: input });
  },
  publish(id: string) { return apiRequest<Publication>(`${API_PREFIX}/admin/content/publications/${id}/publish`, { method: "POST" }); },
  archive(id: string) { return apiRequest<Publication>(`${API_PREFIX}/admin/content/publications/${id}/archive`, { method: "POST" }); },
  categories(activeOnly = false) { return apiRequest<unknown>(activeOnly ? `${API_PREFIX}/publications/categories` : `${API_PREFIX}/admin/content/categories`, { auth: !activeOnly }).then(items<Category>); },
  createCategory(input: { name: string; slug?: string; description?: string; isActive?: boolean; sortOrder?: number }) { return apiRequest<Category>(`${API_PREFIX}/admin/content/categories`, { method: "POST", body: input }); },
  tags() { return apiRequest<unknown>(`${API_PREFIX}/admin/content/tags`).then(items<Tag>); },
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
  }
};

export const adsApi = {
  companies() { return apiRequest<unknown>(`${API_PREFIX}/admin/advertising/companies`).then(items<AdsCompany>); },
  createCompany(input: { businessName: string; commercialName: string; taxId?: string; contactName?: string; contactEmail?: string; contactPhone?: string; status?: string }) { return apiRequest<AdsCompany>(`${API_PREFIX}/admin/advertising/companies`, { method: "POST", body: input }); },
  placements() { return apiRequest<unknown>(`${API_PREFIX}/admin/advertising/placements`).then(items<AdsPlacement>); },
  createPlacement(input: { code: string; name: string; description?: string; context?: string; isActive?: boolean; dimensions?: Record<string, unknown> }) { return apiRequest<AdsPlacement>(`${API_PREFIX}/admin/advertising/placements`, { method: "POST", body: input }); },
  campaigns(query: AdsQuery = {}) { return apiRequest<unknown>(`${API_PREFIX}/admin/advertising/campaigns${listQuery(query)}`).then((payload) => normalizePaginatedResponse(payload, (item) => item as AdsCampaign, query)); },
  createCampaign(input: { companyId: string; name: string; objective?: string; startsAt: string; endsAt: string; budgetAmount?: number; currency?: string; priority?: number; placementIds?: string[]; notes?: string }) { return apiRequest<AdsCampaign>(`${API_PREFIX}/admin/advertising/campaigns`, { method: "POST", body: input }); },
  setStatus(id: string, status: string) { return apiRequest<AdsCampaign>(`${API_PREFIX}/admin/advertising/campaigns/${id}/status`, { method: "POST", body: { status } }); },
  createCreative(campaignId: string, input: { title: string; mediaType?: string; assetUrl: string; destinationUrl: string; altText: string; mimeType?: string; width?: number; height?: number; sizeBytes?: number; isPrimary?: boolean }) { return apiRequest<AdsCreative>(`${API_PREFIX}/admin/advertising/campaigns/${campaignId}/creatives`, { method: "POST", body: input }); },
  publicSlots(placementCode = "home_hero") { return apiRequest<unknown>(`${API_PREFIX}/advertising/slots${qs({ placementCode })}`, { auth: false }); }
};
