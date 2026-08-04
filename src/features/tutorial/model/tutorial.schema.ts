import { z } from "zod";
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS, type UserRole } from "@/shared/auth/roles";
import { isKnownRoute } from "@/features/tutorial/model/app-routes";
import {
  TUTORIAL_CATEGORIES,
  TUTORIAL_LEVELS,
  type TutorialDefinition,
} from "@/features/tutorial/model/tutorial.types";

/**
 * Validación estática del catálogo.
 *
 * El objetivo es que un tutorial mal escrito reviente en las pruebas (o en desarrollo)
 * y nunca en la cara de la persona usuaria: un paso sin objetivo, una ruta inexistente
 * o un requisito circular son errores de configuración, no de ejecución.
 */

const placementSchema = z.enum(["top", "bottom", "left", "right", "center"]);

const interactionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("ninguna") }),
  z.object({ kind: z.literal("click"), target: z.string().min(1).optional() }),
  z.object({
    kind: z.literal("escritura"),
    target: z.string().min(1).optional(),
    minLength: z.number().int().positive().optional(),
  }),
  z.object({ kind: z.literal("seleccion"), target: z.string().min(1).optional() }),
  z.object({ kind: z.literal("navegacion"), route: z.string().min(1) }),
  z.object({ kind: z.literal("aparicion"), target: z.string().min(1) }),
]);

export const tutorialStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  target: z.string().min(1).optional(),
  placement: placementSchema.optional(),
  route: z.string().min(1).optional(),
  order: z.number().int().positive(),
  interaction: interactionSchema.optional(),
  hint: z.string().min(1).optional(),
  errorMessage: z.string().min(1).optional(),
  autoAction: z.enum(["focus", "scroll", "abrir-menu"]).optional(),
  prepare: z.object({ target: z.string().min(1) }).optional(),
  waitForMs: z.number().int().nonnegative().optional(),
  roles: z.array(z.enum(ROLES)).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  interactiveTarget: z.boolean().optional(),
});

export const tutorialDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "La versión debe ser semántica (p. ej. 1.0.0)"),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(TUTORIAL_CATEGORIES),
  level: z.enum(TUTORIAL_LEVELS),
  route: z.string().min(1).optional(),
  roles: z.array(z.enum(ROLES)).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  audience: z.enum(["publica", "privada"]).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  prerequisites: z.array(z.string().min(1)).optional(),
  required: z.boolean().optional(),
  recommended: z.boolean().optional(),
  autoStart: z.boolean().optional(),
  nextTutorialId: z.string().min(1).optional(),
  steps: z.array(tutorialStepSchema).min(1, "Un tutorial debe tener al menos un paso"),
});

export type TutorialIssueSeverity = "error" | "aviso";

export type TutorialCatalogIssue = {
  severity: TutorialIssueSeverity;
  tutorialId: string;
  stepId?: string;
  code: string;
  message: string;
};

function issue(
  severity: TutorialIssueSeverity,
  tutorialId: string,
  code: string,
  message: string,
  stepId?: string,
): TutorialCatalogIssue {
  return { severity, tutorialId, code, message, stepId };
}

/** Roles efectivos de un tutorial: los declarados o todos si no restringe. */
function effectiveRoles(definition: TutorialDefinition): readonly UserRole[] {
  return definition.roles && definition.roles.length > 0 ? definition.roles : ROLES;
}

function detectPrerequisiteCycle(
  definitions: readonly TutorialDefinition[],
): TutorialCatalogIssue[] {
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  const state = new Map<string, "visitando" | "listo">();
  const found: TutorialCatalogIssue[] = [];

  function walk(id: string, trail: string[]) {
    const current = state.get(id);
    if (current === "listo") return;
    if (current === "visitando") {
      found.push(
        issue(
          "error",
          id,
          "prerequisito_circular",
          `Dependencia circular de prerrequisitos: ${[...trail, id].join(" → ")}`,
        ),
      );
      return;
    }
    state.set(id, "visitando");
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) {
      if (byId.has(prerequisite)) walk(prerequisite, [...trail, id]);
    }
    state.set(id, "listo");
  }

  for (const definition of definitions) walk(definition.id, []);
  return found;
}

/**
 * Valida el catálogo completo. Devuelve todos los problemas encontrados; los de
 * severidad `error` impiden registrar el tutorial.
 */
