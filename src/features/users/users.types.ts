import type { UserRole } from "@/shared/auth/roles";

export type AdminUserStatus = "activo" | "inactivo" | "pendiente" | "bloqueado";
export type AdminUserRole = UserRole | "NO_EXPUESTO";

export type AdminTherapistProfile = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  mainSpecialty?: string;
  bio?: string;
  personalPhrase?: string;
  avatarFileId?: string;
};

export type AdminPatientProfile = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarFileId?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  avatarUrl?: string;
  therapistProfile?: AdminTherapistProfile;
  patientProfile?: AdminPatientProfile;
  raw?: Record<string, unknown>;
};
