"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionProvider } from "@/shared/auth/use-session";
import { GlobalLoadingBar } from "@/shared/ui/global-loading-bar";
import { ToastProvider } from "@/shared/ui/toast";
import { ConfirmProvider } from "@/shared/ui/confirm-dialog";
import { TutorialProvider } from "@/features/tutorial/ui/tutorial-provider";
import { TelemetryProvider } from "@/observability";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000
          }
        }
      })
  );

  return (
    // El tema NO aparece aquí a propósito: vive en el DOM (clase `dark` en <html>,
    // puesta por el script del <head> antes de hidratar) y se lee con `useTheme()`
    // vía useSyncExternalStore. Un Provider solo añadiría un contexto que ningún
    // dato necesita y volvería a montar el árbol en cada cambio de tema.
    <QueryClientProvider client={queryClient}>
        <SessionProvider>
          {/* No renderiza nada: solo conecta la telemetría al ciclo de vida de React
              (navegación SPA, Web Vitals y segmento de usuario). Va dentro de
              SessionProvider porque necesita el rol, y antes que el resto para no
              perderse ninguna navegación. Con la telemetría apagada es inerte. */}
          <TelemetryProvider />
          <GlobalLoadingBar />
          <ToastProvider>
            <ConfirmProvider>
              {/* El motor de tutoriales se monta una sola vez para toda la aplicación:
                  necesita la sesión (filtra por rol) y monta el recorrido por encima de
                  cualquier pantalla. */}
              <TutorialProvider>{children}</TutorialProvider>
            </ConfirmProvider>
          </ToastProvider>
        </SessionProvider>
    </QueryClientProvider>
  );
}
