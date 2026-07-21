import { apiRequest } from "@/shared/api/client";

const BASE = "/api/v1";

export type DownloadableVisibility =
  | "PUBLIC"
  | "PREMIUM"
  | "PRIVATE"
  | "PURCHASE_REQUIRED"
  | "UNLISTED";

export type DownloadableStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED"
  | "REJECTED";

export type DownloadableAction =
  | "DIRECT_DOWNLOAD"
  | "PREMIUM_DOWNLOAD"
  | "HOTMART_CHECKOUT"
  | "HOTMART_PRODUCT_ACCESS"
  | "EXTERNAL_RESOURCE"
  | "LOGIN_REQUIRED"
  | "UPGRADE_REQUIRED"
  | "NOT_AVAILABLE";

export type AdminDownloadable = {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  category?: string | null;
  tags: string[];
  coverUrl?: string | null;
  fileUrl?: string | null;
  visibility: DownloadableVisibility;
  status: DownloadableStatus;
  requiresPremium: boolean;
  requiresPurchase: boolean;
  hotmartProductId?: string | null;
  hotmartCheckoutUrl?: string | null;
  version: number;
  downloadCount: number;
  publishedAt?: string | null;
  createdAt?: string;
};

export type AccessDecision = {
  allowed: boolean;
  action: DownloadableAction;
  reason?: string;
  checkoutUrl?: string;
};

export type LibraryCard = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  category?: string | null;
  tags: string[];
  coverUrl?: string | null;
  visibility: DownloadableVisibility;
  requiresPremium: boolean;
  requiresPurchase: boolean;
  mimeType?: string | null;
  publishedAt?: string | null;
  access: AccessDecision;
};

export type Paginated<T> = {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

// ── Admin ──────────────────────────────────────────────────────────
export type CreateDownloadableInput = {
  title: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  tags?: string[];
  coverUrl?: string;
  fileUrl?: string;
  visibility?: DownloadableVisibility;
  requiresPremium?: boolean;
  requiresPurchase?: boolean;
};

export function adminListDownloadables(page = 1, search?: string) {
  const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (search) qs.set("search", search);
  return apiRequest<Paginated<AdminDownloadable>>(`${BASE}/admin/downloadables?${qs}`, { auth: true });
}

export function adminGetMetrics() {
  return apiRequest<{ total: number; published: number; premium: number; hotmart: number; downloads: number; denied: number }>(
    `${BASE}/admin/downloadables/metrics`,
    { auth: true },
  );
}

export function adminCreateDownloadable(input: CreateDownloadableInput) {
  return apiRequest<AdminDownloadable>(`${BASE}/admin/downloadables`, { method: "POST", body: input, auth: true });
}

export function adminUpdateDownloadable(id: string, input: Partial<CreateDownloadableInput> & { status?: DownloadableStatus }) {
  return apiRequest<AdminDownloadable>(`${BASE}/admin/downloadables/${id}`, { method: "PATCH", body: input, auth: true });
}

export function adminSetHotmart(id: string, input: { hotmartProductId?: string; hotmartOfferId?: string; hotmartCheckoutUrl?: string; externalReference?: string }) {
  return apiRequest<AdminDownloadable>(`${BASE}/admin/downloadables/${id}/hotmart`, { method: "PUT", body: input, auth: true });
}

export function adminCreateVersion(id: string, changeReason?: string) {
  return apiRequest(`${BASE}/admin/downloadables/${id}/versions`, { method: "POST", body: { changeReason }, auth: true });
}

export function adminSubmitReview(id: string, versionId: string) {
  return apiRequest(`${BASE}/admin/downloadables/${id}/versions/${versionId}/submit-review`, { method: "POST", auth: true });
}

export function adminApproveVersion(id: string, versionId: string) {
  return apiRequest(`${BASE}/admin/downloadables/${id}/versions/${versionId}/approve`, { method: "POST", auth: true });
}

export function adminPublishVersion(id: string, versionId: string) {
  return apiRequest(`${BASE}/admin/downloadables/${id}/versions/${versionId}/publish`, { method: "POST", auth: true });
}

export function adminListVersions(id: string) {
  return apiRequest<Array<{ id: string; versionNumber: number; status: DownloadableStatus; isPublished: boolean }>>(
    `${BASE}/admin/downloadables/${id}/versions`,
    { auth: true },
  );
}

export function adminArchiveDownloadable(id: string) {
  return apiRequest(`${BASE}/admin/downloadables/${id}/archive`, { method: "POST", auth: true });
}

// ── Usuario final ──────────────────────────────────────────────────
export function myLibrary(page = 1) {
  return apiRequest<Paginated<LibraryCard>>(`${BASE}/downloadables/me/library?page=${page}`, { auth: true });
}

export function requestDownload(id: string) {
  return apiRequest<{ url: string; action: DownloadableAction }>(`${BASE}/downloadables/${id}/download`, {
    method: "POST",
    auth: true,
  });
}

export function publicationDownloadables(publicationId: string) {
  return apiRequest<LibraryCard[]>(`${BASE}/publications/${publicationId}/downloadables`, { auth: true });
}
