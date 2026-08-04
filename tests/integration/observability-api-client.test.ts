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
import { SanitizingSpanProcessor } from "@/observability/browser/sanitizing-span-processor";
import type { NormalizedSession } from "@/shared/auth/session";

/**
 * Integración: el cliente HTTP real (`apiRequest`) dentro del SDK real, con exportador
 * en memoria. Es la prueba que garantiza las dos cosas que más importan:
 *
 *  1. que la instrumentación **no cambia el comportamiento** de la aplicación,
 *  2. que **ningún secreto** llega a un span.
 */

const originalEnv = { ...process.env };
let exporter: InMemorySpanExporter;
let provider: BasicTracerProvider;
let contextManager: StackContextManager | undefined;

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  } as Response;
}

function persistSession(session: NormalizedSession) {
  window.localStorage.setItem("cm_session", JSON.stringify(session));
}

/**
 * Importa el cliente HTTP con el grafo de módulos recién creado.
 *
 * `jest.resetModules()` devuelve instancias NUEVAS de todos los módulos, incluida la
 * que guarda el enganche a `@opentelemetry/api`. Por eso hay que engancharlo sobre esa
 * copia y no sobre la del ámbito del test: si no, `apiRequest` vería la telemetría
 * apagada y no crearía ningún span.
 */
async function importApiClient({ telemetry }: { telemetry: boolean }) {
  jest.resetModules();

  const otelState = await import("@/observability/core/otel-api");
  if (telemetry) otelState.attachOtelApi(otelApi);

  return import("@/shared/api/client");
}

function spans(): ReadableSpan[] {
  return exporter.getFinishedSpans();
}

/** Todos los valores de texto de todos los spans, para buscar fugas. */
function allExportedText(): string {
  return spans()
    .flatMap((span) => [
      span.name,
      ...Object.entries(span.attributes).map(([key, value]) => `${key}=${String(value)}`),
      ...span.events.flatMap((event) => Object.values(event.attributes ?? {}).map(String))
    ])
    .join("\n");
}

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_API_BASE_URL: "https://backend.corazon.test",
    NEXT_PUBLIC_OTEL_ENABLED: "true",
    NEXT_PUBLIC_OTEL_SAMPLE_RATIO: "1"
  };
  resetTelemetryConfigCache();
  window.localStorage.clear();
  jest.restoreAllMocks();

  exporter = new InMemorySpanExporter();
  // El mismo procesador saneador que se usa en producción, para probar la cadena entera.
  provider = new BasicTracerProvider({
    spanProcessors: [new SanitizingSpanProcessor(new SimpleSpanProcessor(exporter))]
  });
  otelApi.trace.setGlobalTracerProvider(provider);
  contextManager = new StackContextManager().enable();
  otelApi.context.setGlobalContextManager(contextManager);
  attachOtelApi(otelApi);
});

afterEach(async () => {
  detachOtelApi();
  contextManager?.disable();
  contextManager = undefined;
  otelApi.context.disable();
  otelApi.trace.disable();
  await provider.shutdown().catch(() => {});
  process.env = originalEnv;
  resetTelemetryConfigCache();
});

