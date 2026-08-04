import { MAX_ATTRIBUTE_LENGTH, MAX_COUNTER_VALUE } from "@/observability/core/tracing.constants";

/**
 * Redacción de datos sensibles.
 *
 * Es la última línea de defensa: ningún valor llega a un span sin pasar por aquí.
 * El proyecto trata datos de salud mental de personas migrantes, así que el criterio
 * es "ante la duda, se redacta".
 *
 * Ver `docs/observability/frontend/05-data-privacy-policy.md`.
 */

export const REDACTED = "[redacted]";

/**
 * Patrones que invalidan un valor completo. No se intenta "limpiar" la parte buena:
 * si un texto contiene un correo, el texto entero desaparece.
 */
const FORBIDDEN_VALUE_PATTERNS: readonly RegExp[] = [
  // Correo electrónico.
  /[\w.+-]+@[\w-]+\.[\w.-]+/,
  // JWT: tres segmentos base64url separados por puntos, empezando por el header típico.
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/,
  // Portador explícito.
  /\bBearer\s+\S+/i,
  // Teléfono internacional.
  /\+\d[\d\s().-]{7,}/,
  // Secuencias largas de dígitos: tarjetas, cuentas, documentos.
  /\b\d[\d\s-]{11,}\d\b/,
  // Claves en texto plano.
  /\b(password|contrase|token|secret|api[_-]?key|signature)\b\s*[:=]/i,
];

/** Segmentos de ruta que son identificadores y deben colapsarse. */
const IDENTIFIER_SEGMENT_PATTERNS: readonly RegExp[] = [
  // UUID.
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  // Numérico puro.
  /^\d+$/,
  // Hexadecimal largo (ObjectId de Mongo, hashes).
  /^[0-9a-f]{16,}$/i,
  // Cadena larga sin sentido semántico evidente.
  /^[A-Za-z0-9_-]{24,}$/,
];

/** `true` si el texto contiene algo que nunca puede salir del navegador. */
export function containsSensitiveData(value: string): boolean {
  return FORBIDDEN_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Normaliza un texto para usarlo como valor de atributo:
 * redacta si es sensible, recorta espacios y trunca.
 */
export function sanitizeText(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (containsSensitiveData(trimmed)) return REDACTED;
  return trimmed.length > MAX_ATTRIBUTE_LENGTH ? `${trimmed.slice(0, MAX_ATTRIBUTE_LENGTH)}…` : trimmed;
}

/**
 * Deja solo la parte de camino de una URL, sin query string ni fragmento, y colapsa
 * los segmentos que parezcan identificadores.
 *
 * Es la función que impide, entre otras cosas, que el token JWT que el SSE lleva en
 * `?token=…` (`use-admin-notifications.ts`) acabe en una traza.
 */
export function sanitizeUrlPath(value: string): string {
  if (!value) return "";

  let pathname = value;
  try {
    // `base` permite tratar igual rutas relativas y absolutas.
    pathname = new URL(value, "http://placeholder.invalid").pathname;
  } catch {
    const withoutFragment = value.split("#")[0] ?? "";
    pathname = withoutFragment.split("?")[0] ?? "";
  }

  return normalizePathSegments(pathname);
}

/** Sustituye por `:id` cada segmento que parezca un identificador. */
export function normalizePathSegments(pathname: string): string {
  if (!pathname) return "";
  const normalized = pathname
    .split("/")
    .map((segment) =>
      segment !== "" && IDENTIFIER_SEGMENT_PATTERNS.some((pattern) => pattern.test(segment)) ? ":id" : segment,
    )
    .join("/");

  // `trailingSlash: true` hace que casi todas las rutas acaben en "/". Se quita para
  // que `/admin/usuarios` y `/admin/usuarios/` no sean dos plantillas distintas.
  const withoutTrailingSlash = normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
  return withoutTrailingSlash === "" ? "/" : withoutTrailingSlash;
}

/**
 * Solo el origen (`https://api.example.com`) de una URL absoluta. Se usa para
 * `server.address`, donde el host sí es información útil y no sensible.
 */
export function sanitizeHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

/** Acota un contador para que no genere cardinalidad. */
export function boundedCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(Math.trunc(value), MAX_COUNTER_VALUE);
}

/**
 * Mensaje de error listo para exportar.
 *
 * Los mensajes del backend pueden contener el correo de la persona, el nombre de un
 * archivo o texto que ella misma escribió, así que se redactan por completo en cuanto
 * huelen a dato personal, y siempre se truncan.
 */
export function sanitizeErrorMessage(message: unknown): string {
  if (typeof message !== "string") return "";
  return sanitizeText(message.replace(/\s+/g, " "));
}
