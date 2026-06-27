import type { UserRole } from "@/shared/auth/roles";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "activo" | "inactivo";
};
