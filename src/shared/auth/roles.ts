export const ROLES = ["PACIENTE", "TERAPEUTA", "ADMIN", "SUPER_ADMIN", "CONTADOR"] as const;
export type UserRole = (typeof ROLES)[number];

export const PERMISSIONS = [
  "admin:read",
  "users:manage",
  "therapy:manage",
  "therapy:read_assigned",
  "products:manage",
  "public_content:manage",
  "accounting:read",
  "accounting:manage",
  "profile:read",
  "profile:update",
  "booking:create"
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  PACIENTE: ["profile:read", "profile:update", "booking:create"],
  TERAPEUTA: ["profile:read", "profile:update", "therapy:read_assigned"],
  ADMIN: ["admin:read", "users:manage", "therapy:manage", "products:manage", "public_content:manage"],
  SUPER_ADMIN: [
    "admin:read",
    "users:manage",
    "therapy:manage",
    "products:manage",
    "public_content:manage",
    "accounting:read",
    "accounting:manage",
    "profile:read",
    "profile:update"
  ],
  CONTADOR: ["admin:read", "accounting:read", "accounting:manage", "profile:read", "profile:update"]
};

export function hasRole(role: UserRole | undefined, allowedRoles: UserRole[]) {
  return Boolean(role && allowedRoles.includes(role));
}

export function hasPermission(role: UserRole | undefined, permission: Permission) {
  return Boolean(role && ROLE_PERMISSIONS[role]?.includes(permission));
}

export function dashboardForRole(role: UserRole) {
  switch (role) {
    case "PACIENTE":
      return "/paciente";
    case "TERAPEUTA":
      return "/terapeuta";
    case "CONTADOR":
      return "/admin/contabilidad";
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
  }
}
