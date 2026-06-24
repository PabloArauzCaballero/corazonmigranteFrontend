import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clearStoredSession, isSessionValid, readStoredSession, writeStoredSession } from "./sessionStorage";

const SessionCtx = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const lastValidateRef = useRef(0);

  // Load persisted session once
  useEffect(() => {
    const s = readStoredSession();
    if (isSessionValid(s)) {
      setSession(s);
    } else if (s) {
      // Strict: if invalid (including missing expires_at), clear
      clearStoredSession();
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  const login = useCallback((sessionPayload, { remember } = {}) => {
    setSession(sessionPayload);
    writeStoredSession(sessionPayload, { remember });
  }, []);

  // Validation helper (throttled) - can be called on route changes
  const validateNow = useCallback(() => {
    const now = Date.now();
    if (now - lastValidateRef.current < 500) return true;
    lastValidateRef.current = now;

    const current = session || readStoredSession();
    if (!isSessionValid(current)) {
      logout();
      return false;
    }
    return true;
  }, [logout, session]);

  // Auto logout when expiration time is reached
  useEffect(() => {
    if (!session) return;
    const expiresAt = Number(session.expires_at);
    if (!Number.isFinite(expiresAt)) return;

    const ms = Math.max(0, expiresAt - Date.now());
    const t = setTimeout(() => {
      logout();
    }, ms);
    return () => clearTimeout(t);
  }, [logout, session]);

  const value = useMemo(
    () => ({ session, setSession, login, logout, validateNow }),
    [session, login, logout, validateNow]
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
