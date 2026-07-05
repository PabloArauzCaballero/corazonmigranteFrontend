import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";
import { ROLES, type UserRole } from "@/shared/auth/roles";
import type { AdminUser, AdminUserStatus } from "@/features/users/users.types";
import { ApiError } from "@/shared/api/errors";

function normalizeRole(value: unknown): UserRole {
  const role = String(value ?? "").trim().toUpperCase();
  return ROLES.includes(role as UserRole) ? (role as UserRole) : "PACIENTE";
}

export function mapUser(item: unknown, index: number): AdminUser {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "user_id", "id_usuario", "uuid"], `usuario-${index + 1}`),
    name: getString(record, ["name", "nombre", "full_name", "nombre_completo", "displayName"], "Sin nombre"),
    email: getString(record, ["email", "correo", "correo_electronico"], "sin-correo@corazonmigrante.local"),
    role: normalizeRole(record.role ?? record.rol ?? record.tipo_usuario),
    status: normalizeStatus(record.status ?? record.estado ?? record.activo) as AdminUserStatus
  };
}

export async function listUsers(query: SistemaListQuery = {}): Promise<PaginatedResult<AdminUser>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapUser, query);
}

export type CreateUserInput = {
  role: "PACIENTE" | "TERAPEUTA" | "ADMIN" | "SUPER_ADMIN" | "CONTADOR";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  title?: string;
  mainSpecialty?: string;
  bio?: string;
  personalPhrase?: string;
};

export async function createUser(input: CreateUserInput) {
  if (input.role === "PACIENTE") {
    return apiRequest<unknown>(ENDPOINTS.auth.registerPatient, {
      method: "POST",
      body: {
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone
      },
      auth: false
    });
  }

  if (input.role === "TERAPEUTA") {
    return apiRequest<unknown>(ENDPOINTS.auth.registerTherapist, {
      method: "POST",
      body: {
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        title: input.title,
        mainSpecialty: input.mainSpecialty,
        bio: input.bio,
        personalPhrase: input.personalPhrase
      },
      auth: false
    });
  }

  throw new ApiError("El OpenAPI actual solo expone creacion de pacientes y terapeutas. Admin, super admin y contador requieren un endpoint administrativo dedicado.", 501);
}
