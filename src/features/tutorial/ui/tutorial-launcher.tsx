"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { routeMatches } from "@/features/tutorial/model/app-routes";
import { useOptionalTutorials } from "@/features/tutorial/ui/tutorial-provider";

/**
 * Botón flotante «¿Cómo funciona?».
 *
 * Lanza el tutorial de la pantalla actual (el más específico que coincida con la ruta).
 * Si la pantalla no tiene ninguno disponible para el rol, el botón no se muestra: es
 * preferible a ofrecer ayuda que no existe.
 */
export function TutorialLauncher({
  tutorialId,
  position = "left",
  label = "¿Cómo funciona?",
}: {
  /** Fuerza un tutorial concreto en vez de deducirlo de la ruta. */
  tutorialId?: string;
  position?: "left" | "right";
  label?: string;
}) {
  const tutorials = useOptionalTutorials();
  const pathname = usePathname() ?? "/";

  const target = useMemo(() => {
    if (!tutorials) return undefined;
    if (tutorialId) return tutorials.catalog.find((item) => item.id === tutorialId);
    return tutorials.catalog
      .filter((item) => item.route && routeMatches(item.route, pathname))
      .sort((a, b) => (b.route?.length ?? 0) - (a.route?.length ?? 0))[0];
  }, [tutorials, tutorialId, pathname]);

  if (!tutorials || !target) return null;

  const status = tutorials.statusOf(target.id);
  const resumable = status === "en_progreso";

  return (
    <button
      type="button"
      data-tutorial-id="lanzador-tutorial"
      onClick={() => tutorials.startTutorial(target.id, { origin: "manual" })}
      aria-label={`${resumable ? "Continuar" : "Abrir"} el tutorial: ${target.title}`}
      className={`focus-ring fixed bottom-5 z-40 inline-flex h-12 items-center gap-2 rounded-full border border-primary/20 bg-card/95 px-4 text-sm font-bold text-primary shadow-soft backdrop-blur transition duration-300 hover:-translate-y-0.5 ${
        position === "right" ? "right-5" : "left-5"
      }`}
    >
      <HelpCircle className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">{resumable ? "Continuar tutorial" : label}</span>
    </button>
  );
}
