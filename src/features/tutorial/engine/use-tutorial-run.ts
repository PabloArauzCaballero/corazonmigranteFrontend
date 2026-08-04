"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { routeMatches } from "@/features/tutorial/model/app-routes";
import type { TutorialDefinition } from "@/features/tutorial/model/tutorial.types";
import {
  DEFAULT_TARGET_TIMEOUT_MS,
  elementRect,
  findVisibleElement,
  openDisclosure,
  runAutoAction,
  scrollIntoViewSafely,
  toSelector,
  waitForElement,
  type TargetRect,
} from "@/features/tutorial/engine/target-resolver";
import { watchInteraction } from "@/features/tutorial/engine/interaction-watcher";
import {
  canAdvance,
  currentStep,
  initialRunState,
  runProgress,
  tutorialReducer,
  type TutorialRunState,
} from "@/features/tutorial/engine/tutorial-machine";

/**
 * Ejecución de un recorrido sobre la interfaz real.
 *
 * Este hook conecta la máquina de estados con el DOM: navega entre rutas, espera a que
 * el elemento exista, lo mide mientras se mueve y vigila la acción pedida. No sabe nada
 * de persistencia ni de presentación; eso lo aporta el proveedor.
 */

export const TARGET_MISSING_MESSAGE =
  "No encontramos ese elemento en la pantalla. Puede que no esté disponible para tu cuenta o que la información aún esté cargando.";

export type TutorialRunHandlers = {
  /** Se llama cada vez que un paso queda visible (para guardar el avance). */
  onStepShown?: (tutorial: TutorialDefinition, stepId: string) => void;
  /** Se llama al completar el último paso. */
  onFinished?: (tutorial: TutorialDefinition) => void;
  /** Se llama al cerrar u omitir antes de terminar. */
  onAbandoned?: (tutorial: TutorialDefinition, stepId: string | undefined, reason: "omitido" | "cerrado") => void;
  /** Se llama cuando un objetivo no aparece, para poder diagnosticarlo. */
  onTargetMissing?: (tutorial: TutorialDefinition, stepId: string) => void;
};

export type TutorialRunOrigin = "centro" | "automatico" | "manual";

export type TutorialRunOptions = TutorialRunHandlers & {
  pathname: string;
  navigate: (route: string) => void;
  reducedMotion: boolean;
};

export type TutorialRun = {
  state: TutorialRunState;
  rect: TargetRect | null;
  progress: number;
  canAdvance: boolean;
  start: (tutorial: TutorialDefinition, options?: { stepIndex?: number; origin?: TutorialRunOrigin }) => void;
  next: () => void;
  previous: () => void;
  goToStep: (index: number) => void;
  retry: () => void;
  skip: () => void;
  close: () => void;
};

