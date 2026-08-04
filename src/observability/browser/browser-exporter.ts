import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor, type SpanProcessor } from "@opentelemetry/sdk-trace-base";
import type { TelemetryConfig } from "@/observability/config/telemetry.types";
import { SanitizingSpanProcessor } from "@/observability/browser/sanitizing-span-processor";

/**
 * Exportación OTLP desde el navegador (Fase 7).
 *
 * Decisiones:
 *  - **HTTP/JSON**, no protobuf: el codificador protobuf añade unos 40 kB al bundle
 *    para ahorrar ancho de banda que aquí no es el cuello de botella. El Collector
 *    acepta ambos en el mismo puerto.
 *  - **Endpoint relativo del mismo origen** (`/otel/v1/traces`): sin CORS, sin
 *    preflight, y `connect-src 'self'` basta en la CSP.
 *  - **Sin cabeceras de autenticación**: cualquier valor incrustado en JavaScript es
 *    público. Quien protege la entrada es el gateway.
 *  - **Sin reintentos infinitos**: `BatchSpanProcessor` descarta el lote si la cola
 *    se llena. Un Collector caído no puede convertirse en una tormenta de peticiones.
 */

/** Milisegundos que se espera por una exportación antes de darla por perdida. */
const EXPORT_TIMEOUT_MS = 5_000;

/** Cola máxima de spans pendientes. Al llenarse se descartan los nuevos, no se bloquea. */
const MAX_QUEUE_SIZE = 512;

/** Tamaño máximo de lote. Por debajo del límite de 512 KB del gateway con holgura. */
const MAX_EXPORT_BATCH_SIZE = 64;

/** Cada cuánto se vacía la cola aunque no esté llena. */
const SCHEDULED_DELAY_MS = 5_000;

export function buildSpanProcessor(config: TelemetryConfig): SpanProcessor {
  const exporter = new OTLPTraceExporter({
    url: config.tracesEndpoint,
    timeoutMillis: EXPORT_TIMEOUT_MS,
    // Más de dos exportaciones simultáneas competirían con las peticiones de la
    // propia aplicación por las conexiones del navegador.
    concurrencyLimit: 2,
  });

  const batch = new BatchSpanProcessor(exporter, {
    maxQueueSize: MAX_QUEUE_SIZE,
    maxExportBatchSize: MAX_EXPORT_BATCH_SIZE,
    scheduledDelayMillis: SCHEDULED_DELAY_MS,
    exportTimeoutMillis: EXPORT_TIMEOUT_MS,
  });

  // El saneador va DELANTE del lote: ningún span alcanza el exportador sin pasar por él.
  return new SanitizingSpanProcessor(batch);
}
