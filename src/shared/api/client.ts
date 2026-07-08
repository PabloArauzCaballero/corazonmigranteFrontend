import { env } from "@/config/env";
import { ApiError } from "@/shared/api/errors";
import { readClientSession } from "@/shared/auth/cookies";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

type ParsedResponse = {
  response: Response;
  payload: unknown;
};

const API_PREFIX_PATTERN = /\/(api\/v1|api)$/i;

function apiBaseUrl() {
  if (!env.NEXT_PUBLIC_API_BASE_URL) {
    throw new ApiError("NEXT_PUBLIC_API_BASE_URL no está configurado. Revisa .env.local.", 500);
  }

  let baseUrl = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, "");

  // El frontend ya define los endpoints con /api/v1. Si alguien deja la variable
  // como http://localhost:3000/api/v1 o https://dominio.com/api, evitamos rutas
  // dobles como /api/v1/api/v1/auth/login.
  baseUrl = baseUrl.replace(API_PREFIX_PATTERN, "");

  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const currentOrigin = window.location.origin.replace(/\/+$/, "");
    const isLocalFrontendOrigin = currentOrigin === baseUrl && /localhost|127\.0\.0\.1/.test(window.location.hostname);

    if (isLocalFrontendOrigin) {
      throw new ApiError(
        "NEXT_PUBLIC_API_BASE_URL está apuntando a la aplicación frontend. Este proyecto corre por defecto en 4173; configura el servidor en otro puerto, por ejemplo NEXT_PUBLIC_API_BASE_URL=http://localhost:3000.",
        500
      );
    }
  }

  return baseUrl;
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildRequestUrl(path: string) {
  const baseUrl = apiBaseUrl();
  const normalizedPath = normalizePath(path);
  return `${baseUrl}${normalizedPath}`;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (typeof value === "object" && value !== null) return Object.values(value as Record<string, unknown>).flatMap(collectStrings);
  return [];
}

function messageFromRecord(record: Record<string, unknown>): string | undefined {
  const direct = record.message;
  if (Array.isArray(direct)) return direct.join(" ");
  if (typeof direct === "string" && direct.trim()) return direct;

  const nestedError = record.error;
  if (typeof nestedError === "object" && nestedError !== null) {
    return messageFromRecord(nestedError as Record<string, unknown>);
  }

  return undefined;
}

function extractErrorMessage(payload: unknown) {
  if (typeof payload === "object" && payload !== null) {
    const explicit = messageFromRecord(payload as Record<string, unknown>);
    if (explicit) return explicit;
  }

  const strings = collectStrings(payload);
  const meaningful = strings.find((item) => item && !/^HTTP_\d+$/.test(item) && !/^[A-Z0-9_]+$/.test(item) && item !== "Bad Request" && item !== "Unauthorized");

  if (meaningful) return meaningful;

  return "Error de comunicación con el servidor";
}

function extractRejectedProperties(payload: unknown) {
  const matches = new Set<string>();
  for (const text of collectStrings(payload)) {
    for (const match of text.matchAll(/property\s+([A-Za-z0-9_.$-]+)\s+should\s+not\s+exist/gi)) {
      if (match[1]) matches.add(match[1]);
    }
  }
  return [...matches];
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof FormData) && !(value instanceof Date);
}

function removeRejectedProperties(value: unknown, rejected: Set<string>): unknown {
  if (Array.isArray(value)) return value.map((item) => removeRejectedProperties(item, rejected));
  if (!isPlainRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !rejected.has(key))
      .map(([key, nested]) => [key, removeRejectedProperties(nested, rejected)])
  );
}

