import { apiRequest } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
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

const INACTIVE_SUBSCRIPTION: ContentSubscriptionStatus = { status: "UNSUBSCRIBED", subscriptionTier: "FREE", isPremiumActive: false };

/**
 * El backend responde HTTP_400 de forma intermitente para este endpoint incluso con un token
 * válido (bug confirmado en el servidor, no depende del formato de la solicitud del frontend).
 * Ante ese caso concreto degradamos a "sin premium" en vez de romper la pantalla del paciente.
 */
export async function getMyContentSubscription() {
  try {
    const payload = await apiRequest<unknown>(ENDPOINTS.content.subscriptionMine);
    return unwrap<ContentSubscriptionStatus>(payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) return INACTIVE_SUBSCRIPTION;
    throw error;
  }
}

export async function requestPremiumSubscription() {
  const payload = await apiRequest<unknown>(ENDPOINTS.content.subscriptionRequest, { method: "POST" });
  return unwrap<ContentSubscriptionStatus>(payload);
}

export async function getSubscriptionPaymentConfig() {
  const payload = await apiRequest<unknown>(ENDPOINTS.content.subscriptionPaymentConfig);
  return unwrap<{ enabled?: boolean; message?: string; qrUrl?: string; qrImageUrl?: string; amount?: number; currency?: string }>(payload);
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
