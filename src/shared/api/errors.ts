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
    if (error.status === 401) return "Tu sesión expiró o no está activa. Inicia sesión nuevamente.";
    if (error.status === 403) return "No tienes permisos suficientes para realizar esta acción.";
    if (error.status === 422 || error.status === 400) return error.message || "Revisa los datos ingresados.";
    if (error.status >= 500) return "El servidor tuvo un problema. Intenta nuevamente en unos minutos.";
    return error.message;
  }
  return "No pudimos completar la acción. Verifica tu conexión e intenta de nuevo.";
}
