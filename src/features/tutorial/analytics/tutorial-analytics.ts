import { ATTR, TECHNICAL_SPANS, UI_RESULT, runInSpanSync } from "@/observability";

/**
 * Medición del uso de los tutoriales.
 *
 * El motor emite eventos contra esta interfaz en vez de llamar a una herramienta
 * concreta: cambiar de proveedor consiste en pasar otro adaptador al `TutorialProvider`.
 * Nunca se envían datos personales — solo identificadores del catálogo.
 */

export type TutorialAnalyticsEventName =
  | "tutorial_iniciado"
  | "tutorial_paso"
  | "tutorial_completado"
  | "tutorial_omitido"
  | "tutorial_reiniciado"
  | "tutorial_objetivo_ausente";

export type TutorialAnalyticsEvent = {
  name: TutorialAnalyticsEventName;
  tutorialId: string;
  version: string;
  stepId?: string;
  detail?: string;
};

export interface TutorialAnalyticsAdapter {
  track(event: TutorialAnalyticsEvent): void;
}

export const silentAnalytics: TutorialAnalyticsAdapter = {
  track: () => {},
};

/**
 * Adaptador de desarrollo: deja los eventos en consola para poder depurar un recorrido
 * paso a paso.
 */
export const consoleAnalytics: TutorialAnalyticsAdapter = {
  track: (event) => {
    if (process.env.NODE_ENV === "production") return;
    console.info(`[tutoriales] ${event.name}`, event);
  },
};

/** Un objetivo que no aparece es un fallo del recorrido; el resto son eventos normales. */
function resultOf(name: TutorialAnalyticsEventName): string {
  if (name === "tutorial_objetivo_ausente") return UI_RESULT.error;
  if (name === "tutorial_omitido") return UI_RESULT.cancelled;
  return UI_RESULT.success;
}

/**
 * Adaptador de telemetría.
 *
 * Emite cada evento como un span `ui.interaction` con atributos del catálogo permitido
 * (`src/observability/core/tracing.constants.ts`): no introduce nombres ni claves nuevas,
 * así que no toca el catálogo cerrado del módulo de observabilidad. Si la telemetría
 * está apagada, `runInSpanSync` es inerte y esto no cuesta nada.
 */
export const telemetryAnalytics: TutorialAnalyticsAdapter = {
  track: (event) => {
    runInSpanSync(
      TECHNICAL_SPANS.uiInteraction,
      {
        [ATTR.feature]: "tutorials",
        [ATTR.operation]: event.name,
        [ATTR.uiComponent]: event.tutorialId,
        [ATTR.uiAction]: event.stepId ?? event.detail ?? event.version,
        [ATTR.uiResult]: resultOf(event.name),
      },
      () => undefined,
    );
  },
};

/** Reenvía cada evento a todos los adaptadores; uno que falle no frena a los demás. */
export function composeAnalytics(...adapters: TutorialAnalyticsAdapter[]): TutorialAnalyticsAdapter {
  return {
    track: (event) => {
      for (const adapter of adapters) {
        try {
          adapter.track(event);
        } catch (error) {
          // Medir nunca debe romper un tutorial en curso.
          console.warn("[tutoriales] un adaptador de analítica falló", error);
        }
      }
    },
  };
}

export const defaultAnalytics: TutorialAnalyticsAdapter =
  process.env.NODE_ENV === "production"
    ? telemetryAnalytics
    : composeAnalytics(telemetryAnalytics, consoleAnalytics);
