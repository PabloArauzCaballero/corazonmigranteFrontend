import { buildTelemetryConfig, disabledTelemetryConfig } from "@/observability/config/telemetry.config";

/**
 * Regla central de la Fase 4: una configuración inválida **desactiva la telemetría**,
 * nunca lanza. La aplicación tiene que arrancar igual aunque alguien escriba mal una
 * variable de entorno.
 */
describe("buildTelemetryConfig", () => {
  it("está desactivada por defecto, sin ninguna variable puesta", () => {
    const { config, issues } = buildTelemetryConfig({});
    expect(config.enabled).toBe(false);
    expect(issues).toEqual([]);
  });

  it.each(["true", "1", "on", "yes", "TRUE", " True "])("activa con el valor %s", (value) => {
    expect(buildTelemetryConfig({ enabled: value }).config.enabled).toBe(true);
  });

  it.each(["false", "0", "no", "cualquier-cosa", ""])("no activa con el valor %s", (value) => {
    expect(buildTelemetryConfig({ enabled: value }).config.enabled).toBe(false);
  });

  describe("ratio de muestreo", () => {
    it.each([
      ["0", 0],
      ["1", 1],
      ["0.05", 0.05]
    ])("acepta el valor válido %s", (input, expected) => {
      const { config, issues } = buildTelemetryConfig({ enabled: "true", sampleRatio: input });
      expect(config.sampleRatio).toBe(expected);
      expect(issues).toEqual([]);
    });

    it.each(["2", "-0.5", "100", "mucho", "50%"])("desactiva la telemetría con el valor inválido %s", (input) => {
      const { config, issues } = buildTelemetryConfig({ enabled: "true", sampleRatio: input });
      expect(config.enabled).toBe(false);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toContain("sampleRatio");
    });

    it("aplica el valor por defecto del entorno cuando falta", () => {
      expect(buildTelemetryConfig({ enabled: "true", environment: "production" }).config.sampleRatio).toBe(0.05);
      expect(buildTelemetryConfig({ enabled: "true", environment: "development" }).config.sampleRatio).toBe(1);
      expect(buildTelemetryConfig({ enabled: "true", environment: "test" }).config.sampleRatio).toBe(0);
    });
  });

  describe("endpoint OTLP", () => {
    it.each(["/otel/v1/traces", "/api/otel/traces", "https://telemetry.corazon.test/v1/traces"])(
      "acepta el endpoint válido %s",
      (input) => {
        const { config, issues } = buildTelemetryConfig({ enabled: "true", tracesEndpoint: input });
        expect(issues).toEqual([]);
        expect(config.tracesEndpoint).toBe(input);
      }
    );

    it.each([
      ["protocol-relative apunta a otro dominio sin parecerlo", "//evil.test/v1/traces"],
      ["esquema javascript", "javascript:alert(1)"],
      ["esquema data", "data:text/plain,x"],
      ["texto suelto", "no-es-una-ruta"]
    ])("rechaza y desactiva: %s", (_caso, input) => {
      const { config, issues } = buildTelemetryConfig({ enabled: "true", tracesEndpoint: input });
      expect(config.enabled).toBe(false);
      expect(issues[0]).toContain("tracesEndpoint");
    });
  });

  describe("propagación al backend", () => {
    it("está apagada por defecto: encenderla puede romper CORS", () => {
      expect(buildTelemetryConfig({ enabled: "true" }).config.propagateToBackend).toBe(false);
    });

    it("se activa de forma independiente de la telemetría", () => {
      const { config } = buildTelemetryConfig({ enabled: "true", propagateToBackend: "true" });
      expect(config.propagateToBackend).toBe(true);
    });
  });

  describe("identidad del despliegue", () => {
    it("compone app.release a partir de versión y build", () => {
      const { config } = buildTelemetryConfig({
        enabled: "true",
        version: "2.4.1",
        buildId: "a1b2c3d4e5f6a7b8c9d0"
      });
      // El identificador largo se recorta para que `app.release` siga siendo legible.
      expect(config.release).toBe("2.4.1+a1b2c3d");
    });

    it("no genera un valor distinto en cada llamada", () => {
      const first = buildTelemetryConfig({ enabled: "true" }).config.release;
      const second = buildTelemetryConfig({ enabled: "true" }).config.release;
      expect(first).toBe(second);
    });
  });

  describe("modo depuración", () => {
    it("se ignora en producción aunque se pida", () => {
      const { config } = buildTelemetryConfig({ enabled: "true", debug: "true", environment: "production" });
      expect(config.debug).toBe(false);
    });

    it("se respeta fuera de producción", () => {
      const { config } = buildTelemetryConfig({ enabled: "true", debug: "true", environment: "staging" });
      expect(config.debug).toBe(true);
    });
  });

  it("un entorno desconocido no rompe: cae al valor por defecto", () => {
    const { config, issues } = buildTelemetryConfig({ enabled: "true", environment: "pre-produccion-de-ana" });
    expect(issues).toEqual([]);
    expect(["development", "test", "production"]).toContain(config.environment);
  });
});

describe("disabledTelemetryConfig", () => {
  it("es completamente inerte", () => {
    const config = disabledTelemetryConfig();
    expect(config.enabled).toBe(false);
    expect(config.sampleRatio).toBe(0);
    expect(config.propagateToBackend).toBe(false);
    expect(config.debug).toBe(false);
  });
});
