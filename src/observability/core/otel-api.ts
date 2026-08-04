import type { Attributes, Exception, Link, Span, SpanContext, SpanStatus, TimeInput } from "@opentelemetry/api";

/**
 * Acceso diferido a `@opentelemetry/api`.
 *
 * **Por qué existe este archivo.** `@opentelemetry/api` funciona como no-op mientras
 * nadie registre un proveedor, así que la solución obvia es importarlo estáticamente
 * desde `tracing.service.ts`. El problema es el peso: medido con `next build`, ese
 * import estático añadía ~11 kB de First Load a **todas** las pantallas, incluso con
 * `NEXT_PUBLIC_OTEL_ENABLED=false`, donde no se ejecuta una sola línea del SDK.
 *
 * En su lugar, el paquete se carga dentro del chunk de telemetría (que ya es dinámico)
 * y se "engancha" aquí al inicializar. Mientras no esté enganchado —telemetría apagada,
 * o encendida pero todavía arrancando— toda la API responde con el span inerte de abajo.
 *
 * Los `import type` se borran al compilar: este archivo no genera ninguna dependencia
 * de tiempo de ejecución.
 */

export type OtelApi = typeof import("@opentelemetry/api");

let attached: OtelApi | undefined;

/** Lo llama el arranque del navegador, que ya carga el paquete en su propio chunk. */
export function attachOtelApi(api: OtelApi) {
  attached = api;
}

/** `undefined` mientras la telemetría no esté inicializada. */
export function otelApi(): OtelApi | undefined {
  return attached;
}

/** Solo para tests: vuelve al estado sin telemetría. */
export function detachOtelApi() {
  attached = undefined;
}

/** Identificadores de un contexto inválido, según la especificación W3C. */
export const INVALID_TRACE_ID = "00000000000000000000000000000000";
export const INVALID_SPAN_ID = "0000000000000000";

const INVALID_CONTEXT: SpanContext = {
  traceId: INVALID_TRACE_ID,
  spanId: INVALID_SPAN_ID,
  // `TraceFlags.NONE`. Se escribe como literal para no importar el enum en tiempo de
  // ejecución, que es justo lo que este archivo evita.
  traceFlags: 0,
};

/**
 * Span inerte. Implementa la interfaz completa para poder entregarse a cualquier
 * operación instrumentada sin que esta tenga que comprobar nada.
 */
export const NOOP_SPAN: Span = {
  spanContext: () => INVALID_CONTEXT,
  setAttribute(_key: string, _value: unknown) {
    return this;
  },
  setAttributes(_attributes: Attributes) {
    return this;
  },
  addEvent(_name: string, _attributes?: Attributes | TimeInput, _time?: TimeInput) {
    return this;
  },
  addLink(_link: Link) {
    return this;
  },
  addLinks(_links: Link[]) {
    return this;
  },
  setStatus(_status: SpanStatus) {
    return this;
  },
  updateName(_name: string) {
    return this;
  },
  end(_endTime?: TimeInput) {
    // Nada que cerrar.
  },
  isRecording: () => false,
  recordException(_exception: Exception, _time?: TimeInput) {
    // Nada que registrar.
  },
};

/** Códigos de estado, como literales, para no importar el enum en el camino ligero. */
export const STATUS_CODE = {
  unset: 0,
  ok: 1,
  error: 2,
} as const;
