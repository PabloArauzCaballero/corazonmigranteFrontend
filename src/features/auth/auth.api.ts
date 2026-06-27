import { isDemoMode } from "@/config/env";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { normalizeSession, type LegacySessionInput, type NormalizedSession } from "@/shared/auth/session";
import type { LoginInput, RegisterPatientInput } from "@/features/auth/auth.schemas";

export async function login(input: LoginInput): Promise<NormalizedSession> {
  if (isDemoMode) {
    return normalizeSession({
      id: "demo-user",
      full_name: input.roleHint === "PACIENTE" ? "Paciente Demo" : "Equipo Demo",
      email: input.email,
      role: input.roleHint ?? "PACIENTE",
      token: "demo-token"
    });
  }

  const response = await apiRequest<LegacySessionInput>(ENDPOINTS.auth.login, {
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
  if (isDemoMode) {
    return { ok: true };
  }

  return apiRequest<{ ok: boolean }>(ENDPOINTS.auth.registerPatient, {
    method: "POST",
    body: {
      nombre: input.fullName,
      email: input.email,
      password: input.password,
      pais_actual: input.country,
      motivo_consulta: input.reason
    },
    auth: false
  });
}
