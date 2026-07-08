import { buildPublicAssetUrl } from "@/config/file-server";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { buildFileDownloadUrl, uploadFile } from "@/shared/api/files";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";
import { ApiError } from "@/shared/api/errors";
import { ROLES, type UserRole } from "@/shared/auth/roles";
import type { AdminPatientProfile, AdminTherapistProfile, AdminUser, AdminUserRole, AdminUserStatus } from "@/features/users/users.types";

function normalizeRole(value: unknown): AdminUserRole {
  const role = String(value ?? "").trim().toUpperCase();
  const normalized = role === "PATIENT" ? "PACIENTE" : role === "THERAPIST" ? "TERAPEUTA" : role;
  return ROLES.includes(normalized as UserRole) ? (normalized as UserRole) : "NO_EXPUESTO";
}

function nestedRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return undefined;
}

function profileString(profile: Record<string, unknown> | undefined, keys: string[], fallback = "") {
  return profile ? getString(profile, keys, fallback) : fallback;
}

function mapTherapistProfile(record: Record<string, unknown>): AdminTherapistProfile | undefined {
  const profile = nestedRecord(record, ["therapistProfile", "therapist_profile", "perfilTerapeuta"]);
  if (!profile) return undefined;
  return {
    firstName: profileString(profile, ["firstName", "first_name", "nombre", "nombres"]),
    lastName: profileString(profile, ["lastName", "last_name", "apellido", "apellidos"]),
    phone: profileString(profile, ["phone", "telefono", "celular"]),
    title: profileString(profile, ["title", "titulo", "professionalTitle", "professional_title"]),
    mainSpecialty: profileString(profile, ["mainSpecialty", "main_specialty", "specialty", "especialidad"]),
    bio: profileString(profile, ["bio", "biography", "descripcion"]),
    personalPhrase: profileString(profile, ["personalPhrase", "personal_phrase", "frase"]),
    avatarFileId: profileString(profile, ["avatarFileId", "avatar_file_id", "photoFileId", "photo_file_id"])
  };
}

function mapPatientProfile(record: Record<string, unknown>): AdminPatientProfile | undefined {
  const profile = nestedRecord(record, ["patientProfile", "patient_profile", "perfilPaciente"]);
  if (!profile) return undefined;
  return {
    firstName: profileString(profile, ["firstName", "first_name", "nombre", "nombres"]),
    lastName: profileString(profile, ["lastName", "last_name", "apellido", "apellidos"]),
    phone: profileString(profile, ["phone", "telefono", "celular"]),
    avatarFileId: profileString(profile, ["avatarFileId", "avatar_file_id", "photoFileId", "photo_file_id"])
  };
}

function resolveUserName(record: Record<string, unknown>) {
  const direct = getString(record, ["name", "nombre", "full_name", "nombre_completo", "displayName"], "");
  if (direct) return direct;

  const profile = nestedRecord(record, ["patientProfile", "patient_profile", "therapistProfile", "therapist_profile", "adminProfile", "admin_profile"]);
  const firstName = getString(record, ["firstName", "first_name", "nombres"], profileString(profile, ["firstName", "first_name", "nombres"], ""));
  const lastName = getString(record, ["lastName", "last_name", "apellidos"], profileString(profile, ["lastName", "last_name", "apellidos"], ""));
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
  return combined || "Sin nombre";
}

function resolveUserAvatar(record: Record<string, unknown>) {
  const direct = getString(record, ["avatarUrl", "avatar_url", "photoUrl", "photo_url", "imageUrl", "image_url", "fotoUrl", "publicUrl", "downloadUrl", "url"], "");
  if (direct) return direct;

  for (const profile of [
    nestedRecord(record, ["therapistProfile", "therapist_profile"]),
    nestedRecord(record, ["patientProfile", "patient_profile"]),
    record
  ]) {
    if (!profile) continue;
    const profileDirect = getString(profile, ["avatarUrl", "avatar_url", "photoUrl", "photo_url", "imageUrl", "image_url", "fotoUrl", "publicUrl", "downloadUrl", "url"], "");
    if (profileDirect) return profileDirect;

    const objectKey = getString(profile, ["avatarObjectKey", "avatar_object_key", "photoObjectKey"], "");
    const publicUrl = buildPublicAssetUrl(objectKey);
    if (publicUrl) return publicUrl;

    const fileId = getString(profile, ["avatarFileId", "avatar_file_id", "photoFileId", "photo_file_id", "fileId", "file_id"], "");
    const built = buildFileDownloadUrl(fileId);
    if (built) return built;
  }

  return undefined;
}

export function mapUser(item: unknown, index: number): AdminUser {
  const record = isRecord(item) ? item : {};
  const therapistProfile = mapTherapistProfile(record);
  const patientProfile = mapPatientProfile(record);
  const roleSource = therapistProfile
    ? "THERAPIST"
    : patientProfile
      ? "PATIENT"
      : record.role ?? record.rol ?? record.tipo_usuario ?? record.roleCode ?? record.role_code ?? (Array.isArray(record.roles) ? record.roles[0] : undefined);

  return {
    id: getString(record, ["id", "user_id", "id_usuario", "uuid"], `usuario-${index + 1}`),
    name: resolveUserName(record),
    email: getString(record, ["email", "correo", "correo_electronico"], "sin-correo@corazonmigrante.local"),
    role: normalizeRole(roleSource),
    status: normalizeStatus(record.status ?? record.estado ?? record.activo) as AdminUserStatus,
    avatarUrl: resolveUserAvatar(record),
    therapistProfile,
    patientProfile,
    raw: record
  };
}

export async function listUsers(query: SistemaListQuery = {}): Promise<PaginatedResult<AdminUser>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapUser, query);
}

export async function listPatients(query: SistemaListQuery = {}): Promise<PaginatedResult<AdminUser>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.users.patients}${buildQueryString(query)}`);
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
  avatarFileId?: string;
};

function cleanInput(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      return true;
    })
  );
}

function statusToServidor(status: AdminUserStatus) {
  if (status === "bloqueado") return "BLOCKED";
  if (status === "pendiente") return "PENDING";
  if (status === "inactivo") return "INACTIVE";
  return "ACTIVE";
}

export async function updateTherapistProfileByAdmin(userId: string, input: UpdateTherapistProfileInput) {
  return apiRequest<unknown>(ENDPOINTS.users.updateTherapist.replace(":userId", userId), {
    method: "PATCH",
    body: cleanInput(input as Record<string, unknown>)
  });
}

export async function updateUserStatus(userId: string, status: AdminUserStatus) {
  return apiRequest<unknown>(ENDPOINTS.users.updateStatus.replace(":userId", userId), {
    method: "PATCH",
    body: { status: statusToServidor(status) }
  });
}

export async function attachUserAvatarByAdmin(userId: string, fileId: string) {
  return apiRequest<unknown>(ENDPOINTS.users.updateAvatar.replace(":userId", userId), {
    method: "PATCH",
    body: { avatarFileId: fileId }
  });
}

export async function uploadUserPhotoByAdmin(userId: string, file: File) {
  const uploaded = await uploadFile({ file, module: "USER_PROFILE", entityType: "USER", entityId: userId, visibility: "PUBLIC" });
  if (!uploaded.fileId) {
    throw new ApiError("El servidor subió el archivo, pero no devolvió el id del archivo para vincularlo al perfil.", 500, uploaded.raw);
  }
  const attached = await attachUserAvatarByAdmin(userId, uploaded.fileId);
  return { ...uploaded, attached };
}
