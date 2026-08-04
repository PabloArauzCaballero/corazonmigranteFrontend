"use client";

import { X } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useId, useRef } from "react";
import { Button } from "@/shared/ui/button";
import { TUTORIAL_TARGETS } from "@/features/tutorial/model/tutorial-targets";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Modal({
  open,
  onClose,
  title,
  description,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const focusablesIn = useCallback(
    (panel: HTMLElement) =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      ),
    []
  );

  useEffect(() => {
    if (!open) return;

    // Se recuerda quién tenía el foco para devolvérselo al cerrar: sin esto, al cerrar
    // un diálogo el foco vuelve al <body> y quien navega con teclado o lector de
    // pantalla pierde por completo su posición en la página.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) {
      const [firstFocusable] = focusablesIn(panel);
      (firstFocusable ?? panel).focus();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      // Trampa de foco: sin ella se puede tabular hasta los controles que quedan
      // detrás del overlay, que visualmente están bloqueados.
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusables = focusablesIn(panelRef.current);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, focusablesIn]);

  if (!open) return null;

  return (
    /* `flex items-start` + `my-auto` en el panel, en lugar de `place-items-center`:
       centrado mientras el diálogo cabe, pero anclado arriba en cuanto es más alto que
       la ventana. Con el centrado anterior el panel se desplazaba por encima del origen
       de scroll y su cabecera quedaba fuera de alcance — imposible de recuperar.
       El padding se reduce a 320 px y respeta el área segura del dispositivo. */
    <div
      className="animate-fade-in px-safe fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-slate-950/50 p-3 sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        data-tutorial-id={TUTORIAL_TARGETS.ventanaModal}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="animate-slide-up-fade my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl outline-none sm:max-h-[calc(100dvh-2rem)]"
      >
        {/* Cabecera fija: el título y el botón de cerrar quedan fuera del área
            desplazable, así que siguen visibles con formularios largos. */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold sm:text-xl" id={titleId}>{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground" id={descriptionId}>{description}</p> : null}
          </div>
          <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        {/* El scroll vive en el cuerpo, no en la ventana: sin esto un diálogo alto
            generaba doble barra de desplazamiento y el teclado virtual tapaba los
            últimos campos sin forma de alcanzarlos. */}
        <div className="pb-safe min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
