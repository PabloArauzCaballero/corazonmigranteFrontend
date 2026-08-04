import type { Attributes, Span } from "@opentelemetry/api";
import { telemetryConfig } from "@/observability/config/telemetry.config";
import { currentRouteTemplate } from "@/observability/core/route-template";
import {
  INVALID_SPAN_ID,
  INVALID_TRACE_ID,
  NOOP_SPAN,
  STATUS_CODE,
  otelApi,
} from "@/observability/core/otel-api";
import { sanitizeErrorMessage } from "@/observability/core/sanitize";
import { telemetrySessionId, userSegmentFromRole } from "@/observability/core/session-id";
import { safeAttributes } from "@/observability/core/tracing.attributes";
import { ATTR, TRACER_NAME, TRACER_VERSION } from "@/observability/core/tracing.constants";
import type { SpanOperation, SpanOptions, SyncSpanOperation, TraceContext } from "@/observability/core/tracing.types";

/**
 * API de trazabilidad del frontend.
 *
 * Es lo único que el resto de la aplicación puede importar. No conoce Jaeger, ni el
 * exportador, ni el proveedor, y **ni siquiera importa `@opentelemetry/api` en tiempo
 * de ejecución**: lo obtiene de `otel-api.ts`, que se engancha cuando —y solo cuando—
 * la telemetría arranca. Ver la justificación de peso en ese archivo.
 *
 * **Contexto asíncrono.** En el navegador no existe `AsyncLocalStorage`. Se ha decidido
 * NO usar `@opentelemetry/context-zone` (arrastra `zone.js`, que parchea globales y
 * puede interferir con el planificador de React 19). La consecuencia práctica: el
 * contexto activo sobrevive hasta el primer `await` de la operación. Por eso las
 * operaciones instrumentadas lanzan su llamada de red **antes** de cualquier `await`.
 * Documentado en `01-architecture-design.md`.
 */

/** La telemetría está operativa si la configuración la activa y el SDK ya se enganchó. */
function activeApi() {
  if (!telemetryConfig().enabled) return undefined;
  return otelApi();
}

/** Rol vigente, leído sin acoplar la telemetría al módulo de sesión. */
let currentRole: string | null = null;

/**
 * Informa a la telemetría del rol activo. Lo llama el proveedor de React; se guarda
 * **solo el segmento**, nunca el identificador ni el correo.
 */
export function setTelemetryRole(role: string | null) {
  currentRole = role;
}

/** Atributos que acompañan a todos los spans propios. */
function commonAttributes(): Attributes {
  return {
    [ATTR.sessionId]: telemetrySessionId(),
    [ATTR.routeTemplate]: currentRouteTemplate(),
    [ATTR.authenticated]: currentRole !== null,
    [ATTR.userSegment]: userSegmentFromRole(currentRole),
  };
}

function initialAttributes(options: SpanOptions | undefined): Attributes {
  const own = safeAttributes(options?.attributes);
  if (options?.withCommonAttributes === false) return own;
  return { ...safeAttributes(commonAttributes()), ...own };
}

/**
 * Marca el span como fallido y registra la excepción con el mensaje ya saneado.
 * El error original **no se modifica** y se vuelve a lanzar tal cual.
 */
export function failSpan(span: Span, error: unknown) {
  const message = error instanceof Error ? sanitizeErrorMessage(error.message) : "";
  const type = error instanceof Error ? error.name : typeof error;

  span.recordException({ name: type, message });
  span.setStatus({ code: STATUS_CODE.error, message: message || undefined });
  span.setAttributes(safeAttributes({ [ATTR.errorType]: type }));
}

/**
 * Ejecuta una operación dentro de un span activo.
 *
 * Con la telemetría apagada ejecuta la operación tal cual, devuelve su resultado y
 * relanza sus errores sin crear ningún span.
 */
export async function runInSpan<T>(
  name: string,
  attributes: Attributes,
  operation: SpanOperation<T>,
  options?: Omit<SpanOptions, "attributes">,
): Promise<T> {
  const api = activeApi();
  if (!api) return operation(NOOP_SPAN);

  return api.trace.getTracer(TRACER_NAME, TRACER_VERSION).startActiveSpan(
    name,
    { attributes: initialAttributes({ ...options, attributes }) },
    async (span) => {
      try {
        const result = await operation(span);
        span.setStatus({ code: STATUS_CODE.ok });
        return result;
      } catch (error) {
        failSpan(span, error);
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

/**
 * Variante síncrona: no envuelve el resultado en una promesa. Útil para validaciones
 * y cálculos donde convertir a `async` cambiaría el orden de ejecución del componente.
 */
export function runInSpanSync<T>(
  name: string,
  attributes: Attributes,
  operation: SyncSpanOperation<T>,
  options?: Omit<SpanOptions, "attributes">,
): T {
  const api = activeApi();
  if (!api) return operation(NOOP_SPAN);

  return api.trace.getTracer(TRACER_NAME, TRACER_VERSION).startActiveSpan(
    name,
    { attributes: initialAttributes({ ...options, attributes }) },
    (span) => {
      try {
        const result = operation(span);
        span.setStatus({ code: STATUS_CODE.ok });
        return result;
      } catch (error) {
        failSpan(span, error);
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

/**
 * Crea un span que hay que cerrar a mano. Solo para ciclos de vida que no encajan en
 * una función (navegación SPA, conexión SSE). Quien lo crea es responsable de
 * llamar a `.end()`.
 */
export function startSpan(name: string, attributes: Attributes = {}, options?: Omit<SpanOptions, "attributes">): Span {
  const api = activeApi();
  if (!api) return NOOP_SPAN;

  return api.trace
    .getTracer(TRACER_NAME, TRACER_VERSION)
    .startSpan(name, { attributes: initialAttributes({ ...options, attributes }) });
}

/** Añade un evento al span activo, si lo hay. */
export function addEvent(name: string, attributes: Attributes = {}) {
  activeApi()?.trace.getActiveSpan()?.addEvent(name, safeAttributes(attributes));
}

/** Escribe atributos en el span activo, si lo hay. */
export function setAttributes(attributes: Attributes) {
  activeApi()?.trace.getActiveSpan()?.setAttributes(safeAttributes(attributes));
}

export function setAttribute(key: string, value: Attributes[string]) {
  setAttributes({ [key]: value });
}

/** Registra una excepción en el span activo sin interrumpir el flujo. */
export function recordException(error: unknown) {
  const span = activeApi()?.trace.getActiveSpan();
  if (span) failSpan(span, error);
}

export function getActiveTraceId(): string | undefined {
  const context = activeApi()?.trace.getActiveSpan()?.spanContext();
  return context && context.traceId !== INVALID_TRACE_ID ? context.traceId : undefined;
}

export function getActiveSpanId(): string | undefined {
  const context = activeApi()?.trace.getActiveSpan()?.spanContext();
  return context && context.spanId !== INVALID_SPAN_ID ? context.spanId : undefined;
}

export function getTraceContext(): TraceContext | undefined {
  const traceId = getActiveTraceId();
  const spanId = getActiveSpanId();
  return traceId && spanId ? { traceId, spanId } : undefined;
}

/** Agrupa la API en un objeto, para quien prefiera inyectarla o simularla en un test. */
export const tracingService = {
  runInSpan,
  runInSpanSync,
  startSpan,
  addEvent,
  setAttribute,
  setAttributes,
  recordException,
  getActiveTraceId,
  getActiveSpanId,
  getTraceContext,
} as const;

export type TracingService = typeof tracingService;
