import { env } from "@/config/env";
import { normalizePublicLandingResponse } from "@/features/public-view/public-view.normalizer";
import type { PublicViewLoadResult } from "@/features/public-view/public-view.types";

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
    throw new Error("NEXT_PUBLIC_API_BASE_URL no esta configurado. Revisa .env.local.");
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

function publicViewIdentity() {
  const slug = env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG.trim() || "inicio";
  const code = env.NEXT_PUBLIC_PUBLIC_VIEW_CODE?.trim();

  return { slug, code };
}

function resolveTemplate(template: string) {
  const identity = publicViewIdentity();
  return template
    .replaceAll(":slug", encodeToken(identity.slug))
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
  const custom = configuredEndpointCandidate();
  const candidates: PublicEndpointCandidate[] = [];

  if (custom) candidates.push(custom);
  candidates.push({ label: "public-page-slug", url: absoluteUrl(resolveTemplate("/api/v1/public/pages/:slug")) });

  return uniqueCandidates(candidates);
}

export function buildConfiguredPublicViewElementUrl(code: string) {
  return buildConfiguredPublicViewElementCandidates(code)[0].url;
}

export function buildConfiguredPublicViewElementCandidates(code: string): PublicEndpointCandidate[] {
  const custom = configuredElementEndpointCandidate(code);
  const candidates: PublicEndpointCandidate[] = [];

  if (custom) candidates.push(custom);
  candidates.push({ label: "public-page-element", url: absoluteUrl(resolveTemplate(`/api/v1/public/pages/:slug/elements/${encodeURIComponent(code)}`)) });

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
  const isBrowser = typeof window !== "undefined";
  const response = await fetch(endpoint, {
    cache: isBrowser ? "no-store" : "force-cache",
    headers: {
      Accept: "application/json",
      ...(!isBrowser
        ? {
            ...(identity.slug ? { "x-public-page-slug": identity.slug } : {}),
            ...(identity.code ? { "x-public-view-code": identity.code } : {})
          }
        : {})
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
      message: error instanceof Error ? error.message : "NEXT_PUBLIC_API_BASE_URL no esta configurado.",
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
          message: responseMessage(payload, `No se pudo cargar la pagina principal. HTTP ${response.status}.`),
          details: payload
        };
        continue;
      }

      const landing = normalizePublicLandingResponse(payload);
      return { ok: true, landing, endpoint: candidate.url };
    } catch (error) {
      lastFailure = {
        endpoint: candidate.url,
        message: error instanceof Error ? error.message : "No se pudo conectar con la pagina principal.",
        details: error
      };
    }
  }

  return {
    ok: false,
    endpoint: lastFailure?.endpoint ?? candidates[0].url,
    status: lastFailure?.status,
    message: lastFailure?.message ?? "No se pudo cargar la pagina principal.",
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
          message: responseMessage(payload, `No se pudo cargar el contenido publico ${code}. HTTP ${response.status}.`),
          details: payload
        };
        continue;
      }

      return { ok: true, endpoint: candidate.url, data: payload };
    } catch (error) {
      lastFailure = {
        endpoint: candidate.url,
        message: error instanceof Error ? error.message : "No se pudo conectar con el contenido publico.",
        details: error
      };
    }
  }

  return {
    ok: false,
    endpoint: lastFailure?.endpoint ?? candidates[0].url,
    status: lastFailure?.status,
    message: lastFailure?.message ?? "No se pudo cargar el contenido publico solicitado.",
    details: lastFailure?.details
  };
}
