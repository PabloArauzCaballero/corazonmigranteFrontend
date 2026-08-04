import { AlwaysOffSampler, ParentBasedSampler, TraceIdRatioBasedSampler, type Sampler } from "@opentelemetry/sdk-trace-base";
import type { TelemetryConfig } from "@/observability/config/telemetry.types";

/**
 * Muestreo (Fase 33).
 *
 * `ParentBasedSampler` + `TraceIdRatioBasedSampler`:
 *  - la decisión la toma el navegador, que es quien origina la traza;
 *  - el backend la respeta al recibir `traceparent`, así que no aparecen trazas a
 *    medias con el tramo de navegador ausente.
 *
 * La retención selectiva (conservar SIEMPRE errores y latencia alta) **no se hace
 * aquí**: cuando el navegador decide muestrear todavía no sabe si la operación
 * acabará mal. Eso es trabajo del `tail_sampling` del Collector, configurado en
 * `infra/otel-collector/otel-collector.frontend.yml`.
 */
export function buildSampler(config: TelemetryConfig): Sampler {
  if (config.sampleRatio <= 0) return new AlwaysOffSampler();

  return new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(config.sampleRatio),
  });
}
