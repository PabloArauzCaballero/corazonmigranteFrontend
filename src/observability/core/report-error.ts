import { currentRouteTemplate } from "@/observability/core/route-template";
import { failSpan, startSpan } from "@/observability/core/tracing.service";
import { ATTR, ERROR_SOURCE, TECHNICAL_SPANS } from "@/observability/core/tracing.constants";

/**
 * Punto único de registro de errores (Fase 18).
 *
 * Tres fuentes distintas pueden ver el mismo error:
 *   `window.onerror` · `unhandledrejection` · Error Boundary de React.
 * Sin deduplicación, un fallo de renderizado generaría tres spans idénticos y las
 * trazas dejarían de ser legibles.
 *
 * Este módulo solo depende de `@opentelemetry/api`, así que un `error.tsx` puede
 * importarlo sin arrastrar el SDK al bundle de esa ruta.
 */

export type ErrorSource = (typeof ERROR_SOURCE)[keyof typeof ERROR_SOURCE];

export type ReportErrorInput = {
  readonly error: unknown;
  readonly source: ErrorSource;
  /** `true` si la aplicación lo capturó y mostró algo razonable. */
  readonly handled: boolean;
  /** Componente o pantalla, si se conoce. Valor estático, nunca interpolado con datos. */
  readonly component?: string;
  readonly feature?: string;
};

/** Ventana durante la cual el mismo error no se vuelve a registrar. */
const DEDUPE_WINDOW_MS = 10_000;

const recentFingerprints = new Map<string, number>();

function fingerprint(input: ReportErrorInput, message: string): string {
  const type = input.error instanceof Error ? input.error.name : typeof input.error;
  return `${type}|${message}|${currentRouteTemplate()}`;
}

function isDuplicate(key: string): boolean {
  const now = Date.now();

  // Limpieza oportunista: evita que el mapa crezca sin límite en una sesión larga.
  for (const [existing, seenAt] of recentFingerprints) {
    if (now - seenAt > DEDUPE_WINDOW_MS) recentFingerprints.delete(existing);
  }

  if (recentFingerprints.has(key)) return true;
  recentFingerprints.set(key, now);
  return false;
}

/**
 * Un fallo al descargar un chunk de JavaScript no es un error de la aplicación: es
 * un despliegue nuevo, una red que se cayó o un proxy corporativo. Merece su propia
 * categoría porque la acción correctiva es distinta (recargar, no depurar).
 */
function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "ChunkLoadError" ||
    /Loading chunk \S+ failed/i.test(error.message) ||
    /Failed to fetch dynamically imported module/i.test(error.message) ||
    /Importing a module script failed/i.test(error.message)
  );
}

/**
 * Registra un error como span propio.
 *
 * Se crea un span en vez de anotar el activo porque, cuando un error llega por
 * `window.onerror`, casi nunca hay span activo: el contexto se perdió en el `await`
 * que falló.
 *
 * **No se exporta el stack trace.** Puede contener rutas, nombres de archivo y
 * fragmentos de datos; la correlación con el código se hace por `app.release` y
 * `app.build.id` (Fase 28).
 */
export function reportError(input: ReportErrorInput): void {
  const message = input.error instanceof Error ? input.error.message : "";
  const key = fingerprint(input, message);
  if (isDuplicate(key)) return;

  const source = isChunkLoadError(input.error) ? ERROR_SOURCE.chunk : input.source;
  const type = input.error instanceof Error ? input.error.name : typeof input.error;

  const span = startSpan(TECHNICAL_SPANS.clientError, {
    [ATTR.errorType]: type,
    [ATTR.errorSource]: source,
    [ATTR.errorHandled]: input.handled,
    [ATTR.routeTemplate]: currentRouteTemplate(),
    ...(input.component ? { [ATTR.uiComponent]: input.component } : {}),
    ...(input.feature ? { [ATTR.feature]: input.feature } : {}),
  });

  // `failSpan` sanea el mensaje antes de registrarlo: la huella de deduplicación usa
  // el mensaje crudo (no sale del navegador), el span solo el saneado.
  failSpan(span, input.error);
  span.end();
}

/** Solo para tests: vacía la memoria de deduplicación. */
export function resetErrorDeduplication() {
  recentFingerprints.clear();
}
