import type { Attributes, AttributeValue } from "@opentelemetry/api";
import { boundedCount, sanitizeText } from "@/observability/core/sanitize";
import {
  ALLOWED_ATTRIBUTE_KEYS,
  AUTH_FAILURE_CATEGORY,
  FILE_SIZE_BUCKETS,
} from "@/observability/core/tracing.constants";

/**
 * Construcción y saneado de atributos.
 *
 * `safeAttributes()` es el único camino por el que un atributo llega a un span:
 *  1. descarta cualquier clave que no esté en la lista blanca,
 *  2. sanea el valor (redacta correos, JWT, teléfonos… y trunca),
 *  3. acota los contadores.
 *
 * Una clave desconocida se descarta en silencio en producción y avisa en desarrollo:
 * así un atributo añadido por descuido no llega nunca a Jaeger, pero quien lo escribe
 * se entera mientras desarrolla.
 */

const COUNTER_KEYS: ReadonlySet<string> = new Set(["validation.error.count", "retry.count"]);

function sanitizeValue(key: string, value: AttributeValue): AttributeValue | undefined {
  if (typeof value === "string") {
    const sanitized = sanitizeText(value);
    return sanitized === "" ? undefined : sanitized;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    return COUNTER_KEYS.has(key) ? boundedCount(value) : value;
  }

  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    // Los arrays se permiten solo si son homogéneos y cortos; en la práctica no se
    // usan, pero se sanea cada elemento por si acaso.
    const items = value.slice(0, 10).map((item) => (typeof item === "string" ? sanitizeText(item) : item));
    return items as AttributeValue;
  }

  return undefined;
}

export function safeAttributes(input: Attributes | undefined): Attributes {
  if (!input) return {};

  const output: Attributes = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;

    if (!ALLOWED_ATTRIBUTE_KEYS.has(key)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[telemetry] atributo no permitido descartado: "${key}". Añádelo a ATTR y a 02-naming-conventions.md.`);
      }
      continue;
    }

    const sanitized = sanitizeValue(key, value);
    if (sanitized !== undefined) output[key] = sanitized;
  }

  return output;
}

/**
 * Bucket de tamaño de archivo. Nunca el tamaño exacto: combinado con la hora, un
 * número de bytes puede identificar un documento concreto.
 */
export function fileSizeBucket(bytes: number): (typeof FILE_SIZE_BUCKETS)[number] {
  const mb = bytes / (1024 * 1024);
  if (mb <= 1) return FILE_SIZE_BUCKETS[0];
  if (mb <= 5) return FILE_SIZE_BUCKETS[1];
  if (mb <= 20) return FILE_SIZE_BUCKETS[2];
  if (mb <= 100) return FILE_SIZE_BUCKETS[3];
  return FILE_SIZE_BUCKETS[4];
}

/** Extensión en minúsculas, sin el nombre del archivo. Devuelve `""` si no la hay. */
export function fileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  if (index < 0 || index === fileName.length - 1) return "";
  const extension = fileName.slice(index + 1).toLowerCase();
  // Una "extensión" larga no es una extensión: probablemente sea parte del nombre.
  return /^[a-z0-9]{1,6}$/.test(extension) ? extension : "";
}

/** Familia del tipo MIME (`image`, `application`, …), sin el subtipo. */
export function fileTypeFamily(mimeType: string): string {
  const family = mimeType.split("/")[0]?.trim().toLowerCase() ?? "";
  return /^[a-z]{1,20}$/.test(family) ? family : "unknown";
}

export type AuthFailureCategory = (typeof AUTH_FAILURE_CATEGORY)[keyof typeof AUTH_FAILURE_CATEGORY];

/**
 * Categoría normalizada de fallo de autenticación a partir del código HTTP.
 *
 * **Regla antienumeración:** un correo que no existe y una contraseña incorrecta
 * producen exactamente `invalid_credentials`. La telemetría no puede permitir
 * distinguir si una cuenta existe.
 */
export function authFailureCategory(status: number | undefined): AuthFailureCategory {
  if (status === undefined) return AUTH_FAILURE_CATEGORY.unknown;
  if (status === 0) return AUTH_FAILURE_CATEGORY.networkError;
  if (status === 400 || status === 422) return AUTH_FAILURE_CATEGORY.validationError;
  if (status === 401 || status === 403 || status === 404) return AUTH_FAILURE_CATEGORY.invalidCredentials;
  if (status === 429) return AUTH_FAILURE_CATEGORY.rateLimited;
  if (status >= 500) return AUTH_FAILURE_CATEGORY.serverError;
  return AUTH_FAILURE_CATEGORY.unknown;
}
