import { hasPermission, hasRole } from "@/shared/auth/roles";
import { normalizeRoute, routeMatches } from "@/features/tutorial/model/app-routes";
import {
  formatCatalogIssues,
  validateTutorialCatalog,
  type TutorialCatalogIssue,
} from "@/features/tutorial/model/tutorial.schema";
import type {
  TutorialAccessContext,
  TutorialDefinition,
  TutorialStep,
} from "@/features/tutorial/model/tutorial.types";

/**
 * Registro de tutoriales.
 *
 * Añadir un tutorial consiste en escribir su definición y registrarla en el catálogo:
 * el motor, el overlay y el Centro de ayuda no se tocan. El registro valida al
 * construirse y descarta lo que esté mal configurado, dejando rastro en consola para
 * que el error se vea en desarrollo sin romper la aplicación en producción.
 */
export class TutorialRegistry {
  private readonly definitions = new Map<string, TutorialDefinition>();
  private readonly catalogIssues: TutorialCatalogIssue[] = [];

  constructor(input: readonly unknown[] = []) {
    if (input.length > 0) this.registerAll(input);
  }

  registerAll(input: readonly unknown[]): TutorialCatalogIssue[] {
    const { issues, valid } = validateTutorialCatalog(input);
    const duplicated = valid.filter((definition) => this.definitions.has(definition.id));
    for (const definition of duplicated) {
      issues.push({
        severity: "error",
        tutorialId: definition.id,
        code: "id_duplicado",
        message: "Ya había un tutorial registrado con este id",
      });
    }

    for (const definition of valid) {
      if (!this.definitions.has(definition.id)) this.definitions.set(definition.id, definition);
    }

    this.catalogIssues.push(...issues);
    return issues;
  }

  /** Problemas detectados al registrar. Vacío significa catálogo sano. */
  get issues(): readonly TutorialCatalogIssue[] {
    return this.catalogIssues;
  }

  get(id: string): TutorialDefinition | undefined {
    return this.definitions.get(id);
  }

  list(): TutorialDefinition[] {
    return [...this.definitions.values()];
  }

  /** Tutoriales visibles para el contexto dado, con sus pasos ya filtrados. */
  listFor(context: TutorialAccessContext): TutorialDefinition[] {
    return this.list()
      .filter((definition) => canAccessTutorial(definition, context))
      .map((definition) => ({ ...definition, steps: stepsFor(definition, context) }))
      .filter((definition) => definition.steps.length > 0)
      .sort(byPriority);
  }

  /** Tutorial completo (pasos filtrados) o `undefined` si el contexto no puede verlo. */
  resolve(id: string, context: TutorialAccessContext): TutorialDefinition | undefined {
    const definition = this.definitions.get(id);
    if (!definition || !canAccessTutorial(definition, context)) return undefined;
    const steps = stepsFor(definition, context);
    return steps.length > 0 ? { ...definition, steps } : undefined;
  }

  /** Tutoriales asociados a la pantalla actual, del más específico al más general. */
  forRoute(pathname: string, context: TutorialAccessContext): TutorialDefinition[] {
    return this.listFor(context)
      .filter((definition) => definition.route && routeMatches(definition.route, pathname))
      .sort((a, b) => (b.route?.length ?? 0) - (a.route?.length ?? 0));
  }

  /**
   * Tutorial que debe ofrecerse al entrar por primera vez en una pantalla.
   *
   * Exige coincidencia EXACTA de ruta (no de subruta): el recorrido de bienvenida de
   * `/paciente` no debe saltar solo al abrir `/paciente/perfil`.
   */
  autoStartFor(pathname: string, context: TutorialAccessContext): TutorialDefinition | undefined {
    const current = normalizeRoute(pathname);
    return this.listFor(context).find(
      (definition) => definition.autoStart && definition.route && normalizeRoute(definition.route) === current,
    );
  }
}

/** Obligatorios primero, luego recomendados, y dentro de cada grupo por nivel. */
const LEVEL_WEIGHT = { basico: 0, intermedio: 1, avanzado: 2 } as const;

function byPriority(a: TutorialDefinition, b: TutorialDefinition): number {
  const required = Number(Boolean(b.required)) - Number(Boolean(a.required));
  if (required !== 0) return required;
  const recommended = Number(Boolean(b.recommended)) - Number(Boolean(a.recommended));
  if (recommended !== 0) return recommended;
  const level = LEVEL_WEIGHT[a.level] - LEVEL_WEIGHT[b.level];
  if (level !== 0) return level;
  return a.title.localeCompare(b.title, "es");
}

/**
 * Reglas de visibilidad. Un tutorial nunca puede servir para saltarse un permiso: si
 * el rol no tiene acceso al módulo, el recorrido tampoco existe para esa persona.
 */
export function canAccessTutorial(
  definition: TutorialDefinition,
  context: TutorialAccessContext,
): boolean {
  const audience = definition.audience ?? (definition.roles?.length ? "privada" : "publica");
  if (audience === "privada" && !context.isAuthenticated) return false;
  if (definition.roles?.length && !hasRole(context.role, definition.roles)) return false;
  for (const permission of definition.permissions ?? []) {
    if (!hasPermission(context.role, permission)) return false;
  }
  return true;
}

/** `true` si el paso concreto aplica al contexto (rol y permisos). */
export function canRunStep(step: TutorialStep, context: TutorialAccessContext): boolean {
  if (step.roles?.length && !hasRole(context.role, step.roles)) return false;
  for (const permission of step.permissions ?? []) {
    if (!hasPermission(context.role, permission)) return false;
  }
  return true;
}

/** Pasos aplicables al contexto, renumerados para que el progreso sea coherente. */
export function stepsFor(
  definition: TutorialDefinition,
  context: TutorialAccessContext,
): TutorialStep[] {
  return definition.steps
    .filter((step) => canRunStep(step, context))
    .map((step, index) => ({ ...step, order: index + 1 }));
}

/** Contexto sin sesión: solo ve los recorridos públicos. */
export const ANONYMOUS_CONTEXT: TutorialAccessContext = { isAuthenticated: false };

export function reportCatalogIssues(registry: TutorialRegistry): void {
  const blocking = registry.issues.filter((item) => item.severity === "error");
  if (blocking.length === 0) return;
  // Un catálogo mal configurado es un fallo de desarrollo: se registra en consola con
  // el detalle completo en vez de silenciarse, pero sin tumbar la aplicación.
  console.error(`[tutoriales] catálogo con problemas:\n${formatCatalogIssues(blocking)}`);
}
