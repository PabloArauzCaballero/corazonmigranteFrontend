import type { Attributes, Span } from "@opentelemetry/api";

/** Operación envuelta por un span. Puede ser síncrona o devolver una promesa. */
export type SpanOperation<T> = (span: Span) => Promise<T> | T;

/** Operación estrictamente síncrona. */
export type SyncSpanOperation<T> = (span: Span) => T;

export type SpanOptions = {
  /** Atributos iniciales. Se sanean antes de escribirse. */
  readonly attributes?: Attributes;
  /**
   * Si es `false`, no se añaden los atributos comunes (sesión, ruta, autenticación).
   * Solo se usa para spans internos del propio módulo de telemetría.
   */
  readonly withCommonAttributes?: boolean;
};

/** Contexto de traza expuesto al resto de la aplicación (por ejemplo para un código de soporte). */
export type TraceContext = {
  readonly traceId: string;
  readonly spanId: string;
};
