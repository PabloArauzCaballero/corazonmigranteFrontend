import type { TelemetryEnvironment } from "@/observability/config/telemetry.types";

/**
 * Validación de la configuración pública de telemetría.
 *
 * **Por qué no zod, si el resto del proyecto sí lo usa** (`src/config/env.ts`): este
 * módulo lo alcanza el grafo de importación de `AppProviders`, y con él lo alcanzarían
 * todas las pantallas. Medido con `next build`, arrastrar zod hasta rutas que hoy no lo
 * incluyen (`/paciente`, `/terapeuta`) costaba ~28 kB de First Load **con la telemetría
 * apagada**. Pagar eso por validar nueve cadenas de texto no tiene sentido.
 *
 * Las garantías son las mismas que exige la Fase 4 y están cubiertas por
 * `tests/unit/observability/telemetry-config.test.ts`:
 *  - tipos validados,
 *  - valores por defecto seguros,
 *  - ratio comprobado entre 0 y 1,
 *  - endpoint comprobado como ruta relativa o URL http(s),
 *  - configuración inválida ⇒ telemetría desactivada, nunca una excepción.
 */

export type TelemetryDefaults = {
  readonly serviceName: string;
  readonly serviceNamespace: string;
  readonly tracesEndpoint: string;
  readonly sampleRatio: number;
  readonly version: string;
  readonly buildId: string;
  readonly environment: TelemetryEnvironment;
};

export type TelemetryRawInput = {
  readonly enabled?: string;
  readonly serviceName?: string;
  readonly serviceNamespace?: string;
  readonly tracesEndpoint?: string;
  readonly sampleRatio?: string;
  readonly propagateToBackend?: string;
  readonly version?: string;
  readonly buildId?: string;
  readonly environment?: string;
  readonly debug?: string;
};

export type TelemetryParsed = {
  readonly enabled: boolean;
  readonly serviceName: string;
  readonly serviceNamespace: string;
  readonly tracesEndpoint: string;
  readonly sampleRatio: number;
  readonly propagateToBackend: boolean;
  readonly version: string;
  readonly buildId: string;
  readonly environment: TelemetryEnvironment;
  readonly debug: boolean;
};

export type TelemetryParseResult =
  | { readonly success: true; readonly data: TelemetryParsed }
  | { readonly success: false; readonly issues: readonly string[] };

export const TELEMETRY_ENVIRONMENTS = ["development", "test", "staging", "production"] as const;

/** Bandera booleana en texto, con el mismo criterio que `src/config/env.ts`. */
function booleanFlag(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "") return fallback;
  return ["true", "1", "on", "yes"].includes(normalized);
}

/** Texto no vacío; el espacio en blanco cuenta como ausencia. */
function textWithDefault(value: string | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

export function isValidEnvironment(value: unknown): value is TelemetryEnvironment {
  return typeof value === "string" && (TELEMETRY_ENVIRONMENTS as readonly string[]).includes(value);
}

/**
 * Endpoint OTLP. Se admite:
 *  - ruta relativa del mismo origen (`/otel/v1/traces`) — la opción preferida,
 *  - URL absoluta `http`/`https` — para entornos donde el gateway es un subdominio.
 *
 * Se rechaza cualquier otro esquema (`javascript:`, `data:`…) y las rutas
 * protocol-relative (`//host/…`), que apuntarían a otro dominio sin parecerlo.
 */
export function isValidTracesEndpoint(value: string): boolean {
  if (value.startsWith("//")) return false;
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Ratio de muestreo.
 *
 * Un valor no numérico o fuera de [0, 1] es un error explícito y **no** se sustituye
 * por el valor por defecto: un `2` casi siempre significa que alguien creyó que se
 * expresaba en porcentaje, y silenciarlo dejaría un muestreo distinto del que se cree
 * haber configurado.
 */
function parseSampleRatio(value: string | undefined, fallback: number, issues: string[]): number {
  if (typeof value !== "string" || value.trim() === "") return fallback;

  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) {
    issues.push(`sampleRatio: "${value.trim()}" no es un número`);
    return fallback;
  }
  if (parsed < 0 || parsed > 1) {
    issues.push(`sampleRatio: ${parsed} está fuera del rango [0, 1]`);
    return fallback;
  }
  return parsed;
}

export function parseTelemetryInput(raw: TelemetryRawInput, defaults: TelemetryDefaults): TelemetryParseResult {
  const issues: string[] = [];

  const tracesEndpoint = textWithDefault(raw.tracesEndpoint, defaults.tracesEndpoint);
  if (!isValidTracesEndpoint(tracesEndpoint)) {
    issues.push(
      `tracesEndpoint: "${tracesEndpoint}" debe ser una ruta del mismo origen (/otel/v1/traces) o una URL http(s) absoluta`
    );
  }

  const sampleRatio = parseSampleRatio(raw.sampleRatio, defaults.sampleRatio, issues);

  const environment = isValidEnvironment(raw.environment?.trim().toLowerCase())
    ? (raw.environment!.trim().toLowerCase() as TelemetryEnvironment)
    : defaults.environment;

  if (issues.length > 0) return { success: false, issues };

  return {
    success: true,
    data: {
      enabled: booleanFlag(raw.enabled, false),
      serviceName: textWithDefault(raw.serviceName, defaults.serviceName),
      serviceNamespace: textWithDefault(raw.serviceNamespace, defaults.serviceNamespace),
      tracesEndpoint,
      sampleRatio,
      propagateToBackend: booleanFlag(raw.propagateToBackend, false),
      version: textWithDefault(raw.version, defaults.version),
      buildId: textWithDefault(raw.buildId, defaults.buildId),
      environment,
      debug: booleanFlag(raw.debug, false),
    },
  };
}
