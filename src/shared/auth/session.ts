import { z } from "zod";
import { ROLES, ROLE_PERMISSIONS, type Permission, type UserRole } from "@/shared/auth/roles";

export const sessionSchema = z.object({
  userId: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(ROLES),
  permissions: z.array(z.enum(["admin:read", "users:manage", "therapy:manage", "therapy:read_assigned", "products:manage", "public_content:manage", "accounting:read", "accounting:manage", "profile:read", "profile:update", "booking:create", "booking:create_for_patient"])),
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
  roles?: string[];
  is_admin?: boolean;
  is_super_admin?: boolean;
  is_terapeuta?: boolean;
  is_accounter?: boolean;
  token?: string;
  access_token?: string;
  status?: string;
  permissions?: string[];
};

const BACKEND_ROLE_MAP: Record<string, UserRole> = {
  PATIENT: "PACIENTE",
  PACIENTE: "PACIENTE",
  THERAPIST: "TERAPEUTA",
  TERAPEUTA: "TERAPEUTA",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  ACCOUNTANT: "CONTADOR",
  CONTADOR: "CONTADOR"
};

export function normalizeRole(input: LegacySessionInput): UserRole {
  const roles = Array.isArray(input.roles) ? input.roles : [];
  const rawCandidates = [input.role, input.rol, ...roles].map((value) => String(value ?? "").trim().toUpperCase()).filter(Boolean);
  for (const rawRole of rawCandidates) {
    const mapped = BACKEND_ROLE_MAP[rawRole];
    if (mapped) return mapped;
  }
  if (input.is_super_admin) return "SUPER_ADMIN";
  if (input.is_accounter) return "CONTADOR";
  if (input.is_admin) return "ADMIN";
  if (input.is_terapeuta) return "TERAPEUTA";
  return "PACIENTE";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type BackendSessionEnvelope = LegacySessionInput & {
  data?: BackendSessionEnvelope;
  user?: LegacySessionInput;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
};

function unwrapSessionInput(input: BackendSessionEnvelope): LegacySessionInput {
  if (isObjectRecord(input.data)) {
    return unwrapSessionInput(input.data as BackendSessionEnvelope);
  }

  if (input.user) {
    return { ...input.user, token: input.accessToken ?? input.token ?? input.user.token ?? input.user.access_token };
  }

  return input;
}

export function normalizeSession(input: BackendSessionEnvelope): NormalizedSession {
  const unwrapped = unwrapSessionInput(input);
  const role = normalizeRole(unwrapped);
  const permissions: Permission[] = ROLE_PERMISSIONS[role];
  const firstName = String((unwrapped as Record<string, unknown>).firstName ?? (unwrapped as Record<string, unknown>).first_name ?? "").trim();
  const lastName = String((unwrapped as Record<string, unknown>).lastName ?? (unwrapped as Record<string, unknown>).last_name ?? "").trim();
  const fallbackName = [firstName, lastName].filter(Boolean).join(" ");
  return sessionSchema.parse({
    userId: String(unwrapped.user_id ?? unwrapped.id ?? "unknown"),
    fullName: String(unwrapped.full_name ?? unwrapped.nombre ?? unwrapped.name ?? (fallbackName || "Usuario Corazón Migrante")),
    email: String(unwrapped.email ?? unwrapped.correo ?? "usuario@corazonmigrante.local"),
    role,
    permissions,
    token: unwrapped.token ?? unwrapped.access_token
  });
}