describe("apiRequest instrumentado", () => {
  it("no altera el resultado de una petición correcta", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ ok: true }));
    const { apiRequest } = await importApiClient({ telemetry: true });

    await expect(apiRequest("/api/v1/admin/users", { auth: false })).resolves.toEqual({ ok: true });
  });

  it("crea un span http.client con la plantilla de ruta, no con la URL vivida", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ ok: true }));
    const { apiRequest } = await importApiClient({ telemetry: true });

    await apiRequest("/api/v1/appointments/:appointmentId/status", { method: "PATCH", body: {}, auth: false });

    const span = spans().find((item) => item.name === "http.client");
    expect(span).toBeDefined();
    expect(span!.attributes["http.request.method"]).toBe("PATCH");
    expect(span!.attributes["app.route.template"]).toBe("/api/v1/appointments/:appointmentId/status");
    expect(span!.attributes["http.response.status_code"]).toBe(200);
  });

  it("colapsa un identificador real presente en la ruta", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ ok: true }));
    const { apiRequest } = await importApiClient({ telemetry: true });

    await apiRequest("/api/v1/admin/users/3f2504e0-4f89-11d3-9a0c-0305e82c3301", { auth: false });

    const span = spans().find((item) => item.name === "http.client");
    expect(span!.attributes["app.route.template"]).toBe("/api/v1/admin/users/:id");
  });

  it("descarta la query string de una búsqueda escrita por una persona", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ ok: true }));
    const { apiRequest } = await importApiClient({ telemetry: true });

    await apiRequest("/api/v1/admin/users?search=ana%20maria%20perez", { auth: false });

    expect(allExportedText()).not.toContain("ana");
    expect(allExportedText()).not.toContain("search");
  });

  it("NUNCA exporta el token de sesión ni la cabecera Authorization", async () => {
    persistSession({
      userId: "1",
      fullName: "Ana Pérez",
      email: "ana@corazon.test",
      role: "PACIENTE",
      permissions: [],
      token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.firma-secreta"
    });

    global.fetch = jest.fn(async () => jsonResponse({ ok: true }));
    const { apiRequest } = await importApiClient({ telemetry: true });

    await apiRequest("/api/v1/me");

    const exported = allExportedText();
    expect(exported).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(exported).not.toContain("firma-secreta");
    expect(exported.toLowerCase()).not.toContain("authorization");
    expect(exported).not.toContain("ana@corazon.test");
  });

  it("NUNCA exporta el cuerpo de la petición", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ ok: true }));
    const { apiRequest } = await importApiClient({ telemetry: true });

    await apiRequest("/api/v1/auth/login", {
      method: "POST",
      auth: false,
      body: { email: "ana@corazon.test", password: "contrasena-secreta" }
    });

    const exported = allExportedText();
    expect(exported).not.toContain("contrasena-secreta");
    expect(exported).not.toContain("ana@corazon.test");
  });

  it("registra el código de estado en un fallo 5xx y marca el span como error", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ message: "Boom" }, 500));
    const { apiRequest } = await importApiClient({ telemetry: true });

    await expect(apiRequest("/api/v1/admin/users", { auth: false })).rejects.toThrow();

    const span = spans().find((item) => item.name === "http.client");
    expect(span!.attributes["http.response.status_code"]).toBe(500);
    expect(span!.status.code).toBe(otelApi.SpanStatusCode.ERROR);
  });

  it("no exporta un mensaje de error del backend que cite datos de la persona", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ message: "El paciente ana@corazon.test no tiene cita" }, 409));
    const { apiRequest } = await importApiClient({ telemetry: true });

    await expect(apiRequest("/api/v1/appointments", { auth: false })).rejects.toThrow();

    expect(allExportedText()).not.toContain("ana@corazon.test");
  });

  it("un fallo de red produce un span de error y conserva el ApiError original", async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const { apiRequest } = await importApiClient({ telemetry: true });

    await expect(apiRequest("/api/v1/admin/users", { auth: false })).rejects.toThrow(
      "No se pudo conectar con el servidor"
    );

    const span = spans().find((item) => item.name === "http.client");
    expect(span!.status.code).toBe(otelApi.SpanStatusCode.ERROR);
  });
});

describe("apiRequest con la telemetría desactivada", () => {
  beforeEach(() => {
    detachOtelApi();
    process.env = { ...originalEnv, NEXT_PUBLIC_API_BASE_URL: "https://backend.corazon.test", NEXT_PUBLIC_OTEL_ENABLED: "false" };
    resetTelemetryConfigCache();
  });

  it("se comporta exactamente igual y no exporta nada", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ ok: true }));
    const { apiRequest } = await importApiClient({ telemetry: false });

    await expect(apiRequest("/api/v1/admin/users", { auth: false })).resolves.toEqual({ ok: true });
    expect(spans()).toHaveLength(0);
  });

  it("sigue propagando los errores igual que antes", async () => {
    global.fetch = jest.fn(async () => jsonResponse({ message: "Unauthorized" }, 401));
    const { apiRequest } = await importApiClient({ telemetry: false });

    await expect(apiRequest("/api/v1/auth/login", { method: "POST", auth: false, body: {} })).rejects.toThrow();
    expect(spans()).toHaveLength(0);
  });
});
