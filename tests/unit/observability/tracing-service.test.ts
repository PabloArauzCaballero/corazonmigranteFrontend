import * as otelApi from "@opentelemetry/api";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
  type ReadableSpan
} from "@opentelemetry/sdk-trace-base";
import { StackContextManager } from "@opentelemetry/sdk-trace-web";
import { attachOtelApi, detachOtelApi } from "@/observability/core/otel-api";
import { resetTelemetryConfigCache } from "@/observability/config/telemetry.config";
import {
  addEvent,
  getActiveTraceId,
  runInSpan,
  runInSpanSync,
  setAttributes,
  startSpan
} from "@/observability/core/tracing.service";

/**
 * `TracingService` se prueba con un exportador **en memoria**: no hace falta ni Jaeger
 * ni Collector, y así la suite corre en CI sin infraestructura.
 */

const originalEnv = { ...process.env };
let exporter: InMemorySpanExporter;
let provider: BasicTracerProvider;
let contextManager: StackContextManager | undefined;

function enableTelemetry() {
  process.env = { ...originalEnv, NEXT_PUBLIC_OTEL_ENABLED: "true", NEXT_PUBLIC_OTEL_SAMPLE_RATIO: "1" };
  resetTelemetryConfigCache();

  exporter = new InMemorySpanExporter();
  provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] });
  otelApi.trace.setGlobalTracerProvider(provider);

  // El mismo gestor de contexto que registra `telemetry.browser.ts`. Sin él,
  // `context.active()` devuelve siempre la raíz y los spans no se anidan: probarlo con
  // otro gestor daría una falsa sensación de seguridad sobre el comportamiento real.
  contextManager = new StackContextManager().enable();
  otelApi.context.setGlobalContextManager(contextManager);

  attachOtelApi(otelApi);
}

function disableTelemetry() {
  process.env = { ...originalEnv, NEXT_PUBLIC_OTEL_ENABLED: "false" };
  resetTelemetryConfigCache();
  detachOtelApi();
}

function finished(): ReadableSpan[] {
  return exporter.getFinishedSpans();
}

afterEach(async () => {
  detachOtelApi();
  contextManager?.disable();
  contextManager = undefined;
  otelApi.context.disable();
  otelApi.trace.disable();
  await provider?.shutdown().catch(() => {});
  process.env = originalEnv;
  resetTelemetryConfigCache();
});

