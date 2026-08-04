import { apiRequest } from "@/shared/api/client";
import { ATTR, BUSINESS_SPANS, runInSpan } from "@/observability";

const BASE = "/api/v1";

// El backend envuelve las respuestas en { data, meta }. Estas ayudas
// desenvuelven ese sobre para que las listas, métricas e historial carguen.
function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function unwrapList<T>(payload: unknown): Paginated<T> {
  const record = (payload ?? {}) as Record<string, unknown>;
  const rawItems = record.data ?? record.items ?? [];
  const items = Array.isArray(rawItems) ? (rawItems as T[]) : [];
  const pagination = (record.pagination as Paginated<T>["pagination"]) ?? {
    page: 1,
    pageSize: items.length,
    total: items.length,
    totalPages: 1,
  };
  return { items, pagination };
}

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

export async function adminListDownloadables(page = 1, search?: string) {
  const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (search) qs.set("search", search);
  return unwrapList<AdminDownloadable>(await apiRequest<unknown>(`${BASE}/admin/downloadables?${qs}`, { auth: true }));
}

export async function adminGetMetrics() {
  return unwrap<{ total: number; published: number; premium: number; hotmart: number; downloads: number; denied: number }>(
    await apiRequest<unknown>(`${BASE}/admin/downloadables/metrics`, { auth: true }),
  );
}

export async function adminCreateDownloadable(input: CreateDownloadableInput) {
  return unwrap<AdminDownloadable>(await apiRequest<unknown>(`${BASE}/admin/downloadables`, { method: "POST", body: input, auth: true }));
}

export async function adminUpdateDownloadable(id: string, input: Partial<CreateDownloadableInput> & { status?: DownloadableStatus }) {
  return unwrap<AdminDownloadable>(await apiRequest<unknown>(`${BASE}/admin/downloadables/${id}`, { method: "PATCH", body: input, auth: true }));
}

export async function adminSetHotmart(id: string, input: { hotmartProductId?: string; hotmartOfferId?: string; hotmartCheckoutUrl?: string; externalReference?: string }) {
  return unwrap<AdminDownloadable>(await apiRequest<unknown>(`${BASE}/admin/downloadables/${id}/hotmart`, { method: "PUT", body: input, auth: true }));
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

export async function adminListVersions(id: string) {
  const payload = unwrap<unknown>(await apiRequest<unknown>(`${BASE}/admin/downloadables/${id}/versions`, { auth: true }));
  return (Array.isArray(payload) ? payload : []) as Array<{ id: string; versionNumber: number; status: DownloadableStatus; isPublished: boolean }>;
}

export function adminArchiveDownloadable(id: string) {
  return apiRequest(`${BASE}/admin/downloadables/${id}/archive`, { method: "POST", auth: true });
}

// ── Usuario final ──────────────────────────────────────────────────
export async function myLibrary(page = 1) {
  return unwrapList<LibraryCard>(await apiRequest<unknown>(`${BASE}/downloadables/me/library?page=${page}`, { auth: true }));
}

/**
 * El span registra que hubo una descarga y cómo terminó. **No** registra el
 * identificador del recurso, ni su título, ni la URL firmada que devuelve el backend:
 * esa URL da acceso al archivo y no puede aparecer en una traza.
 */
export async function requestDownload(id: string) {
  return runInSpan(
    BUSINESS_SPANS.documentDownload,
    {
      [ATTR.feature]: "downloadables",
      [ATTR.operation]: "download",
      [ATTR.uiComponent]: "MyDownloadablesLibrary",
    },
    async (span) => {
      try {
        const result = unwrap<{ url: string; action: DownloadableAction }>(
          await apiRequest<unknown>(`${BASE}/downloadables/${id}/download`, { method: "POST", auth: true }),
        );
        span.setAttribute(ATTR.uiResult, "success");
        return result;
      } catch (error) {
        span.setAttribute(ATTR.uiResult, "error");
        throw error;
      }
    },
  );
}

export async function publicationDownloadables(publicationId: string) {
  const payload = unwrap<unknown>(await apiRequest<unknown>(`${BASE}/publications/${publicationId}/downloadables`, { auth: true }));
  return (Array.isArray(payload) ? payload : []) as LibraryCard[];
}
