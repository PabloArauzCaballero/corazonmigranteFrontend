"use client";

import { useEffect } from "react";
import { currentRouteTemplate } from "@/observability/core/route-template";
import { startSpan } from "@/observability/core/tracing.service";
import { ATTR, TECHNICAL_SPANS } from "@/observability/core/tracing.constants";

/**
 * Web Vitals (Fase 22).
 *
 * Jaeger es un almacén de trazas, no de métricas. La decisión, argumentada en
 * `04-web-vitals-strategy.md`, es:
 *
 *  - **un único span** `ui.interaction` por métrica, con nombre fijo y tres atributos
 *    de baja cardinalidad. No un span por cada *layout shift*, ni por cada entrada de
 *    rendimiento;
 *  - se usa `PerformanceObserver` nativo: añadir la librería `web-vitals` costaría
 *    ~2 kB de bundle para reimplementar lo que el navegador ya expone;
 *  - **no se capturan selectores CSS ni elementos del DOM**, aunque la API los ofrezca
 *    (`LargestContentfulPaint.element`, `LayoutShiftAttribution`): identificarían
 *    contenido concreto de la pantalla.
 */

type VitalRating = "good" | "needs-improvement" | "poor";

/** Umbrales oficiales de Google (2024). */
const THRESHOLDS: Record<string, readonly [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

function rate(name: string, value: number): VitalRating {
  const threshold = THRESHOLDS[name];
  if (!threshold) return "good";
  if (value <= threshold[0]) return "good";
  if (value <= threshold[1]) return "needs-improvement";
  return "poor";
}

function emit(name: string, value: number) {
  if (!Number.isFinite(value) || value < 0) return;

  // CLS es adimensional y pequeño; el resto son milisegundos. Se redondea para no
  // exportar decimales sin significado.
  const rounded = name === "CLS" ? Math.round(value * 1000) / 1000 : Math.round(value);

  const span = startSpan(TECHNICAL_SPANS.uiInteraction, {
    [ATTR.webVitalName]: name,
    [ATTR.webVitalValue]: rounded,
    [ATTR.webVitalRating]: rate(name, rounded),
    [ATTR.routeTemplate]: currentRouteTemplate(),
  });
  span.end();
}

/** Crea un observador tolerante: un tipo no soportado no puede romper nada. */
function observe(type: string, callback: (entries: PerformanceEntryList) => void): PerformanceObserver | undefined {
  try {
    const observer = new PerformanceObserver((list) => callback(list.getEntries()));
    observer.observe({ type, buffered: true });
    return observer;
  } catch {
    // Firefox no soporta `layout-shift` ni `largest-contentful-paint`, por ejemplo.
    return undefined;
  }
}

export function useWebVitals() {
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;

    const observers: PerformanceObserver[] = [];
    const add = (observer: PerformanceObserver | undefined) => {
      if (observer) observers.push(observer);
    };

    // LCP y CLS solo son definitivos cuando la página se oculta: se acumulan y se
    // emiten una vez, en `emitFinal()`.
    let largestContentfulPaint = 0;
    let cumulativeLayoutShift = 0;
    let emitted = false;

    add(
      observe("largest-contentful-paint", (entries) => {
        const last = entries[entries.length - 1];
        if (last) largestContentfulPaint = last.startTime;
      }),
    );

    add(
      observe("layout-shift", (entries) => {
        for (const entry of entries) {
          const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          // Un desplazamiento causado por la propia persona (abrir un menú) no cuenta.
          if (!shift.hadRecentInput && typeof shift.value === "number") {
            cumulativeLayoutShift += shift.value;
          }
        }
      }),
    );

    add(
      observe("paint", (entries) => {
        const fcp = entries.find((entry) => entry.name === "first-contentful-paint");
        if (fcp) emit("FCP", fcp.startTime);
      }),
    );

    add(
      observe("navigation", (entries) => {
        const navigation = entries[0] as PerformanceNavigationTiming | undefined;
        if (navigation) emit("TTFB", navigation.responseStart);
      }),
    );

    add(
      observe("event", (entries) => {
        // INP aproximado: la interacción más lenta observada. La definición completa
        // usa percentiles sobre toda la sesión; aquí interesa el caso peor, que es el
        // que se diagnostica.
        let worst = 0;
        for (const entry of entries) {
          const timing = entry as PerformanceEntry & { interactionId?: number; duration: number };
          if (timing.interactionId && timing.duration > worst) worst = timing.duration;
        }
        if (worst > 0) emit("INP", worst);
      }),
    );

    const emitFinal = () => {
      if (emitted || document.visibilityState !== "hidden") return;
      emitted = true;
      if (largestContentfulPaint > 0) emit("LCP", largestContentfulPaint);
      emit("CLS", cumulativeLayoutShift);
    };

    document.addEventListener("visibilitychange", emitFinal);
    window.addEventListener("pagehide", emitFinal);

    return () => {
      document.removeEventListener("visibilitychange", emitFinal);
      window.removeEventListener("pagehide", emitFinal);
      for (const observer of observers) observer.disconnect();
    };
  }, []);
}
