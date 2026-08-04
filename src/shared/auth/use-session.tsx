"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearClientSession, persistClientSession, readClientSession } from "@/shared/auth/cookies";
import type { NormalizedSession } from "@/shared/auth/session";
import { ATTR, BUSINESS_SPANS, rotateTelemetrySessionId, startSpan } from "@/observability";

type SessionContextValue = {
  session: NormalizedSession | null;
  isReady: boolean;
  setSession: (session: NormalizedSession) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<NormalizedSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // readClientSession() lee localStorage; debe ejecutarse solo tras la hidratación
    // para que el primer render del cliente coincida con el HTML generado en el servidor
    // (donde `window` no existe). Mover esto a un lazy initializer de useState causaría
    // un mismatch de hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionState(readClientSession());
    setIsReady(true);
  }, []);

  const setSession = useCallback((nextSession: NormalizedSession) => {
    persistClientSession(nextSession);
    setSessionState(nextSession);
    setIsReady(true);
  }, []);

  const logout = useCallback(() => {
    startSpan(BUSINESS_SPANS.authLogout, {
      [ATTR.feature]: "auth",
      [ATTR.operation]: "logout"
    }).end();

    clearClientSession();
    // El identificador de sesión de telemetría se descarta junto con la sesión real:
    // así las trazas de quien entre después en el mismo navegador no se agrupan con
    // las de quien acaba de salir.
    rotateTelemetrySessionId();

    setSessionState(null);
    setIsReady(true);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isReady,
      setSession,
      logout
    }),
    [isReady, logout, session, setSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession debe usarse dentro de SessionProvider");
  return value;
}
