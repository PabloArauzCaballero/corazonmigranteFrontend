/**
 * Punto de arranque de la telemetría en el navegador.
 *
 * Next.js carga este archivo automáticamente (15.3+) **antes de hidratar** la
 * aplicación, que es justo la ventana necesaria para que `DocumentLoadInstrumentation`
 * llegue a tiempo de medir la carga inicial. Va en `src/` porque el proyecto usa esa
 * carpeta; Next lo busca en la raíz o en `src/`, no en ambas.
 *
 * El `import()` es dinámico **y** está detrás de una comparación con una variable
 * `NEXT_PUBLIC_*`, que Next sustituye por su valor literal en tiempo de build. Cuando
 * la telemetría está apagada, la condición queda como `"false" === "true"` y el
 * empaquetador elimina la rama entera: el SDK no llega ni a existir en el artefacto.
 *
 * Ver `docs/observability/frontend/01-architecture-design.md`.
 */
if (process.env.NEXT_PUBLIC_OTEL_ENABLED === "true") {
  void import("@/observability/browser/telemetry.browser")
    .then(({ initBrowserTelemetry }) => {
      initBrowserTelemetry();
    })
    .catch(() => {
      // Si el chunk de telemetría no se puede descargar, la aplicación sigue igual.
      // No se registra nada: no hay dónde, y no es un problema de la persona usuaria.
    });
}