export function useTutorialRun(options: TutorialRunOptions): TutorialRun {
  const { pathname, navigate, reducedMotion } = options;
  const [state, dispatch] = useReducer(tutorialReducer, initialRunState);
  const [rect, setRect] = useState<TargetRect | null>(null);

  const elementRef = useRef<HTMLElement | null>(null);
  const rectRef = useRef<TargetRect | null>(null);
  const handlersRef = useRef<TutorialRunHandlers>({});

  // Los avisos se guardan en una referencia (y se refrescan tras cada render) para que
  // cambiar de callback no relance la búsqueda del objetivo ni el bucle de medición.
  useEffect(() => {
    handlersRef.current = {
      onStepShown: options.onStepShown,
      onFinished: options.onFinished,
      onAbandoned: options.onAbandoned,
      onTargetMissing: options.onTargetMissing,
    };
  });

  const applyRect = useCallback((next: TargetRect | null) => {
    const previous = rectRef.current;
    const unchanged =
      previous !== null &&
      next !== null &&
      Math.abs(previous.top - next.top) < 0.5 &&
      Math.abs(previous.left - next.left) < 0.5 &&
      Math.abs(previous.width - next.width) < 0.5 &&
      Math.abs(previous.height - next.height) < 0.5;
    if (unchanged || (previous === null && next === null)) return;
    rectRef.current = next;
    setRect(next);
  }, []);

  const tutorial = state.tutorial;
  const step = currentStep(state);
  const stepId = step?.id;
  const stepTarget = step?.target;
  const stepRoute = step?.route ?? tutorial?.route;
  const stepWait = step?.waitForMs;
  const stepAutoAction = step?.autoAction;
  const stepPrepare = step?.prepare;
  const stepErrorMessage = step?.errorMessage;
  const interaction = step?.interaction;

  // ── Resolución del objetivo ───────────────────────────────────────────────
  // Se relanza al cambiar de paso, al reintentar y al cambiar la ruta: un paso puede
  // pedir navegar antes de que su elemento exista siquiera.
  useEffect(() => {
    if (state.phase !== "resolviendo" || !tutorial || !stepId) return;

    if (stepRoute && !routeMatches(stepRoute, pathname)) {
      navigate(stepRoute);
      return;
    }

    const controller = new AbortController();

    const resolve = async () => {
      if (!stepTarget) {
        elementRef.current = null;
        applyRect(null);
        if (!controller.signal.aborted) dispatch({ type: "objetivo_resuelto" });
        return;
      }

      const selector = toSelector(stepTarget);

      // Si el objetivo vive dentro de algo cerrado (el cajón de navegación en móvil, un
      // acordeón), se abre antes de esperarlo. En escritorio el control no está visible,
      // así que esto no hace nada y el elemento se resuelve por la vía normal.
      if (stepPrepare && !findVisibleElement(selector)) openDisclosure(toSelector(stepPrepare.target));

      const element = await waitForElement(selector, {
        timeoutMs: stepWait ?? DEFAULT_TARGET_TIMEOUT_MS,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      if (!element) {
        elementRef.current = null;
        applyRect(null);
        dispatch({ type: "objetivo_ausente", message: stepErrorMessage ?? TARGET_MISSING_MESSAGE });
        handlersRef.current.onTargetMissing?.(tutorial, stepId);
        return;
      }

      elementRef.current = element;
      scrollIntoViewSafely(element, reducedMotion);
      if (stepAutoAction) runAutoAction(element, stepAutoAction);
      applyRect(elementRect(element));
      dispatch({ type: "objetivo_resuelto" });
    };

    void resolve();
    return () => controller.abort();
  }, [
    state.phase,
    state.attempt,
    tutorial,
    stepId,
    stepTarget,
    stepRoute,
    stepWait,
    stepAutoAction,
    stepPrepare,
    stepErrorMessage,
    pathname,
    navigate,
    reducedMotion,
    applyRect,
  ]);

  // ── Seguimiento del recuadro resaltado ────────────────────────────────────
  // Un bucle de animación mantiene el resaltado pegado al elemento mientras la página
  // se desplaza, se anima o cambia de tamaño. Solo provoca render cuando el rectángulo
  // cambia de verdad, así que no repinta en cada fotograma.
  const isRunning = state.phase !== "inactivo" && state.phase !== "finalizado";
  useEffect(() => {
    if (!isRunning || typeof window === "undefined" || !window.requestAnimationFrame) return;
    let frame = 0;
    const track = () => {
      const element = elementRef.current;
      if (element?.isConnected) {
        const measured = elementRect(element);
        applyRect(measured.width > 0 || measured.height > 0 ? measured : null);
      }
      frame = window.requestAnimationFrame(track);
    };
    frame = window.requestAnimationFrame(track);
    return () => window.cancelAnimationFrame(frame);
  }, [isRunning, applyRect]);

  // ── Acción esperada de la persona ─────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== "esperando_accion" || !interaction) return;
    if (interaction.kind === "navegacion") {
      if (routeMatches(interaction.route, pathname)) dispatch({ type: "accion_cumplida" });
      return;
    }
    return watchInteraction(interaction, {
      fallbackTarget: stepTarget,
      onSatisfied: () => dispatch({ type: "accion_cumplida" }),
    });
  }, [state.phase, interaction, stepTarget, pathname]);

  // ── Avisos al proveedor ───────────────────────────────────────────────────
  const visibleStepId = state.phase === "activo" || state.phase === "esperando_accion" ? stepId : undefined;
  useEffect(() => {
    if (!tutorial || !visibleStepId) return;
    handlersRef.current.onStepShown?.(tutorial, visibleStepId);
  }, [tutorial, visibleStepId]);

  const finished = state.phase === "finalizado";
  useEffect(() => {
    if (!finished || !tutorial) return;
    handlersRef.current.onFinished?.(tutorial);
  }, [finished, tutorial]);

  // ── Acciones expuestas ────────────────────────────────────────────────────
  const forgetTarget = useCallback(() => {
    elementRef.current = null;
    rectRef.current = null;
    setRect(null);
  }, []);

  const start = useCallback<TutorialRun["start"]>(
    (definition, startOptions) => {
      forgetTarget();
      dispatch({
        type: "iniciar",
        tutorial: definition,
        stepIndex: startOptions?.stepIndex,
        origin: startOptions?.origin ?? "manual",
      });
    },
    [forgetTarget],
  );

  const finishWith = useCallback(
    (reason: "omitido" | "cerrado") => {
      if (tutorial) handlersRef.current.onAbandoned?.(tutorial, stepId, reason);
      forgetTarget();
      dispatch({ type: "cerrar" });
    },
    [tutorial, stepId, forgetTarget],
  );

  return useMemo<TutorialRun>(
    () => ({
      state,
      rect,
      progress: runProgress(state),
      canAdvance: canAdvance(state),
      start,
      next: () => dispatch({ type: "siguiente" }),
      previous: () => dispatch({ type: "anterior" }),
      goToStep: (index: number) => dispatch({ type: "ir_a_paso", stepIndex: index }),
      retry: () => dispatch({ type: "reintentar" }),
      skip: () => finishWith("omitido"),
      close: () => finishWith("cerrado"),
    }),
    [state, rect, start, finishWith],
  );
}
