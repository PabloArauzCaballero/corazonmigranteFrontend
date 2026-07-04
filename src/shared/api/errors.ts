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

export function humanizeApiError(error: unknown) {
  if (error instanceof ApiError) {
    const message = error.message?.trim();

    if (error.status === 401) {
      if (/credenciales|correo|contraseña|password|email/i.test(message)) return message;
      return "Tu sesión expiró o no está activa. Inicia sesión nuevamente.";
    }

    if (error.status === 403) return "No tienes permisos suficientes para realizar esta acción.";
    if (error.status === 422 || error.status === 400) return message || "Revisa los datos ingresados.";
    if (error.status === 501) return message;
    if (error.status >= 500) return message && /NEXT_PUBLIC_API_BASE_URL|sistema|servidor/i.test(message) ? message : "El servicio tuvo un problema. Intenta nuevamente en unos minutos.";
    return message || "No se pudo completar la comunicación con el servicio.";
  }
  return "No pudimos completar la acción. Verifica tu conexión e intenta de nuevo.";
}
