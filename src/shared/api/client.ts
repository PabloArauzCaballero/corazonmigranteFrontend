import { env } from "@/config/env";
import { ApiError } from "@/shared/api/errors";
import { readClientSession } from "@/shared/auth/cookies";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

function apiBaseUrl() {
  if (!env.NEXT_PUBLIC_API_BASE_URL) {
    throw new ApiError("NEXT_PUBLIC_API_BASE_URL no está configurado. Revisa .env.local.", 500);
  }

  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");

  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const currentOrigin = window.location.origin.replace(/\/$/, "");
    const isLocalFrontendOrigin = currentOrigin === baseUrl && /localhost|127\.0\.0\.1/.test(window.location.hostname);

    if (isLocalFrontendOrigin) {
      throw new ApiError(
        "NEXT_PUBLIC_API_BASE_URL está apuntando al frontend. Este proyecto corre por defecto en 4173; configura la API en otro puerto, por ejemplo NEXT_PUBLIC_API_BASE_URL=http://localhost:3000.",
        500
      );
    }
  }

  return baseUrl;
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function extractErrorMessage(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = (payload as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(" ");
    if (typeof message === "string") return message;
  }

  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const error = (payload as { error: unknown }).error;
    if (typeof error === "object" && error !== null && "message" in error) {
      const message = (error as { message: unknown }).message;
      if (Array.isArray(message)) return message.join(" ");
      if (typeof message === "string") return message;
    }
  }

  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const data = (payload as { data: unknown }).data;
    if (typeof data === "object" && data !== null && "message" in data) {
      const message = (data as { message: unknown }).message;
      if (Array.isArray(message)) return message.join(" ");
      if (typeof message === "string") return message;
    }
  }

  return "No se pudo completar la comunicación con el servicio";
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && typeof window !== "undefined") {
    const session = readClientSession();
    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
  }

  const requestBody: BodyInit | undefined = isFormData
    ? (options.body as FormData)
    : options.body !== undefined
      ? JSON.stringify(options.body)
      : undefined;

  const response = await fetch(`${apiBaseUrl()}${normalizePath(path)}`, {
    ...options,
    headers,
    body: requestBody
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(payload), response.status, payload);
  }

  return payload as T;
}