export function validateTutorialCatalog(
  input: readonly unknown[],
): { issues: TutorialCatalogIssue[]; valid: TutorialDefinition[] } {
  const issues: TutorialCatalogIssue[] = [];
  const valid: TutorialDefinition[] = [];
  const seenIds = new Set<string>();

  for (const [index, candidate] of input.entries()) {
    const parsed = tutorialDefinitionSchema.safeParse(candidate);
    const declaredId =
      typeof candidate === "object" && candidate !== null && "id" in candidate
        ? String((candidate as { id: unknown }).id)
        : `#${index}`;

    if (!parsed.success) {
      for (const problem of parsed.error.issues) {
        issues.push(
          issue(
            "error",
            declaredId,
            "forma_invalida",
            `${problem.path.join(".") || "(raíz)"}: ${problem.message}`,
          ),
        );
      }
      continue;
    }

    const definition = parsed.data as TutorialDefinition;

    if (seenIds.has(definition.id)) {
      issues.push(issue("error", definition.id, "id_duplicado", "Ya existe un tutorial con este id"));
      continue;
    }
    seenIds.add(definition.id);
    valid.push(definition);
  }

  const validIds = new Set(valid.map((definition) => definition.id));

  for (const definition of valid) {
    if (definition.route && !isKnownRoute(definition.route)) {
      issues.push(
        issue("error", definition.id, "ruta_inexistente", `La ruta «${definition.route}» no existe en la aplicación`),
      );
    }

    for (const prerequisite of definition.prerequisites ?? []) {
      if (!validIds.has(prerequisite)) {
        issues.push(
          issue("error", definition.id, "prerequisito_inexistente", `El prerrequisito «${prerequisite}» no existe`),
        );
      }
      if (prerequisite === definition.id) {
        issues.push(issue("error", definition.id, "prerequisito_circular", "Un tutorial no puede ser su propio prerrequisito"));
      }
    }

    if (definition.nextTutorialId && !validIds.has(definition.nextTutorialId)) {
      issues.push(
        issue(
          "error",
          definition.id,
          "siguiente_inexistente",
          `El tutorial enlazado «${definition.nextTutorialId}» no existe`,
        ),
      );
    }

    if (definition.autoStart && !definition.route) {
      issues.push(
        issue("error", definition.id, "autostart_sin_ruta", "Un tutorial con autoStart necesita `route` para saber dónde ofrecerse"),
      );
    }

    const roles = effectiveRoles(definition);
    for (const permission of definition.permissions ?? []) {
      const reachable = roles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
      if (!reachable) {
        issues.push(
          issue(
            "error",
            definition.id,
            "permiso_incompatible",
            `Ningún rol permitido (${roles.join(", ")}) tiene el permiso «${permission}»: el tutorial sería invisible`,
          ),
        );
      }
    }

    const stepIds = new Set<string>();
    definition.steps.forEach((step, index) => {
      if (stepIds.has(step.id)) {
        issues.push(issue("error", definition.id, "paso_duplicado", `Paso repetido «${step.id}»`, step.id));
      }
      stepIds.add(step.id);

      if (step.order !== index + 1) {
        issues.push(
          issue(
            "error",
            definition.id,
            "orden_invalido",
            `El paso «${step.id}» declara orden ${step.order} pero ocupa la posición ${index + 1}`,
            step.id,
          ),
        );
      }

      if (step.route && !isKnownRoute(step.route)) {
        issues.push(
          issue("error", definition.id, "ruta_inexistente", `La ruta «${step.route}» del paso no existe`, step.id),
        );
      }

      const interaction = step.interaction;
      if (interaction) {
        if (interaction.kind === "navegacion" && !isKnownRoute(interaction.route)) {
          issues.push(
            issue(
              "error",
              definition.id,
              "ruta_inexistente",
              `La navegación esperada apunta a «${interaction.route}», que no existe`,
              step.id,
            ),
          );
        }
        const needsTarget =
          interaction.kind === "click" || interaction.kind === "escritura" || interaction.kind === "seleccion";
        if (needsTarget && !interaction.target && !step.target) {
          issues.push(
            issue(
              "error",
              definition.id,
              "paso_sin_objetivo",
              `El paso «${step.id}» espera una acción (${interaction.kind}) pero no indica sobre qué elemento`,
              step.id,
            ),
          );
        }
      }

      if (step.prepare && !step.target) {
        issues.push(
          issue(
            "error",
            definition.id,
            "preparacion_sin_objetivo",
            `El paso «${step.id}» declara un desplegable a abrir pero no tiene objetivo que mostrar`,
            step.id,
          ),
        );
      }

      if (step.roles && definition.roles) {
        const compatible = step.roles.some((role) => definition.roles?.includes(role));
        if (!compatible) {
          issues.push(
            issue(
              "error",
              definition.id,
              "rol_incompatible",
              `El paso «${step.id}» solo se muestra a ${step.roles.join(", ")}, roles que el tutorial no admite`,
              step.id,
            ),
          );
        }
      }

      if (!step.target && step.placement && step.placement !== "center") {
        issues.push(
          issue(
            "aviso",
            definition.id,
            "posicion_sin_objetivo",
            `El paso «${step.id}» no tiene objetivo: se mostrará centrado y su posición declarada se ignora`,
            step.id,
          ),
        );
      }
    });
  }

  issues.push(...detectPrerequisiteCycle(valid));

  // Un id duplicado no invalida la definición que sí se aceptó (la primera): la copia
  // simplemente no se registra y queda constancia del choque.
  const blocking = new Set(
    issues
      .filter((item) => item.severity === "error" && item.code !== "id_duplicado")
      .map((item) => item.tutorialId),
  );
  return { issues, valid: valid.filter((definition) => !blocking.has(definition.id)) };
}

/** Formatea los problemas para logs y mensajes de prueba. */
export function formatCatalogIssues(issues: readonly TutorialCatalogIssue[]): string {
  return issues
    .map(
      (item) =>
        `[${item.severity}] ${item.tutorialId}${item.stepId ? ` › ${item.stepId}` : ""} (${item.code}): ${item.message}`,
    )
    .join("\n");
}
