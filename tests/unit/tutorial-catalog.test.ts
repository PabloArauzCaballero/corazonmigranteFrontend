import { TUTORIAL_CATALOG } from "@/features/tutorial/catalog";
import { formatCatalogIssues, validateTutorialCatalog } from "@/features/tutorial/model/tutorial.schema";
import type { TutorialDefinition } from "@/features/tutorial/model/tutorial.types";

function definition(overrides: Partial<TutorialDefinition> = {}): TutorialDefinition {
  return {
    id: "demo",
    version: "1.0.0",
    title: "Demo",
    description: "Recorrido de prueba",
    category: "navegacion",
    level: "basico",
    route: "/admin",
    steps: [{ id: "uno", title: "Uno", body: "Cuerpo", order: 1, placement: "center" }],
    ...overrides,
  };
}

describe("validación del catálogo de tutoriales", () => {
  it("el catálogo real no tiene errores de configuración", () => {
    const { issues } = validateTutorialCatalog(TUTORIAL_CATALOG);
    const blocking = issues.filter((item) => item.severity === "error");
    expect(formatCatalogIssues(blocking)).toBe("");
    expect(blocking).toHaveLength(0);
  });

  it("rechaza identificadores duplicados", () => {
    const { issues, valid } = validateTutorialCatalog([definition(), definition()]);
    expect(issues.some((item) => item.code === "id_duplicado")).toBe(true);
    expect(valid).toHaveLength(1);
  });

  it("rechaza tutoriales sin pasos", () => {
    const { issues } = validateTutorialCatalog([definition({ steps: [] })]);
    expect(issues.some((item) => item.code === "forma_invalida")).toBe(true);
  });

  it("rechaza pasos con orden incorrecto", () => {
    const { issues } = validateTutorialCatalog([
      definition({
        steps: [
          { id: "uno", title: "Uno", body: "Cuerpo", order: 1, placement: "center" },
          { id: "dos", title: "Dos", body: "Cuerpo", order: 5, placement: "center" },
        ],
      }),
    ]);
    expect(issues.some((item) => item.code === "orden_invalido")).toBe(true);
  });

  it("rechaza pasos repetidos dentro de un tutorial", () => {
    const { issues } = validateTutorialCatalog([
      definition({
        steps: [
          { id: "uno", title: "Uno", body: "Cuerpo", order: 1, placement: "center" },
          { id: "uno", title: "Otro", body: "Cuerpo", order: 2, placement: "center" },
        ],
      }),
    ]);
    expect(issues.some((item) => item.code === "paso_duplicado")).toBe(true);
  });

  it("rechaza rutas que no existen en la aplicación", () => {
    const { issues, valid } = validateTutorialCatalog([definition({ route: "/pantalla-inventada" })]);
    expect(issues.some((item) => item.code === "ruta_inexistente")).toBe(true);
    expect(valid).toHaveLength(0);
  });

  it("rechaza un paso que espera una acción sin decir sobre qué elemento", () => {
    const { issues } = validateTutorialCatalog([
      definition({
        steps: [{ id: "uno", title: "Uno", body: "Cuerpo", order: 1, interaction: { kind: "click" } }],
      }),
    ]);
    expect(issues.some((item) => item.code === "paso_sin_objetivo")).toBe(true);
  });

  it("rechaza prerrequisitos inexistentes y dependencias circulares", () => {
    const fantasma = validateTutorialCatalog([definition({ prerequisites: ["no-existe"] })]);
    expect(fantasma.issues.some((item) => item.code === "prerequisito_inexistente")).toBe(true);

    const ciclo = validateTutorialCatalog([
      definition({ id: "a", prerequisites: ["b"] }),
      definition({ id: "b", prerequisites: ["a"] }),
    ]);
    expect(ciclo.issues.some((item) => item.code === "prerequisito_circular")).toBe(true);
  });

  it("rechaza permisos que ningún rol permitido puede tener", () => {
    const { issues } = validateTutorialCatalog([
      definition({ roles: ["PACIENTE"], permissions: ["accounting:manage"] }),
    ]);
    expect(issues.some((item) => item.code === "permiso_incompatible")).toBe(true);
  });

  it("rechaza un paso restringido a roles que el tutorial no admite", () => {
    const { issues } = validateTutorialCatalog([
      definition({
        roles: ["PACIENTE"],
        steps: [{ id: "uno", title: "Uno", body: "Cuerpo", order: 1, roles: ["CONTADOR"], placement: "center" }],
      }),
    ]);
    expect(issues.some((item) => item.code === "rol_incompatible")).toBe(true);
  });

  it("rechaza autoStart sin ruta asociada", () => {
    const { issues } = validateTutorialCatalog([definition({ autoStart: true, route: undefined })]);
    expect(issues.some((item) => item.code === "autostart_sin_ruta")).toBe(true);
  });

  it("rechaza versiones que no son semánticas", () => {
    const { issues } = validateTutorialCatalog([definition({ version: "v1" })]);
    expect(issues.some((item) => item.code === "forma_invalida")).toBe(true);
  });

  it("rechaza un desplegable a abrir en un paso que no resalta nada", () => {
    const { issues } = validateTutorialCatalog([
      definition({
        steps: [{ id: "uno", title: "Uno", body: "Cuerpo", order: 1, prepare: { target: "menu-movil" } }],
      }),
    ]);
    expect(issues.some((item) => item.code === "preparacion_sin_objetivo")).toBe(true);
  });

  it("rechaza un enlace a un tutorial siguiente inexistente", () => {
    const { issues } = validateTutorialCatalog([definition({ nextTutorialId: "no-existe" })]);
    expect(issues.some((item) => item.code === "siguiente_inexistente")).toBe(true);
  });
});
