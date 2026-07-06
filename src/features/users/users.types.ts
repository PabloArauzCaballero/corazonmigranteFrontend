import type { UserRole } from "@/shared/auth/roles";

export type AdminUserStatus = "activo" | "inactivo" | "pendiente" | "bloqueado";
export type AdminUserRole = UserRole | "NO_EXPUESTO";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  /**
   * El backend actual de GET /admin/users no expone roles ni perfiles.
   * Cuando el contrato no trae rol, se marca explícitamente como NO_EXPUESTO
   * para no mostrar pacientes como terapeutas por error.
   */
  role: AdminUserRole;
  status: AdminUserStatus;
  avatarUrl?: string;
};
