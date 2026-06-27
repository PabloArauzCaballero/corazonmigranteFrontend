"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearClientSession, persistClientSession, readClientSession } from "@/shared/auth/cookies";
import type { NormalizedSession } from "@/shared/auth/session";

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
    setSessionState(readClientSession());
    setIsReady(true);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isReady,
      setSession(nextSession) {
        persistClientSession(nextSession);
        setSessionState(nextSession);
      },
      logout() {
        clearClientSession();
        setSessionState(null);
      }
    }),
    [isReady, session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession debe usarse dentro de SessionProvider");
  return value;
}
