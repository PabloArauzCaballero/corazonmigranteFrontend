import type { Instrumentation } from "@opentelemetry/instrumentation";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import type { TelemetryConfig } from "@/observability/config/telemetry.types";
import { currentRouteTemplate } from "@/observability/core/route-template";
import { sanitizeUrlPath } from "@/observability/core/sanitize";
import { telemetrySessionId } from "@/observability/core/session-id";
import { ATTR } from "@/observability/core/tracing.constants";

/**
 * Instrumentaciones automáticas (Fases 8, 10 y 13).
 *
 * Se instalan **dos**, y se deja constancia de por qué no hay más:
 *
 *  - `XMLHttpRequestInstrumentation`: el proyecto no usa `XMLHttpRequest` en ningún
 *    sitio (verificado en la auditoría). Instalarla sería peso muerto.
 *  - `UserInteractionInstrumentation`: crea un span por cada clic del documento.
 *    La regla 24 lo prohíbe y, en un panel con tablas y menús, generaría muchísimo
 *    ruido sin valor. Las interacciones relevantes se instrumentan a mano con
 *    `runInSpan()`.
 *  - `@opentelemetry/context-zone`: arrastra `zone.js`, que parchea globales y puede
 *    interferir con el planificador de React 19. Ver `01-architecture-design.md`.
 */

/** URLs que jamás deben instrumentarse (bucle infinito o ruido puro). */
function ignoredUrls(config: TelemetryConfig): Array<string | RegExp> {
  return [
    // El propio exportador: instrumentarlo crearía spans al exportar spans.
    new RegExp(escapeForRegExp(config.tracesEndpoint)),
    /\/otel\/v1\/traces/,
    /\/api\/otel\/traces/,
    // Logging local de desarrollo.
    /\/api\/debug-log/,
    // Recursos estáticos servidos por el propio despliegue.
    /\/_next\/static\//,
  ];
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Lista blanca de propagación (Fase 11).
 *
 * Solo el backend propio. **Nunca** Cloudinary, Google Fonts ni ningún tercero: son
 * dominios que no controlamos y a los que no debemos enviar nuestro contexto de traza.
 *
 * Si `propagateToBackend` está apagado (valor por defecto), la lista queda vacía y no
 * se toca ninguna cabecera saliente: riesgo cero de romper CORS.
 */
function propagationTargets(config: TelemetryConfig): RegExp[] {
  if (!config.propagateToBackend || !config.backendOrigin) return [];
  return [new RegExp(`^${escapeForRegExp(config.backendOrigin)}`)];
}

/** Clasifica la petición para poder filtrar por tipo sin mirar la URL. */
function requestType(url: string, config: TelemetryConfig): string {
  if (config.backendOrigin && url.startsWith(config.backendOrigin)) return "api";
  if (url.startsWith("/") || (typeof window !== "undefined" && url.startsWith(window.location.origin))) return "asset";
  return "third-party";
}

export function buildInstrumentations(config: TelemetryConfig): Instrumentation[] {
  const documentLoad = new DocumentLoadInstrumentation({
    // Sin esto, cada span de carga arrastra ~20 eventos de temporización de red. La
    // jerarquía sigue siendo legible (documentLoad → documentFetch → resourceFetch) y
    // el volumen exportado baja mucho.
    ignoreNetworkEvents: true,
    // Los eventos de pintado sí interesan: son la base de FCP.
    ignorePerformancePaintEvents: false,
    applyCustomAttributesOnSpan: {
      documentLoad: (span) => {
        span.setAttributes({
          [ATTR.routeTemplate]: currentRouteTemplate(),
          [ATTR.sessionId]: telemetrySessionId(),
          [ATTR.uiNavigationType]: "reload",
        });
      },
      documentFetch: (span) => {
        span.setAttribute(ATTR.routeTemplate, currentRouteTemplate());
      },
      resourceFetch: (span, resource) => {
        // Solo el camino: los recursos de Cloudinary llevan parámetros de transformación
        // y los chunks de Next llevan hash.
        span.setAttribute("url.path", sanitizeUrlPath(resource.name));
      },
    },
  });

  const fetchInstrumentation = new FetchInstrumentation({
    ignoreUrls: ignoredUrls(config),
    propagateTraceHeaderCorsUrls: propagationTargets(config),
    // Los eventos de red por petición multiplican el tamaño del lote sin aportar
    // nada que la duración del span no diga ya.
    ignoreNetworkEvents: true,
    // Medir el tamaño del cuerpo obliga a clonarlo. Ni se necesita ni se quiere tocar
    // el cuerpo de peticiones que llevan datos clínicos.
    measureRequestSize: false,
    applyCustomAttributesOnSpan: (span, _request, result) => {
      const url = "url" in result && typeof result.url === "string" ? result.url : "";

      span.setAttributes({
        // Reescribe `url.full`, que la instrumentación deja con query string incluida.
        "url.full": sanitizeUrlPath(url),
        "url.path": sanitizeUrlPath(url),
        [ATTR.networkRequestType]: requestType(url, config),
        [ATTR.sessionId]: telemetrySessionId(),
        [ATTR.routeTemplate]: currentRouteTemplate(),
      });

      // El backend puede devolver un identificador de soporte. Se guarda como
      // atributo informativo; NUNCA sustituye al contexto W3C.
      if (result instanceof Response) {
        const supportRef = result.headers.get("x-trace-id");
        if (supportRef) span.setAttribute(ATTR.supportTraceRef, supportRef);
      }
    },
  });

  return [documentLoad, fetchInstrumentation];
}
