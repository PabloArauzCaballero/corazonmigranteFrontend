"use client";

import { useEffect, useId, useRef } from "react";
import { ArrowLeft, ArrowRight, Check, CircleHelp, RotateCw, Sparkles, TriangleAlert, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import type { TargetRect } from "@/features/tutorial/engine/target-resolver";
import type { StepPlacement, TutorialStep } from "@/features/tutorial/model/tutorial.types";

/**
 * Tarjeta del paso: el único sitio donde se explica qué hacer.
 *
 * Accesibilidad: es un diálogo con nombre y descripción, atrapa el foco cuando el paso
 * no requiere tocar la página, se cierra con Escape, avanza con las flechas y devuelve
 * el foco a donde estaba al terminar. El estado nunca se comunica solo por color: hay
 * texto («Paso 3 de 7», «Acción pendiente») además del resaltado.
 */

const CARD_WIDTH = 360;
const CARD_HEIGHT_ESTIMATE = 250;
const GAP = 16;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export type TutorialTooltipProps = {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  rect: TargetRect | null;
  /** Texto de ayuda o de error a mostrar bajo la descripción. */
  notice: { tone: "ayuda" | "error"; text: string } | null;
  canAdvance: boolean;
  isLast: boolean;
  reducedMotion: boolean;
  /** El paso espera una acción sobre la página: no se atrapa el foco. */
  interactive: boolean;
  showRetry: boolean;
  /** Solo en tutoriales ofrecidos automáticamente: «no volver a mostrarme esto». */
  onDismiss?: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
  onRetry: () => void;
};

type Position = { top: number; left: number };

/** Coloca la tarjeta junto al elemento sin salirse de la ventana. */
export function cardPosition(
  rect: TargetRect | null,
  placement: StepPlacement | undefined,
  viewport: { width: number; height: number },
): Position {
  const width = Math.min(CARD_WIDTH, viewport.width - GAP * 2);
  if (!rect || placement === "center") {
    return {
      top: Math.max(GAP, viewport.height / 2 - CARD_HEIGHT_ESTIMATE / 2),
      left: Math.max(GAP, viewport.width / 2 - width / 2),
    };
  }

  const spaceBelow = viewport.height - (rect.top + rect.height);
  const spaceRight = viewport.width - (rect.left + rect.width);

  let top: number;
  let left: number;

  if (placement === "left" && rect.left > width + GAP) {
    left = rect.left - width - GAP;
    top = rect.top;
  } else if (placement === "right" && spaceRight > width + GAP) {
    left = rect.left + rect.width + GAP;
    top = rect.top;
  } else {
    const above = placement === "top" || (placement !== "bottom" && spaceBelow < CARD_HEIGHT_ESTIMATE + GAP);
    top = above ? rect.top - CARD_HEIGHT_ESTIMATE - GAP : rect.top + rect.height + GAP;
    left = rect.left + rect.width / 2 - width / 2;
  }

  return {
    top: clamp(top, GAP, Math.max(GAP, viewport.height - CARD_HEIGHT_ESTIMATE - GAP)),
    left: clamp(left, GAP, Math.max(GAP, viewport.width - width - GAP)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function TutorialTooltip({
  step,
  stepNumber,
  totalSteps,
  rect,
  notice,
  canAdvance,
  isLast,
  reducedMotion,
  interactive,
  showRetry,
  onDismiss,
  onNext,
  onPrevious,
  onSkip,
  onClose,
  onRetry,
}: TutorialTooltipProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const bodyId = useId();

  const viewport =
    typeof window === "undefined"
      ? { width: 1024, height: 768 }
      : { width: window.innerWidth, height: window.innerHeight };
  const position = cardPosition(rect, step.placement, viewport);

  // Al terminar el recorrido el foco vuelve a donde estaba antes de empezar; sin esto,
  // quien navega con teclado o lector de pantalla queda tirado en el <body>.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => previouslyFocused?.focus?.();
  }, []);

  // Cada paso lleva el foco a la tarjeta para que el lector de pantalla lo lea entero.
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, [step.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight" && canAdvance) {
        event.preventDefault();
        onNext();
        return;
      }
      if (event.key === "ArrowLeft" && stepNumber > 1) {
        event.preventDefault();
        onPrevious();
        return;
      }
      // La trampa de foco solo actúa cuando el paso NO pide tocar la página: si la
      // pide, la persona debe poder tabular hasta el elemento resaltado.
      if (event.key !== "Tab" || interactive || !cardRef.current) return;
      const focusables = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !cardRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canAdvance, interactive, onClose, onNext, onPrevious, stepNumber]);

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal={interactive ? undefined : true}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      tabIndex={-1}
      data-tutorial-role="tarjeta"
      style={{ top: position.top, left: position.left, width: Math.min(CARD_WIDTH, viewport.width - GAP * 2) }}
      className={cn(
        "absolute max-h-[80vh] overflow-y-auto rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl outline-none",
        !reducedMotion && "animate-slide-up-fade",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-primary" aria-hidden="true" />

      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Paso {stepNumber} de {totalSteps}
        </span>
        <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar tutorial" className="h-8 w-8">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <h2 className="mt-3 text-lg font-bold leading-snug" id={titleId}>
        {step.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground" id={bodyId}>
        {step.body}
      </p>

      {notice ? (
        <p
          className={cn(
            "mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs leading-5",
            notice.tone === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-primary",
          )}
          role="status"
        >
          {notice.tone === "error" ? (
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{notice.text}</span>
        </p>
      ) : null}

      <div
        className="mt-4 flex gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={stepNumber}
        aria-valuetext={`Paso ${stepNumber} de ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span
            key={index}
            className={cn("h-1.5 flex-1 rounded-full", index < stepNumber ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col items-start gap-1">
          <button
            type="button"
            onClick={onSkip}
            className="focus-ring rounded-lg px-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Omitir tutorial
          </button>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="focus-ring rounded-lg px-1 text-xs text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
            >
              No volver a mostrarme esto
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {showRetry ? (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              <RotateCw className="h-4 w-4" aria-hidden="true" /> Reintentar
            </Button>
          ) : null}
          {stepNumber > 1 ? (
            <Button type="button" size="sm" variant="outline" onClick={onPrevious}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Atrás
            </Button>
          ) : null}
          <Button type="button" size="sm" onClick={onNext} disabled={!canAdvance}>
            {isLast ? (
              <>
                Finalizar <Check className="h-4 w-4" aria-hidden="true" />
              </>
            ) : (
              <>
                Siguiente <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
