import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { normalizeSession, type LegacySessionInput, type NormalizedSession } from "@/shared/auth/session";
import type { LoginInput, RegisterPatientInput } from "@/features/auth/auth.schemas";

type BackendLoginResponse = LegacySessionInput | { accessToken?: string; token?: string; user?: LegacySessionInput };

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? fullName.trim();
  const lastName = parts.join(" ") || "No especificado";
  return { firstName, lastName };
}

export async function login(input: LoginInput): Promise<NormalizedSession> {
  const response = await apiRequest<BackendLoginResponse>(ENDPOINTS.auth.login, {
    method: "POST",
    body: {
      email: input.email,
      password: input.password
    },
    auth: false
  });

  return normalizeSession(response);
}

export async function registerPatient(input: RegisterPatientInput) {
  const { firstName, lastName } = splitFullName(input.fullName);
  return apiRequest<{ id: string; email: string; status: string }>(ENDPOINTS.auth.registerPatient, {
    method: "POST",
    body: {
      firstName,
      lastName,
      email: input.email,
      password: input.password,
      country: input.country,
      city: input.city,
      phone: input.phone,
      occupation: input.occupation,
      reason: input.reason
    },
    auth: false
  });
}
