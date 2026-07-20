import { dashboardForRole, hasPermission, hasRole } from "@/shared/auth/roles";
import { normalizeSession } from "@/shared/auth/session";

describe("session and RBAC normalization", () => {
  it("normalizes legacy admin flags into one canonical role", () => {
    const session = normalizeSession({ id: 10, nombre: "Admin", correo: "admin@cm.test", is_admin: true, token: "token" });

    expect(session.role).toBe("ADMIN");
    expect(session.userId).toBe("10");
    expect(session.fullName).toBe("Admin");
    expect(session.permissions).toContain("users:manage");
  });

  it("prioritizes super admin, accounting flags, and backend role codes correctly", () => {
    expect(normalizeSession({ email: "super@cm.test", is_super_admin: true }).role).toBe("SUPER_ADMIN");
    expect(normalizeSession({ email: "contador@cm.test", is_accounter: true }).role).toBe("CONTADOR");
    expect(normalizeSession({ email: "terapeuta@cm.test", is_terapeuta: true }).role).toBe("TERAPEUTA");
    expect(normalizeSession({ id: "p1", email: "p@cm.test", roles: ["PATIENT"], token: "t" }).role).toBe("PACIENTE");
    expect(normalizeSession({ accessToken: "tok", user: { id: "t1", email: "t@cm.test", roles: ["THERAPIST"] } }).role).toBe("TERAPEUTA");
  });


  it("unwraps the real /api/v1/auth/login response envelope", () => {
    const session = normalizeSession({
      data: {
        accessToken: "jwt-token",
        refreshToken: "refresh-token",
        user: { id: "u1", email: "patient@cm.test", roles: ["PATIENT"], status: "ACTIVE" }
      }
    });

    expect(session.userId).toBe("u1");
    expect(session.email).toBe("patient@cm.test");
    expect(session.role).toBe("PACIENTE");
    expect(session.token).toBe("jwt-token");
  });

  it("captures the token from a flat response using camelCase accessToken", () => {
    const session = normalizeSession({
      id: "a1",
      email: "admin@cm.test",
      roles: ["ADMIN"],
      accessToken: "flat-jwt"
    });

    expect(session.role).toBe("ADMIN");
    expect(session.token).toBe("flat-jwt");
  });

  it("validates role and permission helpers", () => {
    expect(hasRole("ADMIN", ["ADMIN", "SUPER_ADMIN"])).toBe(true);
    expect(hasRole("PACIENTE", ["ADMIN", "SUPER_ADMIN"])).toBe(false);
    expect(hasPermission("CONTADOR", "accounting:manage")).toBe(true);
    expect(hasPermission("TERAPEUTA", "accounting:manage")).toBe(false);
    expect(dashboardForRole("PACIENTE")).toBe("/paciente");
    expect(dashboardForRole("CONTADOR")).toBe("/admin/contabilidad");
  });
});
