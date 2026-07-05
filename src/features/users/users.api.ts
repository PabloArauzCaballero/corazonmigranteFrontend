import { buildPublicAssetUrl } from "@/config/file-server";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { buildFileDownloadUrl } from "@/shared/api/files";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";
import { ROLES, type UserRole } from "@/shared/auth/roles";
import type { AdminUser, AdminUserStatus } from "@/features/users/users.types";
import { ApiError } from "@/shared/api/errors";

function replacePathParam(path: string, param: string, value: string) {
  return path.replace(`:${param}`, encodeURIComponent(value));
}

function normalizeRole(value: unknown): UserRole {
  const role = String(value ?? "").trim().toUpperCase();
  return ROLES.includes(role as UserRole) ? (role as UserRole) : "PACIENTE";
}

function resolveUserName(record: Record<string, unknown>) {
  const direct = getString(record, ["name", "nombre", "full_name", "nombre_completo", "displayName"], "");
  if (direct) return direct;

  const firstName = getString(record, ["firstName", "first_name", "nombres"], "");
  const lastName = getString(record, ["lastName", "last_name", "apellidos"], "");
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
    role: normalizeRole(record.role ?? record.rol ?? record.tipo_usuario),
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

const statusToBackend: Record<AdminUserStatus, string> = {
  activo: "ACTIVE",
  inactivo: "INACTIVE",
  bloqueado: "BLOCKED",
  pendiente: "PENDING"
};

export async function updateUserStatus(userId: string, status: AdminUserStatus) {
  return apiRequest<unknown>(replacePathParam(ENDPOINTS.users.updateStatus, "userId", userId), {
    method: "PATCH",
    body: { status: statusToBackend[status] }
  });
}
