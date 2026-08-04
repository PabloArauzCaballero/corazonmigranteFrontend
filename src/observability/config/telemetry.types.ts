/**
 * Tipos de la configuración pública de telemetría.
 *
 * Todo lo que hay aquí viaja al navegador: no puede contener secretos. La URL real
 * del Collector vive únicamente en el gateway del mismo origen
 * (`functions/otel/v1/traces.ts`), como variable de entorno del servidor.
 */

/** Entornos reconocidos. Cualquier otro valor se trata como `development`. */
export type TelemetryEnvironment = "development" | "test" | "staging" | "production";

export type TelemetryConfig = {
  /** Si es `false`, el SDK ni siquiera se descarga. */
  readonly enabled: boolean;
  /** `service.name` del recurso. Nunca se comparte con el servidor. */
  readonly serviceName: string;
  /** `service.namespace` del recurso. */
  readonly serviceNamespace: string;
  /** Ruta relativa del mismo origen (preferida) o URL absoluta del gateway. */
  readonly tracesEndpoint: string;
  /** Proporción de trazas raíz muestreadas, entre 0 y 1. */
  readonly sampleRatio: number;
  /**
   * Añade `traceparent` a las llamadas al backend. Apagado por defecto: activarlo
   * provoca preflight CORS y rompe la aplicación si el backend no acepta la cabecera.
   */
  readonly propagateToBackend: boolean;
  /** Origen del backend, derivado de `NEXT_PUBLIC_API_BASE_URL`. */
  readonly backendOrigin: string | undefined;
  /** `service.version`. */
  readonly version: string;
  /** Identificador del build (commit corto en CI, `local` fuera de CI). */
  readonly buildId: string;
  /** `${version}+${buildId}`; se usa como `app.release`. */
  readonly release: string;
  readonly environment: TelemetryEnvironment;
  /** Registra en consola lo que hace el SDK. Solo tiene efecto fuera de producción. */
  readonly debug: boolean;
};

/**
 * Resultado de resolver la configuración. `issues` nunca provoca una excepción:
 * una configuración inválida apaga la telemetría, no rompe la aplicación.
 */
export type TelemetryConfigResult = {
  readonly config: TelemetryConfig;
  readonly issues: readonly string[];
};
