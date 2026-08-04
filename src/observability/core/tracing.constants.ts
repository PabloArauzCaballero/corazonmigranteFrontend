/**
 * Nombres estables de spans y atributos.
 *
 * Todo lo que se emite sale de aquí: no hay nombres construidos con plantillas de
 * cadena en tiempo de ejecución. Ver `docs/observability/frontend/02-naming-conventions.md`.
 */

/** Nombre del tracer. Se versiona con el paquete, no con el despliegue. */
export const TRACER_NAME = "corazon-migrante/web";
export const TRACER_VERSION = "1.0.0";

/** Spans técnicos creados por código propio (los de las instrumentaciones oficiales no se renombran). */
export const TECHNICAL_SPANS = {
  routeNavigation: "route.navigation",
  httpClient: "http.client",
  uiInteraction: "ui.interaction",
  sseConnect: "sse.connect",
  sseMessage: "sse.message",
  clientError: "client.error",
} as const;

/**
 * Catálogo **cerrado** de spans de negocio.
 *
 * Contiene solo nombres que se emiten de verdad: una constante declarada y nunca usada
 * es código muerto que además hace creer que existe una traza que nadie va a encontrar
 * en Jaeger. Para añadir uno hay que (1) instrumentar la operación, (2) añadirlo aquí y
 * (3) documentarlo en `03-business-spans-catalog.md`, con el formato `<dominio>.<acción>`.
 * El test `business-spans.test.ts` comprueba que constante y documento no divergen.
 */
export const BUSINESS_SPANS = {
  authLogin: "auth.login",
  authLogout: "auth.logout",
  authSessionExpired: "auth.session.expired",
  patientRegister: "patient.register",
  appointmentRequest: "appointment.request",
  appointmentStatusUpdate: "appointment.status.update",
  documentUpload: "document.upload",
  documentDownload: "document.download",
} as const;

export type BusinessSpanName = (typeof BUSINESS_SPANS)[keyof typeof BUSINESS_SPANS];

/** Claves de atributo permitidas. El sanitizador rechaza cualquier otra. */
export const ATTR = {
  feature: "app.feature",
  operation: "app.operation",
  routeTemplate: "app.route.template",
  routeFrom: "app.route.from",
  routeTo: "app.route.to",
  release: "app.release",
  buildId: "app.build.id",
  environment: "app.environment",
  authenticated: "app.authenticated",
  userSegment: "app.user.segment",
  sessionId: "app.session.id",
  supportTraceRef: "app.support.trace_ref",

  uiComponent: "ui.component",
  uiAction: "ui.action",
  uiResult: "ui.result",
  uiFormName: "ui.form.name",
  uiNavigationType: "ui.navigation.type",

  networkRequestType: "network.request.type",

  validationSuccess: "validation.success",
  validationErrorCount: "validation.error.count",

  authMethod: "auth.method",
  authResult: "auth.result",
  authFailureCategory: "auth.failure.category",

  fileType: "file.type",
  fileExtension: "file.extension",
  fileSizeBucket: "file.size.bucket",
  uploadStrategy: "upload.strategy",

  errorType: "error.type",
  errorSource: "error.source",
  errorHandled: "error.handled",

  cacheResult: "cache.result",
  retryCount: "retry.count",

  webVitalName: "web_vital.name",
  webVitalValue: "web_vital.value",
  webVitalRating: "web_vital.rating",
} as const;

/** Conjunto de claves permitidas, para validación en tiempo de ejecución. */
export const ALLOWED_ATTRIBUTE_KEYS: ReadonlySet<string> = new Set([
  ...Object.values(ATTR),
  // Convenciones semánticas oficiales que sí se permiten tal cual.
  "http.request.method",
  "http.response.status_code",
  "server.address",
  "url.path",
]);

export const UI_RESULT = {
  success: "success",
  error: "error",
  cancelled: "cancelled",
} as const;

export const NAVIGATION_TYPE = {
  spa: "spa",
  reload: "reload",
  backForward: "back-forward",
} as const;

export const ERROR_SOURCE = {
  window: "window",
  promise: "promise",
  react: "react",
  http: "http",
  chunk: "chunk",
} as const;

export const AUTH_FAILURE_CATEGORY = {
  invalidCredentials: "invalid_credentials",
  expiredSession: "expired_session",
  networkError: "network_error",
  serverError: "server_error",
  validationError: "validation_error",
  rateLimited: "rate_limited",
  unknown: "unknown",
} as const;

export const USER_SEGMENT = {
  anonymous: "anonymous",
  patient: "patient",
  professional: "professional",
  staff: "staff",
} as const;

export const FILE_SIZE_BUCKETS = ["0-1MB", "1-5MB", "5-20MB", "20-100MB", "100MB+"] as const;

/** Límite de longitud de cualquier valor de atributo de texto. */
export const MAX_ATTRIBUTE_LENGTH = 256;

/** Techo de los contadores, para que no se conviertan en dimensiones de alta cardinalidad. */
export const MAX_COUNTER_VALUE = 99;
