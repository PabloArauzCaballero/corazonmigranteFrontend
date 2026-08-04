import type { Span } from "@opentelemetry/api";
import { env } from "@/config/env";
import { ApiError } from "@/shared/api/errors";
import { clearClientSession, readClientSession } from "@/shared/auth/cookies";
import {
  ATTR,
  BUSINESS_SPANS,
  TECHNICAL_SPANS,
  apiRouteTemplate,
  runInSpan,
  startSpan
} from "@/observability";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  /**
   * Milisegundos antes de abortar la petición. `0` la deja sin límite.
   * Por defecto `DEFAULT_TIMEOUT_MS`.
   */
  timeoutMs?: number;
};

/**
 * Sin límite de tiempo, un backend que acepta la conexión pero no responde deja la
 * petición viva hasta que el navegador la corte por su cuenta (minutos). React Query
 * no puede rescatar ese caso: seguiría mostrando estado de carga indefinidamente y la
 * persona usuaria no vería ni datos ni error.
 *
 * 30 s es holgado para las operaciones más pesadas del panel (listados con
 * paginación, subida de archivos ya excluida por usar FormData con su propio flujo) y
 * lo bastante corto para que un fallo se manifieste como tal.
 */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Combina la señal de cancelación que llegue del consumidor (React Query cancela las
 * consultas obsoletas) con la del timeout propio. La petición se aborta cuando
 * cualquiera de las dos se dispara.
 *
 * `AbortSignal.any` es lo natural aquí, pero no está disponible en todos los entornos
 * que el proyecto soporta —incluido el jsdom de las pruebas—, así que se compone a
 * mano cuando falta.
 */
function combineSignals(signals: AbortSignal[]): AbortSignal | undefined {
  const active = signals.filter(Boolean);
  if (active.length === 0) return undefined;
  if (active.length === 1) return active[0];

  const anyOf = (AbortSignal as unknown as { any?: (list: AbortSignal[]) => AbortSignal }).any;
  if (typeof anyOf === "function") return anyOf(active);

  const controller = new AbortController();
  for (const signal of active) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

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

/** Credenciales y secretos: nunca deben aparecer en un log, ni en desarrollo. */
const SECRET_KEY_PATTERN = /password|contrasena|contraseña|token|secret|authorization|signature|firma|apikey|api_key/i;

/**
 * Datos personales y clínicos.
 *
 * Este proyecto trata datos de salud de personas migrantes. `logs/api-requests.log`
 * solo se escribe en desarrollo, pero quien desarrolle apuntando a un backend con
 * datos reales acumularía historiales de pacientes en un archivo local sin cifrar.
 * Redactar por nombre de clave no es infalible —el backend podría llamar `campo7` a
 * un diagnóstico— pero cubre la forma en que el contrato real nombra estos campos.
 *
 * El log conserva su utilidad: estructura de la petición, claves presentes, códigos
 * de estado y tiempos siguen visibles. Lo único que se sustituye es el VALOR.
 */
const PERSONAL_KEY_PATTERN =
  /email|correo|phone|telefono|teléfono|celular|whatsapp|address|direccion|dirección|dni|nif|nie|passport|pasaporte|documento|birth|nacimiento|edad|nombre|apellido|name|fullname|avatar|foto|photo|symptom|sintoma|síntoma|diagnos|tratamiento|therapy_goal|objetivo|motivo|nota|note|observacion|observación|comentario|mensaje|message/i;

function sanitizeForLog(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
      if (SECRET_KEY_PATTERN.test(key)) return [key, "[redacted]"];
      if (PERSONAL_KEY_PATTERN.test(key)) return [key, "[dato personal omitido]"];
      return [key, sanitizeForLog(nested)];
    })
  );
}

function truncateForLog(value: unknown, maxLength = 4000) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (text === undefined) return undefined;
  return text.length > maxLength ? `${text.slice(0, maxLength)}…[truncado]` : text;
}

/**
 * Envía cada request/response al backend hacia /api/debug-log para dejar rastro en
 * logs/api-requests.log durante desarrollo local. Este proyecto se despliega con
 * `output: "export"` (HTML estático en Cloudflare Pages), donde /api/debug-log no
 * existe en absoluto (sin servidor Next.js), así que en producción ni se intenta:
 * de lo contrario el navegador reporta 405 en la consola en cada llamada a la API.
 */
function logApiCall(entry: { method: string; url: string; status?: number; ok?: boolean; requestBody?: unknown; responseBody?: unknown; durationMs: number; error?: string }) {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
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

/**
 * Un 401 en una petición autenticada significa que el token guardado ya no sirve
 * (expiró o el backend lo rechaza). El ClientRoleGuard solo comprueba el rol de la
 * sesión, no la vigencia del token, así que sin esto el usuario queda atrapado en una
 * pantalla que dispara 401 en bucle. Limpiamos la sesión caduca y lo devolvemos al
 * login correspondiente para que vuelva a autenticarse.
 */
function handleUnauthorizedSession() {
  if (typeof window === "undefined") return;

  // Span de negocio: "la sesión murió y se echó a la persona al login". Es distinto de
  // un 401 cualquiera y es de las cosas que más se investigan cuando alguien reporta
  // que "se sale solo". No lleva ningún dato de la sesión, solo el hecho.
  startSpan(BUSINESS_SPANS.authSessionExpired, {
    [ATTR.feature]: "auth",
    [ATTR.operation]: "session-expired"
  }).end();

  clearClientSession();
  const currentPath = window.location.pathname;
  const loginPath = currentPath.startsWith("/admin") ? "/admin/login" : "/login";
  if (currentPath !== loginPath) {
    // Se conserva el destino para volver ahí tras reautenticarse, igual que el guard.
    window.location.replace(`${loginPath}?next=${encodeURIComponent(currentPath)}`);
  }
}

async function parseResponse(response: Response): Promise<ParsedResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => null);
  return { response, payload };
}

