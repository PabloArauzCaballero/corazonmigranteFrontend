import type { UserRole } from "@/shared/auth/roles";

export type AdminUserStatus = "activo" | "inactivo" | "pendiente" | "bloqueado";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AdminUserStatus;
  avatarUrl?: string;
};
