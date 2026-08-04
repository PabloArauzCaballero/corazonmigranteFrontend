import type { TutorialStep } from "@/features/tutorial/model/tutorial.types";

/**
 * Numera los pasos automáticamente en el orden en que se escriben.
 *
 * La validación exige que `order` sea consecutivo desde 1; calcularlo aquí evita el
 * error más aburrido de mantener un catálogo (insertar un paso y renumerar a mano) sin
 * renunciar a que el orden forme parte del contrato.
 */
export function orderedSteps(...items: Omit<TutorialStep, "order">[]): TutorialStep[] {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

/** Paso centrado, sin elemento resaltado: sirve para abrir y cerrar un recorrido. */
export function intro(id: string, title: string, body: string): Omit<TutorialStep, "order"> {
  return { id, title, body, placement: "center" };
}
