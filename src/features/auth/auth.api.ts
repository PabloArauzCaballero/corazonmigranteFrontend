import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { ApiError } from "@/shared/api/errors";
import { normalizeSession, type LegacySessionInput, type NormalizedSession } from "@/shared/auth/session";
import type { LoginInput, RegisterPatientInput } from "@/features/auth/auth.schemas";
import { ATTR, BUSINESS_SPANS, authFailureCategory, runInSpan } from "@/observability";

type SistemaLoginResponse = LegacySessionInput | { accessToken?: string; token?: string; user?: LegacySessionInput };

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? fullName.trim();
  const lastName = parts.join(" ") || "No especificado";
  return { firstName, lastName };
}

/**
 * Categoría de fallo a partir del error, sin revelar nunca si la cuenta existe.
 *
 * Un correo inexistente y una contraseña incorrecta producen exactamente
 * `invalid_credentials`: distinguirlos en la telemetría convertiría Jaeger en una
 * herramienta de enumeración de usuarios. Ver Fase 20 y `02-naming-conventions.md`.
 */
function failureCategory(error: unknown) {
  return authFailureCategory(error instanceof ApiError ? error.status : undefined);
}

export async function login(input: LoginInput): Promise<NormalizedSession> {
  return runInSpan(
    BUSINESS_SPANS.authLogin,
    {
      [ATTR.feature]: "auth",
      [ATTR.operation]: "login",
      [ATTR.authMethod]: "password",
      [ATTR.uiFormName]: "login"
    },
    async (span) => {
      try {
        // Nada del cuerpo entra en el span: ni el correo, ni por supuesto la contraseña.
        const response = await apiRequest<SistemaLoginResponse>(ENDPOINTS.auth.login, {
          method: "POST",
          body: {
            email: input.email,
            password: input.password
          },
          auth: false
        });

        const session = normalizeSession(response);
        span.setAttributes({ [ATTR.authResult]: "success", [ATTR.uiResult]: "success" });
        return session;
      } catch (error) {
        span.setAttributes({
          [ATTR.authResult]: "failure",
          [ATTR.authFailureCategory]: failureCategory(error),
          [ATTR.uiResult]: "error"
        });
        throw error;
      }
    }
  );
}

export async function registerPatient(input: RegisterPatientInput) {
  const { firstName, lastName } = splitFullName(input.fullName);

  return runInSpan(
    BUSINESS_SPANS.patientRegister,
    {
      [ATTR.feature]: "auth",
      [ATTR.operation]: "register",
      [ATTR.uiFormName]: "register-patient"
    },
    async (span) => {
      try {
        // El cuerpo lleva nombre, correo, teléfono, país, ciudad y ocupación: ninguno
        // de esos campos se refleja en el span, solo el hecho de que se registró.
        const created = await apiRequest<{ id: string; email: string; status: string }>(
          ENDPOINTS.auth.registerPatient,
          {
            method: "POST",
            body: {
              firstName,
              lastName,
              email: input.email,
              password: input.password,
              country: input.country,
              city: input.city,
              phone: input.phone,
              occupation: input.occupation
            },
            auth: false
          }
        );

        span.setAttribute(ATTR.uiResult, "success");
        return created;
      } catch (error) {
        span.setAttributes({
          [ATTR.uiResult]: "error",
          [ATTR.authFailureCategory]: failureCategory(error)
        });
        throw error;
      }
    }
  );
}
