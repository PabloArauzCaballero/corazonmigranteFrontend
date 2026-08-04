"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { Span } from "@opentelemetry/api";
import { routeTemplateFromPath } from "@/observability/core/route-template";
import { startSpan } from "@/observability/core/tracing.service";
import { ATTR, NAVIGATION_TYPE, TECHNICAL_SPANS } from "@/observability/core/tracing.constants";

/**
 * Spans de navegación SPA (Fase 9).
 *
 * Se apoya en `usePathname()` y no en internos del router: en `output: "export"` no
 * hay API pública para pedirle la plantilla de ruta, y depender de internos rompería
 * en cada actualización menor de Next.
 *
 * Reglas cumplidas:
 *  - **un span por navegación**, no por render: el efecto solo actúa cuando el
 *    pathname cambia de verdad;
 *  - **no se abre span en el montaje inicial**: esa carga ya la mide `documentLoad`;
 *  - el span se cierra cuando la ruta está pintada, no cuando React monta;
 *  - ningún span queda abierto: hay un cierre de seguridad a los 10 s.
 *
 * Las query strings no participan: `routeTemplateFromPath()` las descarta, así que
 * cambiar `?id=` no genera una navegación falsa.
 */

/** Cierre forzoso: si algo se atasca, el span no puede quedarse abierto para siempre. */
const MAX_NAVIGATION_MS = 10_000;

/**
 * Cierra el span cuando el navegador ha pintado la ruta nueva.
 *
 * Dos `requestAnimationFrame` encadenados: el primero se ejecuta antes del pintado
 * del frame actual, el segundo ya después. Es la aproximación estándar a "la pantalla
 * es utilizable" sin instrumentar cada componente.
 */
function endSpanAfterPaint(span: Span): () => void {
  let cancelled = false;

  const timeout = window.setTimeout(() => {
    if (cancelled) return;
    cancelled = true;
    span.setAttribute(ATTR.uiResult, "error");
    span.end();
  }, MAX_NAVIGATION_MS);

  const outer = window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (cancelled) return;
      cancelled = true;
      window.clearTimeout(timeout);
      span.setAttribute(ATTR.uiResult, "success");
      span.end();
    });
  });

  return () => {
    if (cancelled) return;
    cancelled = true;
    window.clearTimeout(timeout);
    window.cancelAnimationFrame(outer);
    // Navegación abandonada a mitad (se pulsó otro enlace antes de terminar).
    span.setAttribute(ATTR.uiResult, "cancelled");
    span.end();
  };
}

export function useRouteTracing() {
  const pathname = usePathname();
  /**
   * Ruta anterior y bandera de "vengo de atrás/adelante" viven en la MISMA referencia
   * y se leen y escriben dentro de un único efecto. Sacar la bandera a un hook propio
   * incumpliría `react-hooks/immutability`: un valor devuelto por un hook no puede
   * mutarse desde fuera del hook que lo construye.
   */
  const navigationRef = useRef<{ previousTemplate: string | null; cameFromHistory: boolean }>({
    previousTemplate: null,
    cameFromHistory: false,
  });

  useEffect(() => {
    const state = navigationRef.current;
    const onPopState = () => {
      state.cameFromHistory = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const state = navigationRef.current;
    const template = routeTemplateFromPath(pathname);
    const from = state.previousTemplate;
    state.previousTemplate = template;

    // Primer montaje: la carga inicial ya la cubre `documentLoad`. Duplicarla sería
    // contar dos veces la misma cosa.
    if (from === null || from === template) return;

    const navigationType = state.cameFromHistory ? NAVIGATION_TYPE.backForward : NAVIGATION_TYPE.spa;
    state.cameFromHistory = false;

    const span = startSpan(TECHNICAL_SPANS.routeNavigation, {
      [ATTR.routeFrom]: from,
      [ATTR.routeTo]: template,
      [ATTR.routeTemplate]: template,
      [ATTR.uiNavigationType]: navigationType,
    });

    return endSpanAfterPaint(span);
  }, [pathname]);
}
