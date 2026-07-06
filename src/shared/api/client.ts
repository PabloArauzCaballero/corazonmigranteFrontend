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
        "NEXT_PUBLIC_API_BASE_URL está apuntando a la aplicación frontend. Este proyecto corre por defecto en 4173; configura el backend en otro puerto, por ejemplo NEXT_PUBLIC_API_BASE_URL=http://localhost:3000.",
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

function extractErrorMessage(payload: unknown) {
  const strings = collectStrings(payload);
  const meaningful = strings.find((item) => item && !/^HTTP_\d+$/.test(item) && item !== "Bad Request" && item !== "Unauthorized");

  if (meaningful) return meaningful;

  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = (payload as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }

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

async function parseResponse(response: Response): Promise<ParsedResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => null);
  return { response, payload };
}

async function performRequest(path: string, options: RequestOptions, body: BodyInit | undefined, headers: Headers): Promise<ParsedResponse> {
  const response = await fetch(buildRequestUrl(path), {
    ...options,
    headers,
    body
  });
  return parseResponse(response);
}

function buildBody(body: unknown): BodyInit | undefined {
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  if (body !== undefined) return JSON.stringify(pruneOptionalEmptyValues(body));
  return undefined;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
  let parsed = await performRequest(path, options, requestBody, headers);

  if (!parsed.response.ok && parsed.response.status === 400) {
    const rejected = extractRejectedProperties(parsed.payload);

    if (rejected.length > 0) {
      const method = String(options.method ?? "GET").toUpperCase();

      if (method === "GET" && path.includes("?")) {
        parsed = await performRequest(stripQueryFromPath(path), options, undefined, headers);
      } else if (!isFormData && options.body !== undefined) {
        const cleanedBody = removeRejectedProperties(pruneOptionalEmptyValues(options.body), new Set(rejected));
        requestBody = buildBody(cleanedBody);
        parsed = await performRequest(path, options, requestBody, headers);
      }
    }
  }

  if (!parsed.response.ok) {
    throw new ApiError(extractErrorMessage(parsed.payload), parsed.response.status, parsed.payload);
  }

  return parsed.payload as T;
}
