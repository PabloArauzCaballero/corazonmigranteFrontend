import { findVisibleElement, toSelector, waitForElement } from "@/features/tutorial/engine/target-resolver";
import type { StepInteraction } from "@/features/tutorial/model/tutorial.types";

/**
 * Vigilancia de la acción esperada en un paso interactivo.
 *
 * El motor solo ESCUCHA: nunca envía formularios ni pulsa botones por la persona. Los
 * escuchas se registran en fase de captura sobre `document`, de modo que funcionan
 * aunque el elemento se reemplace (re-render de React) o viva dentro de un modal.
 */

export type InteractionWatcherOptions = {
  /** `target` del paso, usado cuando la interacción no declara el suyo. */
  fallbackTarget?: string;
  onSatisfied: () => void;
};

type Cleanup = () => void;

const NOOP: Cleanup = () => {};

function selectorFor(interaction: StepInteraction, fallbackTarget?: string): string | null {
  const declared = "target" in interaction ? interaction.target : undefined;
  const value = declared ?? fallbackTarget;
  return value ? toSelector(value) : null;
}

function matchesSelector(node: EventTarget | null, selector: string): boolean {
  if (!(node instanceof Element)) return false;
  try {
    return Boolean(node.closest(selector));
  } catch {
    return false;
  }
}

function valueOf(node: EventTarget | null): string {
  if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
    return node.value;
  }
  return "";
}

/**
 * Registra la vigilancia y devuelve la función de limpieza. Si la interacción es
 * `ninguna` o `navegacion` (que resuelve el motor comparando la ruta) no hace nada.
 */
export function watchInteraction(
  interaction: StepInteraction | undefined,
  options: InteractionWatcherOptions,
): Cleanup {
  if (!interaction || interaction.kind === "ninguna" || interaction.kind === "navegacion") return NOOP;
  if (typeof document === "undefined") return NOOP;

  if (interaction.kind === "aparicion") {
    const controller = new AbortController();
    void waitForElement(toSelector(interaction.target), { signal: controller.signal }).then((element) => {
      if (element && !controller.signal.aborted) options.onSatisfied();
    });
    return () => controller.abort();
  }

  const selector = selectorFor(interaction, options.fallbackTarget);
  if (!selector) return NOOP;

  if (interaction.kind === "click") {
    const onClick = (event: Event) => {
      if (matchesSelector(event.target, selector)) options.onSatisfied();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }

  if (interaction.kind === "escritura") {
    const minLength = interaction.minLength ?? 1;
    const onInput = (event: Event) => {
      if (!matchesSelector(event.target, selector)) return;
      if (valueOf(event.target).trim().length >= minLength) options.onSatisfied();
    };
    document.addEventListener("input", onInput, true);
    // El campo puede venir ya relleno (por ejemplo al reanudar el tutorial).
    const existing = findVisibleElement(selector);
    if (existing && valueOf(existing).trim().length >= minLength) options.onSatisfied();
    return () => document.removeEventListener("input", onInput, true);
  }

  const onChange = (event: Event) => {
    if (!matchesSelector(event.target, selector)) return;
    if (valueOf(event.target).trim().length > 0) options.onSatisfied();
  };
  document.addEventListener("change", onChange, true);
  return () => document.removeEventListener("change", onChange, true);
}

/** Texto por defecto de la ayuda cuando la acción esperada aún no se ha hecho. */
export function defaultHint(interaction: StepInteraction | undefined): string | null {
  switch (interaction?.kind) {
    case "click":
      return "Pulsa el elemento resaltado para continuar.";
    case "escritura":
      return "Escribe en el campo resaltado para continuar.";
    case "seleccion":
      return "Elige una opción en el control resaltado para continuar.";
    case "navegacion":
      return "Entra en la pantalla indicada para continuar.";
    case "aparicion":
      return "Esperando a que la información termine de cargarse…";
    default:
      return null;
  }
}
