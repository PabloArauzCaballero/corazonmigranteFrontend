import { z } from "zod";
import { ROLES, ROLE_PERMISSIONS, type Permission, type UserRole } from "@/shared/auth/roles";

export const sessionSchema = z.object({
  userId: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(ROLES),
  permissions: z.array(z.enum(["admin:read", "users:manage", "therapy:manage", "therapy:read_assigned", "products:manage", "public_content:manage", "accounting:read", "accounting:manage", "profile:read", "profile:update", "booking:create"])),
  token: z.string().min(1).optional()
});

export type NormalizedSession = z.infer<typeof sessionSchema>;

export type LegacySessionInput = {
  id?: string | number;
  user_id?: string | number;
  full_name?: string;
  nombre?: string;
  name?: string;
  email?: string;
  correo?: string;
  role?: string;
  rol?: string;
  is_admin?: boolean;
  is_super_admin?: boolean;
  is_terapeuta?: boolean;
  is_accounter?: boolean;
  token?: string;
  access_token?: string;
};

export function normalizeRole(input: LegacySessionInput): UserRole {
  const rawRole = String(input.role ?? input.rol ?? "").trim().toUpperCase();
  if (ROLES.includes(rawRole as UserRole)) return rawRole as UserRole;
  if (input.is_super_admin) return "SUPER_ADMIN";
  if (input.is_accounter) return "CONTADOR";
  if (input.is_admin) return "ADMIN";
  if (input.is_terapeuta) return "TERAPEUTA";
  return "PACIENTE";
}

export function normalizeSession(input: LegacySessionInput): NormalizedSession {
  const role = normalizeRole(input);
  const permissions: Permission[] = ROLE_PERMISSIONS[role];
  return sessionSchema.parse({
    userId: String(input.user_id ?? input.id ?? "unknown"),
    fullName: String(input.full_name ?? input.nombre ?? input.name ?? "Usuario Corazón Migrante"),
    email: String(input.email ?? input.correo ?? "usuario@corazonmigrante.local"),
    role,
    permissions,
    token: input.token ?? input.access_token
  });
}
