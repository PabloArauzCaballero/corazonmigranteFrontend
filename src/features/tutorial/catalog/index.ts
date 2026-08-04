import { TutorialRegistry, reportCatalogIssues } from "@/features/tutorial/registry/tutorial-registry";
import type { TutorialDefinition } from "@/features/tutorial/model/tutorial.types";
import { PUBLIC_TUTORIALS } from "@/features/tutorial/catalog/public.tutorials";
import { PATIENT_TUTORIALS } from "@/features/tutorial/catalog/patient.tutorials";
import { THERAPIST_TUTORIALS } from "@/features/tutorial/catalog/therapist.tutorials";
import { ADMIN_TUTORIALS } from "@/features/tutorial/catalog/admin.tutorials";

/**
 * Catálogo completo de tutoriales.
 *
 * Para añadir un tutorial nuevo basta con crear su definición en el archivo del módulo
 * correspondiente (o uno nuevo) y sumarlo a esta lista. El motor, el overlay y el
 * Centro de ayuda no necesitan ningún cambio.
 */
export const TUTORIAL_CATALOG: TutorialDefinition[] = [
  ...PUBLIC_TUTORIALS,
  ...PATIENT_TUTORIALS,
  ...THERAPIST_TUTORIALS,
  ...ADMIN_TUTORIALS,
];

export const tutorialRegistry = new TutorialRegistry(TUTORIAL_CATALOG);

reportCatalogIssues(tutorialRegistry);
