import type { TutorialDefinition, TutorialStep } from "@/features/tutorial/model/tutorial.types";

/**
 * Máquina de estados del recorrido, escrita como reductor puro.
 *
 * Sacar la lógica de navegación fuera de los componentes permite probar avance,
 * retroceso, reanudación y errores de objetivo sin montar interfaz, y evita que la
 * regla de negocio del tutorial acabe repartida por el overlay y la tarjeta.
 */

export type TutorialPhase =
  /** No hay recorrido en curso. */
  | "inactivo"
  /** Buscando el elemento del paso (puede llegar de forma asíncrona). */
  | "resolviendo"
  /** Paso visible; se puede avanzar. */
  | "activo"
  /** Paso visible pero «Siguiente» bloqueado hasta que se haga la acción pedida. */
  | "esperando_accion"
  /** El elemento no apareció: se ofrece reintentar, continuar o cerrar. */
  | "objetivo_ausente"
  /** Se llegó al final del recorrido. */
  | "finalizado";

export type TutorialRunState = {
  tutorial: TutorialDefinition | null;
  stepIndex: number;
  phase: TutorialPhase;
  /** Sube en cada reintento para forzar una nueva búsqueda del objetivo. */
  attempt: number;
  /** Mensaje de error o ayuda a mostrar en la tarjeta. */
  message: string | null;
  /** Cómo se abrió el recorrido; el Centro lo usa para volver a su listado. */
  origin: "centro" | "automatico" | "manual" | null;
};

export type TutorialAction =
  | { type: "iniciar"; tutorial: TutorialDefinition; stepIndex?: number; origin: NonNullable<TutorialRunState["origin"]> }
  | { type: "objetivo_resuelto" }
  | { type: "objetivo_ausente"; message: string }
  | { type: "accion_cumplida" }
  | { type: "siguiente" }
  | { type: "anterior" }
  | { type: "ir_a_paso"; stepIndex: number }
  | { type: "reintentar" }
  | { type: "cerrar" };

export const initialRunState: TutorialRunState = {
  tutorial: null,
  stepIndex: 0,
  phase: "inactivo",
  attempt: 0,
  message: null,
  origin: null,
};

export function currentStep(state: TutorialRunState): TutorialStep | null {
  return state.tutorial?.steps[state.stepIndex] ?? null;
}

function needsInteraction(step: TutorialStep | null): boolean {
  return Boolean(step?.interaction && step.interaction.kind !== "ninguna");
}

function moveTo(state: TutorialRunState, stepIndex: number): TutorialRunState {
  return { ...state, stepIndex, phase: "resolviendo", attempt: 0, message: null };
}

export function tutorialReducer(state: TutorialRunState, action: TutorialAction): TutorialRunState {
  switch (action.type) {
    case "iniciar": {
      const stepIndex = clamp(action.stepIndex ?? 0, 0, Math.max(0, action.tutorial.steps.length - 1));
      return {
        tutorial: action.tutorial,
        stepIndex,
        phase: "resolviendo",
        attempt: 0,
        message: null,
        origin: action.origin,
      };
    }

    case "objetivo_resuelto": {
      if (state.phase === "inactivo" || state.phase === "finalizado") return state;
      return {
        ...state,
        phase: needsInteraction(currentStep(state)) ? "esperando_accion" : "activo",
        message: null,
      };
    }

    case "objetivo_ausente": {
      if (state.phase === "inactivo" || state.phase === "finalizado") return state;
      return { ...state, phase: "objetivo_ausente", message: action.message };
    }

    case "accion_cumplida": {
      if (state.phase !== "esperando_accion") return state;
      return { ...state, phase: "activo", message: null };
    }

    case "siguiente": {
      if (!state.tutorial) return state;
      const last = state.stepIndex >= state.tutorial.steps.length - 1;
      if (last) return { ...state, phase: "finalizado", message: null };
      return moveTo(state, state.stepIndex + 1);
    }

    case "anterior": {
      if (!state.tutorial || state.stepIndex === 0) return state;
      return moveTo(state, state.stepIndex - 1);
    }

    case "ir_a_paso": {
      if (!state.tutorial) return state;
      return moveTo(state, clamp(action.stepIndex, 0, state.tutorial.steps.length - 1));
    }

    case "reintentar": {
      if (!state.tutorial) return state;
      return { ...state, phase: "resolviendo", attempt: state.attempt + 1, message: null };
    }

    case "cerrar":
      return initialRunState;

    default:
      return state;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** `true` si el botón «Siguiente» debe estar habilitado. */
export function canAdvance(state: TutorialRunState): boolean {
  return state.phase === "activo" || state.phase === "objetivo_ausente";
}

/** Porcentaje del recorrido en curso. */
export function runProgress(state: TutorialRunState): number {
  if (!state.tutorial || state.tutorial.steps.length === 0) return 0;
  return Math.round(((state.stepIndex + 1) / state.tutorial.steps.length) * 100);
}
