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
  return env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
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
    const message = typeof payload === "object" && payload !== null && "message" in payload ? String((payload as { message: unknown }).message) : "Error de comunicación con el servidor";
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
