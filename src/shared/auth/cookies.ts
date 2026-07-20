import type { UserRole } from "@/shared/auth/roles";
import type { NormalizedSession } from "@/shared/auth/session";

const SESSION_COOKIE = "cm_session";
const ROLE_COOKIE = "cm_session_role";

export function persistClientSession(session: NormalizedSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_COOKIE, JSON.stringify(session));
  document.cookie = `${ROLE_COOKIE}=${session.role}; path=/; SameSite=Lax`;
}

export function readClientSession(): NormalizedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_COOKIE);
    return raw ? (JSON.parse(raw) as NormalizedSession) : null;
  } catch {
    return null;
  }
}

export function clearClientSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_COOKIE);
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function roleFromCookie(value?: string): UserRole | undefined {
  const role = value?.toUpperCase();
  if (role === "PACIENTE" || role === "TERAPEUTA" || role === "ADMIN" || role === "SUPER_ADMIN" || role === "CONTADOR") {
    return role;
  }
  return undefined;
}
