/*
  Single source of truth for admin session persistence.
  Temp=0: we do NOT guess/extend sessions.
  - If a saved session does not contain expires_at, we treat it as expired.
*/

const KEY = "cm_admin_session";

export function readStoredSession() {
  const raw = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    return null;
  }
}

export function writeStoredSession(session, { remember } = {}) {
  // Clean previous copies to avoid drift
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}

export function isSessionValid(session) {
  if (!session) return false;
  const expiresAt = Number(session.expires_at);
  if (!Number.isFinite(expiresAt)) return false; // strict: no expires_at => invalid
  return Date.now() < expiresAt;
}
