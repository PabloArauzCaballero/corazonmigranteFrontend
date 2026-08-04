import {
  isValidEnvironment,
  parseTelemetryInput,
  type TelemetryRawInput,
} from "@/observability/config/telemetry.schema";
import type {
  TelemetryConfig,
  TelemetryConfigResult,
  TelemetryEnvironment,
} from "@/observability/config/telemetry.types";

/**
 * Adaptador único entre `process.env` y el resto del módulo de observabilidad.
 *
 * Ningún otro archivo lee `process.env`: así hay un solo sitio donde comprobar qué
 * se expone al navegador y qué valores por defecto se aplican.
 *
 * Las referencias a `process.env.NEXT_PUBLIC_*` deben escribirse literalmente
 * (`process.env.NEXT_PUBLIC_OTEL_ENABLED`, no `process.env[nombre]`): Next.js
 * sustituye el texto en tiempo de build y un acceso dinámico quedaría como
 * `undefined` en el bundle.
 */

const DEFAULT_SERVICE_NAME = "corazon-migrante-web";
const DEFAULT_SERVICE_NAMESPACE = "corazon-migrante";
const DEFAULT_TRACES_ENDPOINT = "/otel/v1/traces";
const DEFAULT_VERSION = "0.0.0";
const DEFAULT_BUILD_ID = "local";

/** Ratio por defecto según entorno, cuando la variable no está puesta. */
const DEFAULT_SAMPLE_RATIO: Record<TelemetryEnvironment, number> = {
  development: 1,
  test: 0,
  staging: 1,
  production: 0.05,
};

function defaultEnvironment(): TelemetryEnvironment {
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "test") return "test";
  return "development";
}

/**
 * Origen del backend a partir de `NEXT_PUBLIC_API_BASE_URL`. Se usa para la lista
 * blanca de propagación: solo se añade `traceparent` a peticiones hacia este origen.
 * Devuelve `undefined` si la variable falta o no es una URL absoluta válida.
 */
function backendOrigin(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw || raw.trim() === "") return undefined;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return undefined;
  }
}

/** Configuración totalmente inerte: es el estado al que se cae ante cualquier duda. */
export function disabledTelemetryConfig(environment = defaultEnvironment()): TelemetryConfig {
  return {
    enabled: false,
    serviceName: DEFAULT_SERVICE_NAME,
    serviceNamespace: DEFAULT_SERVICE_NAMESPACE,
    tracesEndpoint: DEFAULT_TRACES_ENDPOINT,
    sampleRatio: 0,
    propagateToBackend: false,
    backendOrigin: undefined,
    version: DEFAULT_VERSION,
    buildId: DEFAULT_BUILD_ID,
    release: `${DEFAULT_VERSION}+${DEFAULT_BUILD_ID}`,
    environment,
    debug: false,
  };
}

/** Recorta el identificador de build para `app.release` sin perder trazabilidad. */
function shortBuildId(buildId: string) {
  return buildId.length > 12 ? buildId.slice(0, 7) : buildId;
}

/**
 * Resuelve la configuración a partir de un objeto plano. Se expone aparte de
 * `resolveTelemetryConfig()` para poder probarla sin tocar `process.env`.
 */
export function buildTelemetryConfig(raw: TelemetryRawInput): TelemetryConfigResult {
  const candidate = raw.environment?.trim().toLowerCase();
  const environment: TelemetryEnvironment = isValidEnvironment(candidate) ? candidate : defaultEnvironment();

  const parsed = parseTelemetryInput(raw, {
    serviceName: DEFAULT_SERVICE_NAME,
    serviceNamespace: DEFAULT_SERVICE_NAMESPACE,
    tracesEndpoint: DEFAULT_TRACES_ENDPOINT,
    sampleRatio: DEFAULT_SAMPLE_RATIO[environment],
    version: DEFAULT_VERSION,
    buildId: DEFAULT_BUILD_ID,
    environment,
  });

  if (!parsed.success) {
    return { config: disabledTelemetryConfig(environment), issues: parsed.issues };
  }

  const value = parsed.data;

  return {
    config: {
      enabled: value.enabled,
      serviceName: value.serviceName,
      serviceNamespace: value.serviceNamespace,
      tracesEndpoint: value.tracesEndpoint,
      sampleRatio: value.sampleRatio,
      propagateToBackend: value.propagateToBackend,
      backendOrigin: backendOrigin(),
      version: value.version,
      buildId: value.buildId,
      release: `${value.version}+${shortBuildId(value.buildId)}`,
      environment: value.environment,
      // El modo depuración escribe en consola: nunca en producción, aunque se pida.
      debug: value.debug && value.environment !== "production",
    },
    issues: [],
  };
}

let cached: TelemetryConfigResult | undefined;
let warned = false;

/** Configuración efectiva del proceso actual. Se calcula una sola vez. */
export function resolveTelemetryConfig(): TelemetryConfigResult {
  if (cached) return cached;

  cached = buildTelemetryConfig({
    enabled: process.env.NEXT_PUBLIC_OTEL_ENABLED,
    serviceName: process.env.NEXT_PUBLIC_OTEL_SERVICE_NAME,
    serviceNamespace: process.env.NEXT_PUBLIC_OTEL_SERVICE_NAMESPACE,
    tracesEndpoint: process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
    sampleRatio: process.env.NEXT_PUBLIC_OTEL_SAMPLE_RATIO,
    propagateToBackend: process.env.NEXT_PUBLIC_OTEL_PROPAGATE_BACKEND,
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    buildId: process.env.NEXT_PUBLIC_BUILD_ID,
    environment: process.env.NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT,
    debug: process.env.NEXT_PUBLIC_OTEL_DEBUG,
  });

  // Una configuración inválida no puede pasar desapercibida en desarrollo, pero
  // tampoco puede ensuciar la consola de la persona usuaria en producción.
  if (!warned && cached.issues.length > 0 && process.env.NODE_ENV !== "production") {
    warned = true;
    console.warn(
      `[telemetry] configuración inválida; la telemetría queda desactivada:\n  - ${cached.issues.join("\n  - ")}`,
    );
  }

  return cached;
}

export function telemetryConfig(): TelemetryConfig {
  return resolveTelemetryConfig().config;
}

/** Solo para tests: olvida la configuración memorizada. */
export function resetTelemetryConfigCache() {
  cached = undefined;
  warned = false;
}
