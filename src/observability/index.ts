/**
 * Superficie pública del módulo de observabilidad.
 *
 * El resto de la aplicación importa **solo desde aquí**. Nada de lo que hay en
 * `browser/` es público: ese subárbol carga el SDK y debe entrar únicamente por el
 * `import()` dinámico de `src/instrumentation-client.ts`.
 *
 * Ningún símbolo de este módulo menciona Jaeger: cambiar de backend de trazas no toca
 * una sola línea de la aplicación.
 */

export {
  addEvent,
  getActiveSpanId,
  getActiveTraceId,
  getTraceContext,
  recordException,
  runInSpan,
  runInSpanSync,
  setAttribute,
  setAttributes,
  setTelemetryRole,
  startSpan,
  tracingService,
  type TracingService,
} from "@/observability/core/tracing.service";

export { reportError, type ErrorSource, type ReportErrorInput } from "@/observability/core/report-error";

export {
  ATTR,
  AUTH_FAILURE_CATEGORY,
  BUSINESS_SPANS,
  ERROR_SOURCE,
  NAVIGATION_TYPE,
  TECHNICAL_SPANS,
  UI_RESULT,
  USER_SEGMENT,
  type BusinessSpanName,
} from "@/observability/core/tracing.constants";

export {
  authFailureCategory,
  fileExtension,
  fileSizeBucket,
  fileTypeFamily,
  type AuthFailureCategory,
} from "@/observability/core/tracing.attributes";

export { apiRouteTemplate, currentRouteTemplate, routeTemplateFromPath } from "@/observability/core/route-template";

export { rotateTelemetrySessionId, telemetrySessionId, userSegmentFromRole } from "@/observability/core/session-id";

export { telemetryConfig } from "@/observability/config/telemetry.config";
export type { TelemetryConfig } from "@/observability/config/telemetry.types";

export {
  traceFormSubmit,
  traceFormValidationFailure,
  type FormTracingContext,
} from "@/observability/react/form-tracing";

export { TelemetryProvider } from "@/observability/react/telemetry-provider";
export { TelemetryErrorBoundary } from "@/observability/react/telemetry-boundary";
export { reportReactError } from "@/observability/react/react-error-reporter";
export { REACT_ERROR_BOUNDARIES, type ReactErrorBoundaryName } from "@/observability/react/react-error.types";
