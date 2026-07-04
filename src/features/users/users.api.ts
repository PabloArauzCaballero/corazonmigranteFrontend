import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";
import { ROLES, type UserRole } from "@/shared/auth/roles";
import type { AdminUser, AdminUserStatus } from "@/features/users/users.types";

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
