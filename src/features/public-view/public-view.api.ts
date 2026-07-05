import { env } from "@/config/env";
import { normalizePublicLandingResponse } from "@/features/public-view/public-view.normalizer";
import type { PublicViewLoadResult } from "@/features/public-view/public-view.types";

type PublicViewMode = "auto" | "public-view-id" | "page-by-id" | "page-slug";

type PublicEndpointCandidate = {
  label: string;
  url: string;
};

function trimSlashes(value: string) {
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
}

function apiBaseUrl() {
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL no está configurado. Revisa .env.local.");
  }

  return baseUrl.replace(/\/$/, "");
}

function encodeToken(value: string | undefined) {
  return encodeURIComponent(value ?? "");
}

function uniqueCandidates(candidates: PublicEndpointCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

function isNumericId(value: string | undefined) {
  return !!value && /^\d+$/.test(value.trim());
}

function publicViewIdentity() {
  const legacySlug = env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG?.trim();
  const explicitId = env.NEXT_PUBLIC_PUBLIC_VIEW_ID?.trim();
  const code = env.NEXT_PUBLIC_PUBLIC_VIEW_CODE?.trim();

  // Compatibilidad con el versión anterior: el campo llamado "slug" puede traer el id.
  const id = explicitId || (isNumericId(legacySlug) ? legacySlug : undefined);
  const slug = legacySlug && !isNumericId(legacySlug) ? legacySlug : "inicio";

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
    .replaceAll(":id", encodeToken(identity.id || identity.legacySlug || "1"))
    .replaceAll(":slug", encodeToken(identity.slug || identity.legacySlug || "inicio"))
    .replaceAll(":code", encodeToken(identity.code));
}

function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${trimSlashes(pathOrUrl)}`;
  return `${apiBaseUrl()}${normalizedPath}`;
}

function configuredEndpointCandidate(): PublicEndpointCandidate | undefined {
  const custom = env.NEXT_PUBLIC_PUBLIC_VIEW_ENDPOINT?.trim();
  if (!custom) return undefined;
  return { label: "custom", url: absoluteUrl(resolveTemplate(custom)) };
}

function configuredElementEndpointCandidate(code: string): PublicEndpointCandidate | undefined {
  const custom = env.NEXT_PUBLIC_PUBLIC_VIEW_ELEMENT_ENDPOINT?.trim();
  if (!custom) return undefined;
  return { label: "custom-element", url: absoluteUrl(resolveTemplate(custom.replaceAll(":code", encodeURIComponent(code)))) };
}

export function buildConfiguredPublicViewUrl() {
  return buildConfiguredPublicViewCandidates()[0].url;
}

export function buildConfiguredPublicViewCandidates(): PublicEndpointCandidate[] {
  const identity = publicViewIdentity();
  const mode = normalizeMode();
  const custom = configuredEndpointCandidate();
  const candidates: PublicEndpointCandidate[] = [];

  if (custom) candidates.push(custom);

  if (mode === "page-slug") {
    candidates.push({ label: "page-slug", url: absoluteUrl(resolveTemplate("/api/v1/public/pages/:slug")) });
  } else if (mode === "page-by-id") {
    candidates.push({ label: "page-by-id", url: absoluteUrl(resolveTemplate("/api/v1/public/pages/by-id/:id")) });
  } else if (mode === "auto") {
    if (identity.id) candidates.push({ label: "public-view-id", url: absoluteUrl(resolveTemplate("/api/v1/public-views/:id")) });
    candidates.push({ label: "page-slug", url: absoluteUrl(resolveTemplate("/api/v1/public/pages/:slug")) });
  } else {
    candidates.push({ label: "public-view-id", url: absoluteUrl(resolveTemplate("/api/v1/public-views/:id")) });
  }

  // Fallbacks seguros: protegen despliegues donde el sistema ya migró a CMS por slug
  // o donde el id legacy 1 aún no está disponible. No inventan contenido local.
  if (identity.slug) candidates.push({ label: "fallback-page-slug", url: absoluteUrl(`/api/v1/public/pages/${encodeToken(identity.slug)}`) });
  candidates.push({ label: "fallback-inicio", url: absoluteUrl("/api/v1/public/pages/inicio") });
  candidates.push({ label: "fallback-public-view-1", url: absoluteUrl("/api/v1/public-views/1") });

  return uniqueCandidates(candidates);
}

export function buildConfiguredPublicViewElementUrl(code: string) {
  return buildConfiguredPublicViewElementCandidates(code)[0].url;
}

export function buildConfiguredPublicViewElementCandidates(code: string): PublicEndpointCandidate[] {
  const identity = publicViewIdentity();
  const mode = normalizeMode();
  const custom = configuredElementEndpointCandidate(code);
  const candidates: PublicEndpointCandidate[] = [];

  if (custom) candidates.push(custom);

  if (mode === "page-slug" && !identity.id) {
    candidates.push({ label: "page-slug-element", url: absoluteUrl(resolveTemplate(`/api/v1/public/pages/:slug/elements/${encodeURIComponent(code)}`)) });
  } else {
    candidates.push({ label: "public-view-element", url: absoluteUrl(resolveTemplate(`/api/v1/public-views/:id/elements/${encodeURIComponent(code)}`)) });
  }

  if (identity.slug) candidates.push({ label: "fallback-page-slug-element", url: absoluteUrl(`/api/v1/public/pages/${encodeToken(identity.slug)}/elements/${encodeURIComponent(code)}`) });
  candidates.push({ label: "fallback-inicio-element", url: absoluteUrl(`/api/v1/public/pages/inicio/elements/${encodeURIComponent(code)}`) });
  candidates.push({ label: "fallback-public-view-1-element", url: absoluteUrl(`/api/v1/public-views/1/elements/${encodeURIComponent(code)}`) });

  return uniqueCandidates(candidates);
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
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (error && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (Array.isArray(message)) return message.join(" ");
      if (typeof message === "string" && message.trim()) return message;
    }
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

async function fetchPublicJson(endpoint: string, identity = publicViewIdentity()) {
  const response = await fetch(endpoint, {
    cache: "force-cache",
    headers: {
      Accept: "application/json",
      "x-public-view-slug": identity.legacySlug || identity.slug,
      ...(identity.id ? { "x-public-view-id": identity.id } : {}),
      ...(identity.code ? { "x-public-view-code": identity.code } : {})
    }
  });
  const payload = await readJsonOrText(response);
  return { response, payload };
}

export async function loadConfiguredPublicLanding(): Promise<PublicViewLoadResult> {
  let candidates: PublicEndpointCandidate[];

  try {
    candidates = buildConfiguredPublicViewCandidates();
  } catch (error) {
    return {
      ok: false,
      endpoint: "NEXT_PUBLIC_API_BASE_URL",
      message: error instanceof Error ? error.message : "NEXT_PUBLIC_API_BASE_URL no está configurado.",
      details: error
    };
  }

  const identity = publicViewIdentity();
  let lastFailure: { endpoint: string; status?: number; message: string; details?: unknown } | undefined;

  for (const candidate of candidates) {
    try {
      const { response, payload } = await fetchPublicJson(candidate.url, identity);

      if (!response.ok) {
        lastFailure = {
          endpoint: candidate.url,
          status: response.status,
          message: responseMessage(payload, `No se pudo cargar la página principal. HTTP ${response.status}.`),
          details: payload
        };
        continue;
      }

      const landing = normalizePublicLandingResponse(payload);
      return { ok: true, landing, endpoint: candidate.url };
    } catch (error) {
      lastFailure = {
        endpoint: candidate.url,
        message: error instanceof Error ? error.message : "No se pudo conectar con la página principal.",
        details: error
      };
    }
  }

  return {
    ok: false,
    endpoint: lastFailure?.endpoint ?? candidates[0].url,
    status: lastFailure?.status,
    message: lastFailure?.message ?? "No se pudo cargar la página principal.",
    details: lastFailure?.details
  };
}

export async function loadConfiguredPublicViewElement(code: string): Promise<{ ok: true; endpoint: string; data: unknown } | { ok: false; endpoint: string; status?: number; message: string; details?: unknown }> {
  const candidates = buildConfiguredPublicViewElementCandidates(code);
  let lastFailure: { endpoint: string; status?: number; message: string; details?: unknown } | undefined;

  for (const candidate of candidates) {
    try {
      const { response, payload } = await fetchPublicJson(candidate.url);

      if (!response.ok) {
        lastFailure = {
          endpoint: candidate.url,
          status: response.status,
          message: responseMessage(payload, `No se pudo cargar el contenido público ${code}. HTTP ${response.status}.`),
          details: payload
        };
        continue;
      }

      return { ok: true, endpoint: candidate.url, data: payload };
    } catch (error) {
      lastFailure = {
        endpoint: candidate.url,
        message: error instanceof Error ? error.message : "No se pudo conectar con el contenido público.",
        details: error
      };
    }
  }

  return {
    ok: false,
    endpoint: lastFailure?.endpoint ?? candidates[0].url,
    status: lastFailure?.status,
    message: lastFailure?.message ?? `No se pudo cargar el contenido público solicitado.`,
    details: lastFailure?.details
  };
}
