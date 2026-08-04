import type { UserRole } from "@/shared/auth/roles";
import type { NormalizedSession } from "@/shared/auth/session";

const SESSION_COOKIE = "cm_session";
const ROLE_COOKIE = "cm_session_role";

/**
 * Margen de seguridad al comparar la expiración del token: si le quedan menos de
 * 15 segundos se trata como caducado, para no lanzar una petición que el backend va
 * a rechazar con 401 justo en el borde.
 */
const EXPIRY_SKEW_MS = 15_000;

/**
 * Lee la marca `exp` de un JWT SIN validar la firma.
 *
 * No es una comprobación de seguridad — quien valida el token es el backend. Sirve
 * solo para que el frontend deje de considerar válida una sesión ya expirada y mande
 * a la persona al login, en vez de dejarla en una pantalla que dispara 401 en bucle.
 * Devuelve `null` si el token no es un JWT legible.
 */
function readTokenExpiry(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const claims = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof claims.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** `true` si el token ya caducó según su propia marca `exp`. */
export function isSessionExpired(session: NormalizedSession | null): boolean {
  if (!session?.token) return false;
  const expiresAt = readTokenExpiry(session.token);
  if (expiresAt === null) return false;
  return Date.now() + EXPIRY_SKEW_MS >= expiresAt;
}

/**
 * En HTTPS la cookie de rol se marca `Secure` para que no viaje por una conexión sin
 * cifrar. En `http://localhost` no se puede: el navegador descartaría la cookie y el
 * desarrollo local quedaría sin sesión.
 */
function roleCookieAttributes() {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  return `path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function persistClientSession(session: NormalizedSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_COOKIE, JSON.stringify(session));
  document.cookie = `${ROLE_COOKIE}=${session.role}; ${roleCookieAttributes()}`;
}

export function readClientSession(): NormalizedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_COOKIE);
    if (!raw) return null;
    const session = JSON.parse(raw) as NormalizedSession;
    // Una sesión caducada se descarta al leerla: así no queda un token muerto en
    // localStorage ni se envía en las siguientes peticiones.
    if (isSessionExpired(session)) {
      clearClientSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearClientSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_COOKIE);
  document.cookie = `${ROLE_COOKIE}=; max-age=0; ${roleCookieAttributes()}`;
}

export function roleFromCookie(value?: string): UserRole | undefined {
  const role = value?.toUpperCase();
  if (role === "PACIENTE" || role === "TERAPEUTA" || role === "ADMIN" || role === "SUPER_ADMIN" || role === "CONTADOR") {
    return role;
  }
  return undefined;
}
