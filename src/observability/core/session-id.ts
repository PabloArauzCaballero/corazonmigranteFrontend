import { USER_SEGMENT } from "@/observability/core/tracing.constants";

/**
 * Identificador de sesión para diagnóstico.
 *
 * Requisitos de privacidad (`05-data-privacy-policy.md`):
 *  - aleatorio, no derivado de correo, nombre, documento ni del identificador de usuario;
 *  - efímero: vive en `sessionStorage`, así que muere al cerrar la pestaña;
 *  - no reutilizado entre sesiones ni compartido con terceros;
 *  - no sirve para reidentificar a nadie: solo agrupa las trazas de una misma visita.
 *
 * Se usa `sessionStorage` y no `localStorage` a propósito: un identificador
 * persistente sería seguimiento, no diagnóstico.
 */

const STORAGE_KEY = "cm_otel_session";

function randomId(): string {
  // `randomUUID` no existe en contextos no seguros (http:// que no sea localhost).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  // Último recurso: no es criptográficamente fuerte, pero este valor no protege nada.
  return `fallback-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

let memoryFallback: string | undefined;

/** Identificador de la sesión actual. Estable dentro de la pestaña. */
export function telemetrySessionId(): string {
  if (typeof window === "undefined") return "server";

  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const created = randomId();
    window.sessionStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    // Modo privado de Safari, cookies bloqueadas, iframe sin permisos… La telemetría
    // nunca puede romper por esto: se degrada a un identificador en memoria.
    memoryFallback ??= randomId();
    return memoryFallback;
  }
}

/** Descarta el identificador actual. Se llama al cerrar sesión. */
export function rotateTelemetrySessionId() {
  memoryFallback = undefined;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin almacenamiento no hay nada que rotar.
  }
}

export type UserSegment = (typeof USER_SEGMENT)[keyof typeof USER_SEGMENT];

/**
 * Agrupa el rol real en un segmento de baja cardinalidad.
 *
 * `ADMIN`, `SUPER_ADMIN` y `CONTADOR` se funden en `staff` a propósito: el equipo
 * administrativo es pequeño y `CONTADOR` sería prácticamente un identificador
 * personal.
 */
export function userSegmentFromRole(role: string | null | undefined): UserSegment {
  switch (role) {
    case "PACIENTE":
      return USER_SEGMENT.patient;
    case "TERAPEUTA":
      return USER_SEGMENT.professional;
    case "ADMIN":
    case "SUPER_ADMIN":
    case "CONTADOR":
      return USER_SEGMENT.staff;
    default:
      return USER_SEGMENT.anonymous;
  }
}
