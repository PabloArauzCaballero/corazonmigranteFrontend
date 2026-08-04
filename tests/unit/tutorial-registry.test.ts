import { ROLE_PERMISSIONS } from "@/shared/auth/roles";
import { tutorialRegistry } from "@/features/tutorial/catalog";
import {
  ANONYMOUS_CONTEXT,
  TutorialRegistry,
  canAccessTutorial,
  stepsFor,
} from "@/features/tutorial/registry/tutorial-registry";
import type { TutorialAccessContext, TutorialDefinition } from "@/features/tutorial/model/tutorial.types";

const patientContext: TutorialAccessContext = {
  role: "PACIENTE",
  permissions: ROLE_PERMISSIONS.PACIENTE,
  isAuthenticated: true,
};
const adminContext: TutorialAccessContext = {
  role: "ADMIN",
  permissions: ROLE_PERMISSIONS.ADMIN,
  isAuthenticated: true,
};
const accountantContext: TutorialAccessContext = {
  role: "CONTADOR",
  permissions: ROLE_PERMISSIONS.CONTADOR,
  isAuthenticated: true,
};

describe("registro de tutoriales", () => {
  it("registra el catálogo real sin problemas bloqueantes", () => {
    expect(tutorialRegistry.issues.filter((item) => item.severity === "error")).toHaveLength(0);
    expect(tutorialRegistry.list().length).toBeGreaterThan(9);
  });

  it("no registra dos veces el mismo identificador", () => {
    const definition: TutorialDefinition = {
      id: "repetido",
      version: "1.0.0",
      title: "Repetido",
      description: "Prueba",
      category: "navegacion",
      level: "basico",
      steps: [{ id: "uno", title: "Uno", body: "Cuerpo", order: 1, placement: "center" }],
    };
    const registry = new TutorialRegistry([definition]);
    const issues = registry.registerAll([definition]);
    expect(issues.some((item) => item.code === "id_duplicado")).toBe(true);
    expect(registry.list()).toHaveLength(1);
  });

  it("sin sesión solo se ven los recorridos públicos", () => {
    const visible = tutorialRegistry.listFor(ANONYMOUS_CONTEXT);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.every((item) => (item.audience ?? "publica") === "publica")).toBe(true);
    expect(visible.some((item) => item.id === "publico-introduccion")).toBe(true);
  });

  it("un paciente no ve tutoriales del panel administrativo", () => {
    const visible = tutorialRegistry.listFor(patientContext).map((item) => item.id);
    expect(visible).toContain("paciente-navegacion");
    expect(visible).not.toContain("admin-navegacion");
    expect(visible).not.toContain("contabilidad-introduccion");
  });

  it("un administrador sin permiso contable no ve el tutorial de contabilidad", () => {
    const visible = tutorialRegistry.listFor(adminContext).map((item) => item.id);
    expect(visible).toContain("admin-navegacion");
    expect(visible).not.toContain("contabilidad-introduccion");
  });

  it("una cuenta de contabilidad ve su tutorial pero no el de contenido", () => {
    const visible = tutorialRegistry.listFor(accountantContext).map((item) => item.id);
    expect(visible).toContain("contabilidad-introduccion");
    expect(visible).not.toContain("admin-publicaciones");
  });

  it("los obligatorios se ordenan antes que el resto", () => {
    const visible = tutorialRegistry.listFor(patientContext);
    const firstOptional = visible.findIndex((item) => !item.required);
    const lastRequired = visible.map((item) => Boolean(item.required)).lastIndexOf(true);
    expect(lastRequired).toBeLessThan(firstOptional);
  });

  it("resuelve un tutorial por ruta, del más específico al más general", () => {
    const found = tutorialRegistry.forRoute("/paciente/booking", patientContext);
    expect(found[0]?.id).toBe("paciente-reservar-cita");
  });

  it("solo devuelve tutorial automático en la pantalla que lo declara", () => {
    expect(tutorialRegistry.autoStartFor("/paciente", patientContext)?.id).toBe("paciente-navegacion");
    expect(tutorialRegistry.autoStartFor("/paciente/perfil", patientContext)).toBeUndefined();
  });

  it("resolve devuelve undefined cuando el rol no puede acceder", () => {
    expect(tutorialRegistry.resolve("admin-navegacion", patientContext)).toBeUndefined();
    expect(tutorialRegistry.resolve("paciente-navegacion", patientContext)?.id).toBe("paciente-navegacion");
  });

  it("filtra los pasos restringidos por rol y renumera el orden", () => {
    const definition: TutorialDefinition = {
      id: "mixto",
      version: "1.0.0",
      title: "Mixto",
      description: "Prueba",
      category: "navegacion",
      level: "basico",
      steps: [
        { id: "todos", title: "Todos", body: "Cuerpo", order: 1, placement: "center" },
        { id: "solo-admin", title: "Solo admin", body: "Cuerpo", order: 2, roles: ["ADMIN"], placement: "center" },
        { id: "final", title: "Final", body: "Cuerpo", order: 3, placement: "center" },
      ],
    };
    const steps = stepsFor(definition, patientContext);
    expect(steps.map((step) => step.id)).toEqual(["todos", "final"]);
    expect(steps.map((step) => step.order)).toEqual([1, 2]);
  });

  it("canAccessTutorial nunca deja pasar un permiso que el rol no tiene", () => {
    const definition: TutorialDefinition = {
      id: "contable",
      version: "1.0.0",
      title: "Contable",
      description: "Prueba",
      category: "contabilidad",
      level: "basico",
      permissions: ["accounting:manage"],
      steps: [{ id: "uno", title: "Uno", body: "Cuerpo", order: 1, placement: "center" }],
    };
    expect(canAccessTutorial(definition, adminContext)).toBe(false);
    expect(canAccessTutorial(definition, accountantContext)).toBe(true);
  });
});