function pruneOptionalEmptyValues(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(pruneOptionalEmptyValues);
  if (!isPlainRecord(value)) return value;

  const optionalEmptyPattern = /(Id|Ids|At|Date|Until|From|To|Url|FileId|ObjectKey)$/;
  const entries = Object.entries(value).flatMap(([key, nested]) => {
    if (nested === undefined || nested === null) return [];
    if (typeof nested === "string" && nested.trim() === "" && optionalEmptyPattern.test(key)) return [];
    return [[key, pruneOptionalEmptyValues(nested)] as const];
  });

  return Object.fromEntries(entries);
}

function stripQueryFromPath(path: string) {
  const index = path.indexOf("?");
  return index >= 0 ? path.slice(0, index) : path;
}

const SENSITIVE_KEY_PATTERN = /password|token|secret|authorization/i;

function sanitizeForLog(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeForLog(nested)])
  );
}

function truncateForLog(value: unknown, maxLength = 4000) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (text === undefined) return undefined;
  return text.length > maxLength ? `${text.slice(0, maxLength)}…[truncado]` : text;
}

/**
 * Envía cada request/response al backend hacia /api/debug-log para dejar rastro en
 * logs/api-requests.log. Nunca debe interrumpir el flujo principal: cualquier fallo
 * (offline, ruta no disponible en build de producción) se ignora en silencio.
 */
function logApiCall(entry: { method: string; url: string; status?: number; ok?: boolean; requestBody?: unknown; responseBody?: unknown; durationMs: number; error?: string }) {
  if (typeof window === "undefined" || process.env.NODE_ENV === "test") return;
  try {
    void fetch("/api/debug-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: entry.method,
        url: entry.url,
        status: entry.status,
        ok: entry.ok,
        durationMs: entry.durationMs,
        request: truncateForLog(sanitizeForLog(entry.requestBody)),
        response: truncateForLog(sanitizeForLog(entry.responseBody)),
        error: entry.error
      })
    }).catch(() => {});
  } catch {
    // el logging nunca debe romper la app
  }
}

async function parseResponse(response: Response): Promise<ParsedResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => null);
  return { response, payload };
}

async function performRequest(path: string, options: RequestOptions, body: BodyInit | undefined, headers: Headers): Promise<ParsedResponse> {
  const url = buildRequestUrl(path);
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body
    });
    return parseResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ApiError(
      `No se pudo conectar con el servidor (${url}). Detalle: ${message}`,
      0,
      { url, method: options.method ?? "GET", originalError: message }
    );
  }
}

function buildBody(body: unknown): BodyInit | undefined {
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  if (body !== undefined) return JSON.stringify(pruneOptionalEmptyValues(body));
  return undefined;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = String(options.method ?? "GET").toUpperCase();
  const url = buildRequestUrl(path);
  const startedAt = Date.now();
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && typeof window !== "undefined") {
    const session = readClientSession();
    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
  }

  let requestBody = buildBody(options.body);
  let parsed: ParsedResponse;

  try {
    parsed = await performRequest(path, options, requestBody, headers);
  } catch (error) {
    logApiCall({ method, url, requestBody: options.body, durationMs: Date.now() - startedAt, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }

  if (!parsed.response.ok && parsed.response.status === 400) {
    const rejected = extractRejectedProperties(parsed.payload);

    if (rejected.length > 0) {
      if (method === "GET" && path.includes("?")) {
        parsed = await performRequest(stripQueryFromPath(path), options, undefined, headers);
      } else if (!isFormData && options.body !== undefined) {
        const cleanedBody = removeRejectedProperties(pruneOptionalEmptyValues(options.body), new Set(rejected));
        requestBody = buildBody(cleanedBody);
        parsed = await performRequest(path, options, requestBody, headers);
      }
    }
  }

  logApiCall({
    method,
    url,
    status: parsed.response.status,
    ok: parsed.response.ok,
    requestBody: options.body,
    responseBody: parsed.payload,
    durationMs: Date.now() - startedAt
  });

  if (!parsed.response.ok) {
    throw new ApiError(extractErrorMessage(parsed.payload), parsed.response.status, parsed.payload);
  }

  return parsed.payload as T;
}
