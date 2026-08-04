import type {
  TutorialDefinition,
  TutorialProgressMap,
  TutorialProgressRecord,
  TutorialViewStatus,
} from "@/features/tutorial/model/tutorial.types";

/**
 * Lógica de progreso, sin React ni almacenamiento: decide qué estado tiene un tutorial
 * para una persona concreta y cómo evoluciona ese estado con cada acción.
 */

/** Reloj inyectable para que las pruebas no dependan de la hora real. */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

export function emptyRecord(definition: TutorialDefinition, clock: Clock = systemClock): TutorialProgressRecord {
  return {
    tutorialId: definition.id,
    version: definition.version,
    status: "sin_empezar",
    lastInteractionAt: clock().toISOString(),
    repetitions: 0,
  };
}

/**
 * Estrategia de versionado: si el tutorial cambió de versión mayor respecto a la que
 * completó la persona, el recorrido se considera «desactualizado» y el Centro invita a
 * repetirlo. Un cambio menor o de parche (correcciones de texto) no molesta a nadie.
 */
export function isOutdated(record: TutorialProgressRecord | undefined, definition: TutorialDefinition): boolean {
  if (!record || record.status === "sin_empezar") return false;
  return majorOf(record.version) !== majorOf(definition.version);
}

function majorOf(version: string): string {
  return version.split(".")[0] ?? version;
}

export function viewStatus(
  definition: TutorialDefinition,
  progress: TutorialProgressMap,
): TutorialViewStatus {
  const record = progress[definition.id];
  if (!record) return "sin_empezar";
  if (isOutdated(record, definition)) return "desactualizado";
  return record.status;
}

/** Porcentaje del tutorial concreto según el paso en el que quedó. */
export function tutorialCompletion(
  definition: TutorialDefinition,
  progress: TutorialProgressMap,
): number {
  const record = progress[definition.id];
  if (!record || record.status === "sin_empezar") return 0;
  if (record.status === "completado" && !isOutdated(record, definition)) return 100;
  const index = definition.steps.findIndex((step) => step.id === record.currentStepId);
  if (index < 0) return record.status === "completado" ? 100 : 0;
  return Math.round((index / definition.steps.length) * 100);
}

/** Porcentaje global: cuántos de los tutoriales visibles están completados y al día. */
export function overallCompletion(
  definitions: readonly TutorialDefinition[],
  progress: TutorialProgressMap,
): number {
  if (definitions.length === 0) return 0;
  const done = definitions.filter((definition) => viewStatus(definition, progress) === "completado").length;
  return Math.round((done / definitions.length) * 100);
}

/** Prerrequisitos que aún no están completados (se muestran como bloqueo suave). */
export function pendingPrerequisites(
  definition: TutorialDefinition,
  definitions: readonly TutorialDefinition[],
  progress: TutorialProgressMap,
): TutorialDefinition[] {
  const byId = new Map(definitions.map((item) => [item.id, item]));
  return (definition.prerequisites ?? [])
    .map((id) => byId.get(id))
    .filter((item): item is TutorialDefinition => Boolean(item))
    .filter((item) => viewStatus(item, progress) !== "completado");
}

type TransitionInput = {
  definition: TutorialDefinition;
  previous?: TutorialProgressRecord;
  clock?: Clock;
};

export function markStarted({ definition, previous, clock = systemClock }: TransitionInput): TutorialProgressRecord {
  const now = clock().toISOString();
  const restarting = previous?.status === "completado" || previous?.status === "omitido";
  return {
    tutorialId: definition.id,
    version: definition.version,
    status: "en_progreso",
    currentStepId: definition.steps[0]?.id,
    startedAt: restarting || !previous?.startedAt ? now : previous.startedAt,
    completedAt: undefined,
    lastInteractionAt: now,
    repetitions: previous?.repetitions ?? 0,
    dismissed: previous?.dismissed,
  };
}

export function markStep(
  { definition, previous, clock = systemClock }: TransitionInput,
  stepId: string,
): TutorialProgressRecord {
  const base = previous ?? emptyRecord(definition, clock);
  return {
    ...base,
    version: definition.version,
    status: "en_progreso",
    currentStepId: stepId,
    startedAt: base.startedAt ?? clock().toISOString(),
    lastInteractionAt: clock().toISOString(),
  };
}

export function markCompleted({ definition, previous, clock = systemClock }: TransitionInput): TutorialProgressRecord {
  const now = clock().toISOString();
  const base = previous ?? emptyRecord(definition, clock);
  return {
    ...base,
    version: definition.version,
    status: "completado",
    currentStepId: definition.steps[definition.steps.length - 1]?.id,
    startedAt: base.startedAt ?? now,
    completedAt: now,
    lastInteractionAt: now,
    repetitions: base.repetitions + 1,
  };
}

export function markSkipped(
  { definition, previous, clock = systemClock }: TransitionInput,
  atStepId?: string,
): TutorialProgressRecord {
  const now = clock().toISOString();
  const base = previous ?? emptyRecord(definition, clock);
  return {
    ...base,
    version: definition.version,
    status: "omitido",
    currentStepId: atStepId ?? base.currentStepId,
    startedAt: base.startedAt ?? now,
    lastInteractionAt: now,
  };
}

/** «No volver a mostrarme este tutorial automáticamente». */
export function markDismissed({ definition, previous, clock = systemClock }: TransitionInput): TutorialProgressRecord {
  const base = previous ?? emptyRecord(definition, clock);
  return { ...base, dismissed: true, lastInteractionAt: clock().toISOString() };
}

/** Reinicio: se conserva el histórico de repeticiones, se borra el avance. */
export function markReset({ definition, previous, clock = systemClock }: TransitionInput): TutorialProgressRecord {
  return {
    ...emptyRecord(definition, clock),
    repetitions: previous?.repetitions ?? 0,
    dismissed: previous?.dismissed,
  };
}

/** Índice desde el que se reanuda un tutorial; 0 si no hay avance utilizable. */
export function resumeIndex(
  definition: TutorialDefinition,
  progress: TutorialProgressMap,
): number {
  const record = progress[definition.id];
  if (!record || record.status !== "en_progreso" || !record.currentStepId) return 0;
  const index = definition.steps.findIndex((step) => step.id === record.currentStepId);
  return index >= 0 ? index : 0;
}
