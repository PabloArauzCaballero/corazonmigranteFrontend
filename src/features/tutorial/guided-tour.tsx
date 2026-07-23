"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export type TourStep = {
  /** Selector CSS del elemento a resaltar. Si se omite, el paso se centra. */
  target?: string;
  title: string;
  body: string;
  /** Preferencia de posición del tooltip respecto al elemento. */
  placement?: "top" | "bottom" | "left" | "right" | "center";
};

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8; // margen del recuadro resaltado
const CARD_W = 340;
const GAP = 14;

function readRect(selector?: string): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function cardPosition(rect: Rect | null, placement: TourStep["placement"]) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!rect || placement === "center") {
    return { top: vh / 2 - 120, left: vw / 2 - CARD_W / 2, centered: true };
  }
  // Espacio disponible arriba/abajo del elemento.
  const below = vh - (rect.top + rect.height);
  const preferTop = placement === "top" || (placement !== "bottom" && below < 220);
  let top = preferTop ? rect.top - GAP - 190 : rect.top + rect.height + GAP;
  let left = rect.left + rect.width / 2 - CARD_W / 2;
  left = Math.max(GAP, Math.min(left, vw - CARD_W - GAP));
  top = Math.max(GAP, Math.min(top, vh - 210 - GAP));
  return { top, left, centered: false };
}

export function GuidedTour({
  steps,
  open,
  onClose,
}: {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = steps[index];

  const refresh = useCallback(() => {
    if (!step) return;
    const el = step.target ? document.querySelector(step.target) : null;
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    // Espera breve al scroll antes de medir.
    window.setTimeout(() => setRect(readRect(step.target)), el ? 260 : 0);
  }, [step]);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    refresh();
  }, [open, index, refresh]);

  useEffect(() => {
    if (!open) return;
    const onChange = () => setRect(readRect(step?.target));
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [open, step]);

  const close = useCallback(() => {
    setIndex(0);
    onClose();
  }, [onClose]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1 < steps.length ? i + 1 : (close(), i)));
  }, [steps.length, close]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  if (!open || !step) return null;

  const isLast = index === steps.length - 1;
  const pos = cardPosition(rect, step.placement);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Tutorial de la plataforma">
      {/* Capa oscura con "agujero" alrededor del elemento (o pantalla completa). */}
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-300"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(20, 8, 6, 0.72)",
            outline: "3px solid rgba(255,255,255,0.9)",
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(20, 8, 6, 0.72)" }} />
      )}

      {/* Click en el fondo cierra */}
      <button
        type="button"
        aria-label="Cerrar tutorial"
        onClick={close}
        className="absolute inset-0 h-full w-full cursor-default"
        tabIndex={-1}
      />

      {/* Tarjeta del paso */}
      <div
        className="absolute w-[340px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/15 bg-white p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Paso {index + 1} de {steps.length}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-2 text-lg font-black text-[#2b1b17]">{step.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#5f5b54]">{step.body}</p>

        {/* Progreso */}
        <div className="mt-4 flex gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition ${
                i <= index ? "bg-primary" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={close}
            className="text-xs font-semibold text-slate-400 transition hover:text-slate-600"
          >
            Saltar
          </button>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={prev}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" /> Atrás
              </button>
            ) : null}
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-[#5f0a0a]"
            >
              {isLast ? (
                <>
                  Entendido <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Siguiente <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