async function performRequest(path: string, options: RequestOptions, body: BodyInit | undefined, headers: Headers): Promise<ParsedResponse> {
  const url = buildRequestUrl(path);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // El controlador del timeout es propio; la señal del consumidor (si la hay) se
  // respeta igualmente. Se limpia siempre en `finally` para no dejar temporizadores
  // vivos tras una respuesta rápida.
  const timeoutController = timeoutMs > 0 ? new AbortController() : null;
  const timer = timeoutController ? setTimeout(() => timeoutController.abort(), timeoutMs) : null;

  const signal = combineSignals([
    ...(options.signal ? [options.signal] : []),
    ...(timeoutController ? [timeoutController.signal] : [])
  ]);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body,
      signal
    });
    return parseResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Se distinguen tres finales distintos porque exigen reacciones distintas:
    // que la cancele el consumidor es normal (React Query descartando una consulta
    // obsoleta) y no debe presentarse como un fallo del servidor.
    if (options.signal?.aborted) {
      throw new ApiError("La petición se canceló.", 0, { url, method: options.method ?? "GET", cancelled: true });
    }
    if (timeoutController?.signal.aborted) {
      throw new ApiError(
        `El servidor no respondió a tiempo (${Math.round(timeoutMs / 1000)} s). Inténtalo de nuevo.`,
        0,
        { url, method: options.method ?? "GET", timeout: true }
      );
    }

    throw new ApiError(
      `No se pudo conectar con el servidor (${url}). Detalle: ${message}`,
      0,
      { url, method: options.method ?? "GET", originalError: message }
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function buildBody(body: unknown): BodyInit | undefined {
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  if (body !== undefined) return JSON.stringify(pruneOptionalEmptyValues(body));
  return undefined;
}

/**
 * Envoltura de trazabilidad de `apiRequest`.
 *
 * El span `http.client` es el **padre de negocio** de la petición; el span de red lo
 * crea `FetchInstrumentation` como hijo, así que no hay duplicación: uno mide "la
 * llamada a la API tal y como la ve la aplicación" (incluyendo el reintento que hace
 * `executeRequest` ante un 400 con propiedades rechazadas) y el otro mide el viaje HTTP.
 *
 * Solo se registran método, plantilla de ruta, host y código de respuesta. Nunca el
 * cuerpo, ni las cabeceras, ni la query string: `apiRouteTemplate()` la descarta y el
 * `SanitizingSpanProcessor` vuelve a comprobarlo antes de exportar.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = String(options.method ?? "GET").toUpperCase();

  return runInSpan(
    TECHNICAL_SPANS.httpClient,
    {
      "http.request.method": method,
      [ATTR.routeTemplate]: apiRouteTemplate(path),
      [ATTR.networkRequestType]: "api"
    },
    async (span) => {
      try {
        return await executeRequest<T>(path, options, method, span);
      } catch (error) {
        // El código de estado es el dato más útil para diagnosticar y no revela nada:
        // el mensaje del backend sí podría (puede citar un correo o un archivo).
        if (error instanceof ApiError) {
          span.setAttribute("http.response.status_code", error.status);
        }
        throw error;
      }
    }
  );
}

async function executeRequest<T>(path: string, options: RequestOptions, method: string, span: Span): Promise<T> {
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
      // Este reintento es una compatibilidad con validaciones estrictas del backend.
      // Hacerlo visible importa: una petición que "tarda el doble" sin explicación
      // suele ser esto. Se registra el número de reintentos, nunca qué propiedades
      // se quitaron (son nombres de campos del formulario).
      if (method === "GET" && path.includes("?")) {
        span.setAttribute(ATTR.retryCount, 1);
        parsed = await performRequest(stripQueryFromPath(path), options, undefined, headers);
      } else if (!isFormData && options.body !== undefined) {
        span.setAttribute(ATTR.retryCount, 1);
        const cleanedBody = removeRejectedProperties(pruneOptionalEmptyValues(options.body), new Set(rejected));
        requestBody = buildBody(cleanedBody);
        parsed = await performRequest(path, options, requestBody, headers);
      }
    }
  }

  span.setAttribute("http.response.status_code", parsed.response.status);

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
    if (parsed.response.status === 401 && options.auth !== false) {
      handleUnauthorizedSession();
    }
    throw new ApiError(extractErrorMessage(parsed.payload), parsed.response.status, parsed.payload);
  }

  return parsed.payload as T;
}
