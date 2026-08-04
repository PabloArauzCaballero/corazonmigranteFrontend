import * as otelApi from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { attachOtelApi, detachOtelApi } from "@/observability/core/otel-api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { StackContextManager, WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { resolveTelemetryConfig } from "@/observability/config/telemetry.config";
import type { TelemetryConfig } from "@/observability/config/telemetry.types";
import { buildInstrumentations } from "@/observability/browser/browser-instrumentations";
import { buildSpanProcessor } from "@/observability/browser/browser-exporter";
import { buildBrowserResource } from "@/observability/browser/browser-resource";
import { buildSampler } from "@/observability/browser/browser-sampling";
import { installGlobalErrorHandlers, uninstallGlobalErrorHandlers } from "@/observability/browser/browser-errors";
import { installLifecycleFlush, uninstallLifecycleFlush } from "@/observability/browser/browser-lifecycle";

/**
 * Arranque de OpenTelemetry en el navegador (Fase 5).
 *
 * Criterios de aceptación que este archivo garantiza:
 *  - no se inicializa durante el prerenderizado (`next build` ejecuta el árbol de React
 *    en Node, donde no hay `window`);
 *  - no se inicializa dos veces, ni siquiera con Hot Module Replacement;
 *  - no rompe la hidratación: no toca el DOM ni el HTML;
 *  - la aplicación funciona con la telemetría apagada y con el Collector caído.
 */

type TelemetryHandle = {
  readonly provider: WebTracerProvider;
  shutdown: () => Promise<void>;
};

/**
 * El estado vive en `globalThis` y no en una variable de módulo porque el HMR de Next
 * reevalúa el módulo entero: una variable normal volvería a `undefined` y se
 * registraría un segundo proveedor sobre el primero.
 */
const STATE_KEY = "__corazonMigranteTelemetry__";

type GlobalWithTelemetry = typeof globalThis & { [STATE_KEY]?: TelemetryHandle };

function globalState(): GlobalWithTelemetry {
  return globalThis as GlobalWithTelemetry;
}

/**
 * El SDK necesita `PerformanceObserver` y `fetch`. En un navegador que no los tenga se
 * desactiva en silencio: la aplicación es lo importante, la telemetría no.
 */
function browserSupportsTelemetry(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof PerformanceObserver !== "undefined" &&
    typeof fetch === "function"
  );
}

function enableDiagnostics(config: TelemetryConfig) {
  if (!config.debug) return;
  otelApi.diag.setLogger(new otelApi.DiagConsoleLogger(), otelApi.DiagLogLevel.WARN);
}

function createProvider(config: TelemetryConfig): WebTracerProvider {
  const provider = new WebTracerProvider({
    resource: buildBrowserResource(config),
    sampler: buildSampler(config),
    spanProcessors: [buildSpanProcessor(config)],
  });

  provider.register({
    // Gestor de contexto basado en pila. No se usa `ZoneContextManager` a propósito:
    // ver la nota sobre `zone.js` en `tracing.service.ts` y en el documento 01.
    contextManager: new StackContextManager(),
    // Solo `tracecontext`. Sin `baggage`: no hay ningún atributo aprobado que deba
    // cruzar el límite de servicio, y es el vector más fácil para filtrar datos.
    propagator: new W3CTraceContextPropagator(),
  });

  return provider;
}

/**
 * Inicializa la telemetría. Es idempotente y no lanza nunca: cualquier fallo deja la
 * aplicación exactamente como estaba.
 */
export function initBrowserTelemetry(): TelemetryHandle | undefined {
  const state = globalState();
  if (state[STATE_KEY]) return state[STATE_KEY];

  if (!browserSupportsTelemetry()) return undefined;

  const { config, issues } = resolveTelemetryConfig();
  if (!config.enabled || issues.length > 0) return undefined;

  try {
    enableDiagnostics(config);

    const provider = createProvider(config);

    registerInstrumentations({
      instrumentations: buildInstrumentations(config),
      tracerProvider: provider,
    });

    // A partir de aquí `tracing.service` deja de ser inerte. Se engancha DESPUÉS de
    // registrar proveedor e instrumentaciones para que ningún span nazca huérfano.
    attachOtelApi(otelApi);

    installGlobalErrorHandlers();
    installLifecycleFlush(provider);

    const handle: TelemetryHandle = {
      provider,
      shutdown: async () => {
        uninstallGlobalErrorHandlers();
        uninstallLifecycleFlush();
        detachOtelApi();
        delete state[STATE_KEY];
        await provider.shutdown().catch(() => {
          // Apagar la telemetría nunca puede propagar un fallo.
        });
      },
    };

    state[STATE_KEY] = handle;
    return handle;
  } catch (error) {
    // Un fallo aquí es un fallo de la telemetría, no de la aplicación.
    if (config.debug) console.warn("[telemetry] no se pudo inicializar:", error);
    return undefined;
  }
}

/** Handle activo, si lo hay. Se usa en tests y en el vaciado manual. */
export function currentTelemetry(): TelemetryHandle | undefined {
  return globalState()[STATE_KEY];
}

/** Vaciado de mejor esfuerzo, sin bloquear a quien lo llame. */
export function flushTelemetry(): void {
  void currentTelemetry()
    ?.provider.forceFlush()
    .catch(() => {
      // Silencio deliberado.
    });
}
