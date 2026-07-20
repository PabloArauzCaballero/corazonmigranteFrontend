export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (typeof value === "object" && value !== null) return Object.values(value as Record<string, unknown>).flatMap(collectStrings);
  return [];
}

function extractPayloadMessage(value: unknown): string | null {
  const strings = collectStrings(value)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/^HTTP_\d+$/.test(item));

  const preferred = strings.find((item) => !["Bad Request", "Unauthorized", "Forbidden", "Internal Server Error"].includes(item));
  return preferred ?? strings[0] ?? null;
}

export function humanizeApiError(error: unknown) {
  if (error instanceof ApiError) {
    const payloadMessage = extractPayloadMessage(error.details);
    const message = payloadMessage || error.message?.trim();

    if (error.status === 0) return message || "No se pudo conectar con el servidor. Revisa URL, CORS o conexión.";
    if (error.status === 401) {
      const all = collectStrings(error.details).join(" ");
      const credentialMessage = collectStrings(error.details)
        .map((item) => item.trim())
        .find((item) => /credenciales|contraseña|password|email|AUTH_INVALID_CREDENTIALS/i.test(item));
      if (credentialMessage) return /AUTH_INVALID_CREDENTIALS/i.test(credentialMessage) ? "Credenciales inválidas." : credentialMessage;
      if (/credenciales|correo|contraseña|password|email|AUTH_INVALID_CREDENTIALS/i.test(`${message ?? ""} ${all}`)) return message && !/AUTH_INVALID_CREDENTIALS/i.test(message) ? message : "Credenciales inválidas.";
      return "Tu sesión expiró o no está activa. Inicia sesión nuevamente.";
    }

    if (error.status === 403) return message || "No tienes permisos suficientes para realizar esta acción.";
    if (error.status === 404) return message || "El recurso solicitado no existe en el servidor.";
    if (error.status === 422 || error.status === 400) return message || "Revisa los datos ingresados.";
    if (error.status === 501) return message || "Esta acción todavía no está implementada en el servidor.";
    if (error.status >= 500) return message && /NEXT_PUBLIC_API_BASE_URL|sistema|servidor|database|relation|column/i.test(message) ? message : "El servidor tuvo un problema. Intenta nuevamente en unos minutos.";
    return message || "Error de comunicación con el servidor.";
  }

  if (error instanceof Error) {
    if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return "No se pudo conectar con el servidor. Revisa la URL del servidor, CORS o si el servicio está levantado.";
    }
    return error.message || "Error de comunicación con el servidor.";
  }

  const payloadMessage = extractPayloadMessage(error);
  return payloadMessage || "Error de comunicación con el servidor.";
}
