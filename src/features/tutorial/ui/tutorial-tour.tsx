"use client";

import { useCallback, useState } from "react";
import { PartyPopper } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { usePrefersReducedMotion } from "@/shared/hooks/use-media-query";
import { defaultHint } from "@/features/tutorial/engine/interaction-watcher";
import { currentStep } from "@/features/tutorial/engine/tutorial-machine";
import { TutorialOverlay } from "@/features/tutorial/ui/tutorial-overlay";
import { TutorialTooltip } from "@/features/tutorial/ui/tutorial-tooltip";
import { useTutorials } from "@/features/tutorial/ui/tutorial-provider";

/**
 * Capa visual del recorrido en curso. Se monta una vez desde el proveedor y no hace
 * nada mientras no haya tutorial activo.
 */
export function TutorialTour() {
  const { run, startTutorial, dismissTutorial, catalog } = useTutorials();
  const reducedMotion = usePrefersReducedMotion();
  const [confirmingExit, setConfirmingExit] = useState(false);

  const { state, rect, canAdvance } = run;
  const step = currentStep(state);
  const phase = state.phase;
  const stepIndex = state.stepIndex;

  // Al cambiar de paso o de tutorial se cancela cualquier confirmación pendiente. Se
  // ajusta durante el render (no en un efecto) para que la confirmación no llegue a
  // pintarse sobre el paso nuevo, igual que se hace en el shell del panel.
  const stepKey = `${state.tutorial?.id ?? ""}#${stepIndex}`;
  const [lastStepKey, setLastStepKey] = useState(stepKey);
  if (stepKey !== lastStepKey) {
    setLastStepKey(stepKey);
    setConfirmingExit(false);
  }

  const requestExit = useCallback(() => {
    // Salir al principio no destruye nada; a mitad de recorrido se confirma para no
    // perder el hilo por un clic accidental fuera de la tarjeta.
    if (stepIndex === 0) run.close();
    else setConfirmingExit(true);
  }, [run, stepIndex]);

  if (phase === "inactivo" || !state.tutorial) return null;

  const tutorial = state.tutorial;
  const nextTutorial = tutorial.nextTutorialId
    ? catalog.find((item) => item.id === tutorial.nextTutorialId)
    : undefined;

  if (phase === "finalizado") {
    return (
      <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="tutorial-final-titulo">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-card-foreground shadow-2xl">
          <PartyPopper className="h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold" id="tutorial-final-titulo">
            Tutorial completado
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Terminaste «{tutorial.title}». Puedes repetirlo cuando quieras desde el Centro de ayuda.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={run.close}>
              Cerrar
            </Button>
            {nextTutorial ? (
              <Button
                type="button"
                onClick={() => {
                  run.close();
                  startTutorial(nextTutorial.id, { origin: "manual" });
                }}
              >
                Continuar con «{nextTutorial.title}»
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  const interactive = Boolean(step.interactiveTarget) || phase === "esperando_accion";
  const notice =
    phase === "objetivo_ausente"
      ? ({ tone: "error", text: state.message ?? "" } as const)
      : phase === "esperando_accion"
        ? ({ tone: "ayuda", text: step.hint ?? defaultHint(step.interaction) ?? "" } as const)
        : null;

  return (
    <div className="fixed inset-0 z-[120]" data-tutorial-role="recorrido">
      {/* Anuncio para lectores de pantalla: el cambio de paso se comunica aunque el
          foco no se mueva. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`Paso ${stepIndex + 1} de ${tutorial.steps.length}: ${step.title}`}
      </p>

      <TutorialOverlay
        rect={rect}
        interactive={interactive}
        reducedMotion={reducedMotion}
        onBackdropClick={requestExit}
        onSpotlightClick={() => {
          if (canAdvance) run.next();
        }}
      />

      {confirmingExit ? (
        <div className="absolute inset-0 grid place-items-center p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="tutorial-salir-titulo"
            className="w-full max-w-sm rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl"
          >
            <h2 className="text-base font-bold" id="tutorial-salir-titulo">
              ¿Salir del tutorial?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Guardaremos el paso en el que vas. Podrás continuar más tarde desde el Centro de ayuda.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmingExit(false)}>
                Seguir aquí
              </Button>
              <Button type="button" size="sm" onClick={run.close}>
                Salir
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <TutorialTooltip
          step={step}
          stepNumber={stepIndex + 1}
          totalSteps={tutorial.steps.length}
          rect={rect}
          notice={notice && notice.text ? notice : null}
          canAdvance={canAdvance}
          isLast={stepIndex === tutorial.steps.length - 1}
          reducedMotion={reducedMotion}
          interactive={interactive}
          showRetry={phase === "objetivo_ausente"}
          // La opción de no volver a verlo solo tiene sentido en lo que aparece solo:
          // lo que se abre a propósito desde el Centro no necesita silenciarse.
          onDismiss={
            state.origin === "automatico"
              ? () => {
                  dismissTutorial(tutorial.id);
                  run.close();
                }
              : undefined
          }
          onNext={run.next}
          onPrevious={run.previous}
          onSkip={run.skip}
          onClose={requestExit}
          onRetry={run.retry}
        />
      )}
    </div>
  );
}
