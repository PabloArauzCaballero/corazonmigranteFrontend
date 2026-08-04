import * as otelApi from "@opentelemetry/api";
import { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { attachOtelApi, detachOtelApi } from "@/observability/core/otel-api";
import { resetTelemetryConfigCache } from "@/observability/config/telemetry.config";
import { reportError, resetErrorDeduplication } from "@/observability/core/report-error";

/**
 * El mismo error puede llegar por tres vías (`window.onerror`, `unhandledrejection` y
 * el límite de error de React). Sin deduplicación, un solo fallo generaría tres spans
 * y las trazas dejarían de ser legibles.
 */

const originalEnv = { ...process.env };
let exporter: InMemorySpanExporter;
let provider: BasicTracerProvider;

beforeEach(() => {
  process.env = { ...originalEnv, NEXT_PUBLIC_OTEL_ENABLED: "true", NEXT_PUBLIC_OTEL_SAMPLE_RATIO: "1" };
  resetTelemetryConfigCache();
  resetErrorDeduplication();

  exporter = new InMemorySpanExporter();
  provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
  otelApi.trace.setGlobalTracerProvider(provider);
  attachOtelApi(otelApi);
});

afterEach(async () => {
  detachOtelApi();
  otelApi.trace.disable();
  await provider.shutdown().catch(() => {});
  process.env = originalEnv;
  resetTelemetryConfigCache();
});

describe("reportError", () => {
  it("crea un span client.error marcado como error", () => {
    reportError({ error: new Error("Algo falló"), source: "react", handled: true, component: "AdminErrorBoundary" });

    const [span] = exporter.getFinishedSpans();
    expect(span.name).toBe("client.error");
    expect(span.status.code).toBe(otelApi.SpanStatusCode.ERROR);
    expect(span.attributes["error.type"]).toBe("Error");
    expect(span.attributes["error.source"]).toBe("react");
    expect(span.attributes["error.handled"]).toBe(true);
    expect(span.attributes["ui.component"]).toBe("AdminErrorBoundary");
  });

  it("registra una sola vez el mismo error llegado por tres vías distintas", () => {
    const error = new Error("Cannot read properties of undefined");

    reportError({ error, source: "react", handled: true });
    reportError({ error, source: "window", handled: false });
    reportError({ error, source: "promise", handled: false });

    expect(exporter.getFinishedSpans()).toHaveLength(1);
  });

  it("sí registra errores distintos", () => {
    reportError({ error: new Error("Primero"), source: "window", handled: false });
    reportError({ error: new Error("Segundo"), source: "window", handled: false });

    expect(exporter.getFinishedSpans()).toHaveLength(2);
  });

  it("reclasifica un fallo de carga de chunk, venga por donde venga", () => {
    const chunkError = new Error("Loading chunk 42 failed. (missing: /_next/static/chunks/42.js)");
    chunkError.name = "ChunkLoadError";

    reportError({ error: chunkError, source: "window", handled: false });

    expect(exporter.getFinishedSpans()[0].attributes["error.source"]).toBe("chunk");
  });

  it("reclasifica un import dinámico fallido", () => {
    reportError({
      error: new Error("Failed to fetch dynamically imported module: /_next/static/chunks/telemetry.js"),
      source: "promise",
      handled: false
    });

    expect(exporter.getFinishedSpans()[0].attributes["error.source"]).toBe("chunk");
  });

  it("NO exporta un mensaje de error que cite datos de la persona", () => {
    reportError({
      error: new Error("No se pudo guardar la cita de ana@corazon.test"),
      source: "http",
      handled: true
    });

    const exception = exporter.getFinishedSpans()[0].events.find((event) => event.name === "exception");
    expect(exception?.attributes?.["exception.message"]).toBe("[redacted]");
  });

  it("NO exporta el stack trace", () => {
    reportError({ error: new Error("fallo"), source: "window", handled: false });

    const exception = exporter.getFinishedSpans()[0].events.find((event) => event.name === "exception");
    expect(exception?.attributes?.["exception.stacktrace"]).toBeUndefined();
  });

  it("soporta que se lance algo que no es un Error", () => {
    expect(() => reportError({ error: "una cadena suelta", source: "promise", handled: false })).not.toThrow();
    expect(exporter.getFinishedSpans()[0].attributes["error.type"]).toBe("string");
  });
});

describe("reportError con la telemetría desactivada", () => {
  beforeEach(() => {
    detachOtelApi();
    process.env = { ...originalEnv, NEXT_PUBLIC_OTEL_ENABLED: "false" };
    resetTelemetryConfigCache();
    resetErrorDeduplication();
  });

  it("no exporta nada ni lanza", () => {
    expect(() => reportError({ error: new Error("fallo"), source: "window", handled: false })).not.toThrow();
    expect(exporter.getFinishedSpans()).toHaveLength(0);
  });
});
