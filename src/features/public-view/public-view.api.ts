import { env } from "@/config/env";
import { normalizePublicLandingResponse } from "@/features/public-view/public-view.normalizer";
import type { PublicViewLoadResult } from "@/features/public-view/public-view.types";

type PublicViewMode = "auto" | "public-view-id" | "page-by-id" | "page-slug";

function trimSlashes(value: string) {
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
}

function apiBaseUrl() {
  return env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
}

function encodeToken(value: string | undefined) {
  return encodeURIComponent(value ?? "");
}

function isNumericId(value: string | undefined) {
  return !!value && /^\d+$/.test(value.trim());
}

function publicViewIdentity() {
  const legacySlug = env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG?.trim();
  const explicitId = env.NEXT_PUBLIC_PUBLIC_VIEW_ID?.trim();
  const code = env.NEXT_PUBLIC_PUBLIC_VIEW_CODE?.trim();

  // Compatibilidad con el frontend anterior: el campo llamado "slug" puede traer el id.
  const id = explicitId || (isNumericId(legacySlug) ? legacySlug : undefined);
  const slug = legacySlug && !isNumericId(legacySlug) ? legacySlug : legacySlug || "inicio";

  return { id, slug, code, legacySlug };
}

function normalizeMode(): PublicViewMode {
  const mode = env.NEXT_PUBLIC_PUBLIC_VIEW_MODE;
  if (mode === "auto" || mode === "public-view-id" || mode === "page-by-id" || mode === "page-slug") return mode;
  return "public-view-id";
}

function resolveTemplate(template: string) {
  const identity = publicViewIdentity();
  return template
    .replaceAll(":id", encodeToken(identity.id || identity.legacySlug))
    .replaceAll(":slug", encodeToken(identity.slug || identity.id || identity.legacySlug))
    .replaceAll(":code", encodeToken(identity.code));
}

function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${trimSlashes(pathOrUrl)}`;
  return `${apiBaseUrl()}${normalizedPath}`;
}

export function buildConfiguredPublicViewUrl() {
  const custom = env.NEXT_PUBLIC_PUBLIC_VIEW_ENDPOINT?.trim();
  if (custom) return absoluteUrl(resolveTemplate(custom));

  const identity = publicViewIdentity();
  const mode = normalizeMode();

  if (mode === "page-slug") {
    return absoluteUrl(resolveTemplate("/api/v1/public/pages/:slug"));
  }

  if (mode === "page-by-id") {
    return absoluteUrl(resolveTemplate("/api/v1/public/pages/by-id/:id"));
  }

  if (mode === "auto") {
    if (identity.id) return absoluteUrl(resolveTemplate("/api/v1/public-views/:id"));
    return absoluteUrl(resolveTemplate("/api/v1/public/pages/:slug"));
  }

  // Regla principal del proyecto: Vistas públicas configurables por id.
  return absoluteUrl(resolveTemplate("/api/v1/public-views/:id"));
}

export function buildConfiguredPublicViewElementUrl(code: string) {
  const identity = publicViewIdentity();
  const mode = normalizeMode();
  const custom = env.NEXT_PUBLIC_PUBLIC_VIEW_ELEMENT_ENDPOINT?.trim();

  const template = custom || (mode === "page-slug" && !identity.id
    ? "/api/v1/public/pages/:slug/elements/:code"
    : "/api/v1/public-views/:id/elements/:code");

  const withCode = template.replaceAll(":code", encodeURIComponent(code));
  return absoluteUrl(resolveTemplate(withCode));
}

export function buildPublicPageElementUrl(elementId: string) {
  return absoluteUrl(`/api/v1/public/page-elements/${encodeURIComponent(elementId)}`);
}

function responseMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string" && message.trim()) return message;
  }
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return fallback;
}

async function readJsonOrText(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => null);
}

export async function loadConfiguredPublicLanding(): Promise<PublicViewLoadResult> {
  const endpoint = buildConfiguredPublicViewUrl();
  const identity = publicViewIdentity();

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "x-public-view-slug": identity.legacySlug || identity.slug,
        ...(identity.id ? { "x-public-view-id": identity.id } : {}),
        ...(identity.code ? { "x-public-view-code": identity.code } : {})
      }
    });

    const payload = await readJsonOrText(response);

    if (!response.ok) {
      return {
        ok: false,
        endpoint,
        status: response.status,
        message: responseMessage(payload, `No se pudo cargar la vista pública configurada desde el backend. HTTP ${response.status}.`),
        details: payload
      };
    }

    const landing = normalizePublicLandingResponse(payload);
    return { ok: true, landing, endpoint };
  } catch (error) {
    return {
      ok: false,
      endpoint,
      message: error instanceof Error ? error.message : "No se pudo conectar con el endpoint de vista pública.",
      details: error
    };
  }
}

export async function loadConfiguredPublicViewElement(code: string): Promise<{ ok: true; endpoint: string; data: unknown } | { ok: false; endpoint: string; status?: number; message: string; details?: unknown }> {
  const endpoint = buildConfiguredPublicViewElementUrl(code);

  try {
    const response = await fetch(endpoint, { cache: "no-store", headers: { Accept: "application/json" } });
    const payload = await readJsonOrText(response);

    if (!response.ok) {
      return {
        ok: false,
        endpoint,
        status: response.status,
        message: responseMessage(payload, `No se pudo cargar el elemento público ${code}. HTTP ${response.status}.`),
        details: payload
      };
    }

    return { ok: true, endpoint, data: payload };
  } catch (error) {
    return { ok: false, endpoint, message: error instanceof Error ? error.message : "No se pudo conectar con el endpoint del elemento público.", details: error };
  }
}
