import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { normalizePaginatedResponse } from "@/shared/api/normalizers";
import type { Publication } from "@/features/newsroom/newsroom.types";
import { newsroomApi } from "@/features/newsroom/newsroom.api";

export type ContentSubscriptionStatus = {
  id?: string;
  email?: string;
  displayName?: string | null;
  status?: "ACTIVE" | "UNSUBSCRIBED" | "SUSPENDED" | string;
  subscriptionTier?: "FREE" | "PREMIUM" | string;
  premiumUntil?: string | null;
  isPremiumActive?: boolean;
};

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function pathParam(path: string, key: string, value: string) {
  return path.replace(`:${key}`, encodeURIComponent(value));
}

export async function getMyContentSubscription() {
  const payload = await apiRequest<unknown>(ENDPOINTS.content.subscriptionMine);
  return unwrap<ContentSubscriptionStatus>(payload);
}

export async function getPremiumPublication(slug: string, kind: "news" | "columns") {
  const path = kind === "news" ? ENDPOINTS.content.premiumNewsDetail : ENDPOINTS.content.premiumColumnDetail;
  const payload = await apiRequest<unknown>(pathParam(path, "slug", slug));
  return unwrap<Publication>(payload);
}

export async function listPremiumCandidates() {
  const [news, columns] = await Promise.all([
    newsroomApi.publicNews({ page: 1, pageSize: 12 }),
    newsroomApi.publicColumns({ page: 1, pageSize: 12 })
  ]);
  const items = [...news.items, ...columns.items];
  const premiumItems = items.filter((item) => item.accessType === "PREMIUM");
  return normalizePaginatedResponse(premiumItems.length > 0 ? premiumItems : items, (item) => item as Publication, { page: 1, pageSize: 24 }).items;
}
