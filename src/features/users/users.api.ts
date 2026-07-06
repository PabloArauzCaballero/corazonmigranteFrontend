import { buildPublicAssetUrl } from "@/config/file-server";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { buildFileDownloadUrl } from "@/shared/api/files";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";
import { ROLES, type UserRole } from "@/shared/auth/roles";
import type { AdminUser, AdminUserRole, AdminUserStatus } from "@/features/users/users.types";
import { ApiError } from "@/shared/api/errors";


function normalizeRole(value: unknown): AdminUserRole {
  const role = String(value ?? "").trim().toUpperCase();
  return ROLES.includes(role as UserRole) ? (role as UserRole) : "NO_EXPUESTO";
}

function resolveUserName(record: Record<string, unknown>) {
  const direct = getString(record, ["name", "nombre", "full_name", "nombre_completo", "displayName"], "");
  if (direct) return direct;

  const profile = isRecord(record.patientProfile) ? record.patientProfile : isRecord(record.therapistProfile) ? record.therapistProfile : isRecord(record.adminProfile) ? record.adminProfile : {};
  const firstName = getString(record, ["firstName", "first_name", "nombres"], getString(profile, ["firstName", "first_name", "nombres"], ""));
  const lastName = getString(record, ["lastName", "last_name", "apellidos"], getString(profile, ["lastName", "last_name", "apellidos"], ""));
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  return combined || "Sin nombre";
}

function resolveUserAvatar(record: Record<string, unknown>) {
  const direct = getString(record, ["avatarUrl", "avatar_url", "photoUrl", "photo_url", "imageUrl", "image_url", "fotoUrl"], "");
  if (direct) return direct;

  const objectKey = getString(record, ["avatarObjectKey", "avatar_object_key", "photoObjectKey"], "");
  const publicUrl = buildPublicAssetUrl(objectKey);
  if (publicUrl) return publicUrl;

  const fileId = getString(record, ["avatarFileId", "avatar_file_id", "photoFileId", "photo_file_id", "fileId", "file_id"], "");
  return buildFileDownloadUrl(fileId);
}

export function mapUser(item: unknown, index: number): AdminUser {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "user_id", "id_usuario", "uuid"], `usuario-${index + 1}`),
    name: resolveUserName(record),
    email: getString(record, ["email", "correo", "correo_electronico"], "sin-correo@corazonmigrante.local"),
    role: normalizeRole(record.role ?? record.rol ?? record.tipo_usuario ?? record.roleCode ?? record.role_code),
    status: normalizeStatus(record.status ?? record.estado ?? record.activo) as AdminUserStatus,
    avatarUrl: resolveUserAvatar(record)
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

export type UpdateTherapistProfileInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  mainSpecialty?: string;
  bio?: string;
  personalPhrase?: string;
};

/**
 * El backend incluido en este zip todavía no expone edición administrativa de perfil
 * ni cambio de estado por usuario. Se bloquea en cliente para no disparar 404/400
 * confusos ni enviar campos fuera de contrato.
 */
export async function updateTherapistProfileByAdmin(_userId: string, _input: UpdateTherapistProfileInput) {
  throw new ApiError("El backend actual no expone PATCH /api/v1/admin/users/:userId/therapist-profile. Edita el perfil desde la sesión del terapeuta o agrega ese endpoint al backend.", 501);
}

export async function updateUserStatus(_userId: string, _status: AdminUserStatus) {
  throw new ApiError("El backend actual no expone PATCH /api/v1/admin/users/:userId/status. El cambio de estado requiere un endpoint administrativo en el backend.", 501);
}
