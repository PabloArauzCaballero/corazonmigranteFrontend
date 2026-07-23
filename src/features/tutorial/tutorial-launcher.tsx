"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { GuidedTour, type TourStep } from "@/features/tutorial/guided-tour";

/** Tour por defecto de la experiencia pública (landing + accesos). */
export const LANDING_TOUR: TourStep[] = [
  {
    placement: "center",
    title: "Bienvenido a Corazón Migrante",
    body: "Te mostramos en menos de un minuto cómo moverte por la plataforma. Puedes salir cuando quieras.",
  },
  {
    target: 'a[aria-label="Ir al inicio"]',
    placement: "bottom",
    title: "Tu punto de partida",
    body: "Desde el logo siempre vuelves al inicio. Arriba tienes el menú principal.",
  },
  {
    target: 'a[href^="/biblioteca"]',
    placement: "bottom",
    title: "Biblioteca emocional",
    body: "Aquí encuentras guías, historias reales y cursos para acompañar tu proceso, a tu ritmo.",
  },
  {
    target: '[data-tour="empezar"]',
    placement: "bottom",
    title: "Da el primer paso",
    body: "Con este botón empiezas tu proceso: creas tu cuenta y puedes solicitar una cita.",
  },
  {
    target: 'a[href^="/login"]',
    placement: "bottom",
    title: "Tu portal privado",
    body: "Si ya tienes cuenta, entra aquí para ver tus citas, tu contenido y tu perfil.",
  },
  {
    target: '[data-tour="contacto"]',
    placement: "left",
    title: "Habla con alguien",
    body: "¿Prefieres escribir? Este botón te conecta por WhatsApp. No hace falta tener las palabras perfectas.",
  },
  {
    placement: "center",
    title: "¡Listo!",
    body: "Eso es todo por ahora. Puedes reabrir este tutorial cuando quieras con el botón «¿Cómo funciona?».",
  },
];

export function TutorialLauncher({
  steps = LANDING_TOUR,
  storageKey = "cm.tour.landing.v1",
  autoStart = true,
}: {
  steps?: TourStep[];
  storageKey?: string;
  autoStart?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Auto-inicio en la primera visita.
  useEffect(() => {
    if (!autoStart) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(storageKey) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const t = window.setTimeout(() => setOpen(true), 1400);
    return () => window.clearTimeout(t);
  }, [autoStart, storageKey]);

  const handleClose = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* almacenamiento no disponible */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir tutorial: cómo funciona la plataforma"
        className="fixed bottom-5 left-5 z-40 inline-flex h-12 items-center gap-2 rounded-full border border-primary/20 bg-white/90 px-4 text-sm font-bold text-primary shadow-[0_14px_36px_rgba(43,27,23,0.18)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white"
      >
        <HelpCircle className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">¿Cómo funciona?</span>
      </button>

      <GuidedTour steps={steps} open={open} onClose={handleClose} />
    </>
  );
}
