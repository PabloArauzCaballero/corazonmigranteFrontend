"use client";

import { useEffect } from "react";
import { setTelemetryRole } from "@/observability/core/tracing.service";
import { useRouteTracing } from "@/observability/react/use-route-tracing";
import { useWebVitals } from "@/observability/react/use-web-vitals";
import { useSession } from "@/shared/auth/use-session";

/**
 * Componente **sin interfaz** que conecta la telemetría con el ciclo de vida de React.
 *
 * No renderiza nada, no envuelve a sus hermanos y no añade ningún nodo al DOM: por eso
 * no puede alterar el diseño ni provocar un desajuste de hidratación. Se monta dentro
 * de `SessionProvider` porque necesita el rol, y por encima del resto de la aplicación
 * porque `useRouteTracing()` debe ver todas las navegaciones.
 *
 * Si la telemetría está apagada, los tres hooks son inertes: `startSpan()` devuelve un
 * span que no graba y `PerformanceObserver` no llega a crearse.
 */
export function TelemetryProvider() {
  const { session } = useSession();

  useRouteTracing();
  useWebVitals();

  useEffect(() => {
    // Solo el rol, del que se deriva un segmento de cuatro valores. Nunca el
    // identificador, el correo ni el nombre. Ver `session-id.ts`.
    setTelemetryRole(session?.role ?? null);
  }, [session?.role]);

  return null;
}