describe("runInSpan con telemetría activa", () => {
  beforeEach(enableTelemetry);

  it("crea el span, ejecuta la operación y devuelve su resultado", async () => {
    await expect(runInSpan("appointment.request", {}, () => "creada")).resolves.toBe("creada");

    expect(finished()).toHaveLength(1);
    expect(finished()[0].name).toBe("appointment.request");
  });

  it("finaliza el span también cuando la operación falla, y relanza el error original", async () => {
    const original = new Error("El backend no respondió");

    await expect(
      runInSpan("appointment.request", {}, () => {
        throw original;
      })
    ).rejects.toBe(original);

    const [span] = finished();
    expect(span).toBeDefined();
    expect(span.status.code).toBe(otelApi.SpanStatusCode.ERROR);
    expect(span.events.some((event) => event.name === "exception")).toBe(true);
  });

  it("soporta operaciones asíncronas", async () => {
    const result = await runInSpan("document.upload", {}, async () => {
      await Promise.resolve();
      return 42;
    });

    expect(result).toBe(42);
    expect(finished()).toHaveLength(1);
  });

  it("añade los atributos comunes de sesión, ruta y segmento", async () => {
    await runInSpan("auth.login", { "app.feature": "auth" }, () => null);

    const [span] = finished();
    expect(span.attributes["app.feature"]).toBe("auth");
    expect(span.attributes["app.session.id"]).toEqual(expect.any(String));
    expect(span.attributes["app.route.template"]).toEqual(expect.any(String));
    expect(span.attributes["app.authenticated"]).toBe(false);
    expect(span.attributes["app.user.segment"]).toBe("anonymous");
  });

  it("descarta los atributos que no están en la lista blanca", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await runInSpan("auth.login", { "user.email": "ana@corazon.test", "app.feature": "auth" }, () => null);

    const [span] = finished();
    expect(span.attributes["user.email"]).toBeUndefined();
    expect(span.attributes["app.feature"]).toBe("auth");
    warn.mockRestore();
  });

  it("redacta un valor sensible aunque la clave sí esté permitida", async () => {
    await runInSpan("auth.login", { "ui.component": "Formulario de ana@corazon.test" }, () => null);

    expect(finished()[0].attributes["ui.component"]).toBe("[redacted]");
  });

  it("no exporta el mensaje crudo de un error que cita un correo", async () => {
    await expect(
      runInSpan("patient.register", {}, () => {
        throw new Error("El correo ana@corazon.test ya existe");
      })
    ).rejects.toThrow();

    const exception = finished()[0].events.find((event) => event.name === "exception");
    expect(exception?.attributes?.["exception.message"]).toBe("[redacted]");
  });

  it("anida los spans: el hijo comparte trace_id con el padre", async () => {
    await runInSpan("appointment.request", {}, async () => {
      await runInSpan("http.client", {}, () => null);
    });

    const spans = finished();
    expect(spans).toHaveLength(2);
    expect(spans[0].spanContext().traceId).toBe(spans[1].spanContext().traceId);
    expect(spans[0].parentSpanContext?.spanId).toBe(spans[1].spanContext().spanId);
  });

  it("getActiveTraceId devuelve el identificador dentro del span y nada fuera", async () => {
    expect(getActiveTraceId()).toBeUndefined();

    const inside = await runInSpan("auth.login", {}, () => getActiveTraceId());
    expect(inside).toMatch(/^[0-9a-f]{32}$/);
  });

  it("addEvent y setAttributes escriben en el span activo", async () => {
    await runInSpan("document.upload", {}, () => {
      addEvent("validation.completed", { "validation.success": true });
      setAttributes({ "ui.result": "success" });
    });

    const [span] = finished();
    expect(span.attributes["ui.result"]).toBe("success");
    expect(span.events.map((event) => event.name)).toContain("validation.completed");
  });
});

describe("runInSpanSync con telemetría activa", () => {
  beforeEach(enableTelemetry);

  it("devuelve el valor sin envolverlo en una promesa", () => {
    expect(runInSpanSync("auth.login", {}, () => "sincrono")).toBe("sincrono");
    expect(finished()).toHaveLength(1);
  });

  it("relanza el error y cierra el span", () => {
    expect(() =>
      runInSpanSync("auth.login", {}, () => {
        throw new Error("fallo");
      })
    ).toThrow("fallo");
    expect(finished()).toHaveLength(1);
  });
});

describe("modo no-op (telemetría desactivada)", () => {
  beforeEach(disableTelemetry);

  it("ejecuta la operación y devuelve su resultado sin crear spans", async () => {
    const operation = jest.fn(() => "resultado");
    await expect(runInSpan("auth.login", {}, operation)).resolves.toBe("resultado");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("relanza el error original sin alterarlo", async () => {
    const original = new Error("fallo de negocio");
    await expect(
      runInSpan("auth.login", {}, () => {
        throw original;
      })
    ).rejects.toBe(original);
  });

  it("entrega un span inerte que acepta toda la API sin efectos", async () => {
    await runInSpan("auth.login", {}, (span) => {
      expect(span.isRecording()).toBe(false);
      expect(() => {
        span.setAttribute("ui.result", "success");
        span.setAttributes({ "ui.result": "success" });
        span.addEvent("evento");
        span.updateName("otro");
        span.recordException(new Error("x"));
        span.end();
      }).not.toThrow();
    });
  });

  it("startSpan devuelve un span inválido y no lanza al cerrarlo", () => {
    const span = startSpan("route.navigation");
    expect(span.spanContext().traceId).toBe("00000000000000000000000000000000");
    expect(() => span.end()).not.toThrow();
  });

  it("addEvent, setAttributes y getActiveTraceId son inofensivos", () => {
    expect(() => {
      addEvent("evento");
      setAttributes({ "ui.result": "success" });
    }).not.toThrow();
    expect(getActiveTraceId()).toBeUndefined();
  });
});
