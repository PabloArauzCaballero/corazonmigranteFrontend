import { intro, orderedSteps } from "@/features/tutorial/catalog/helpers";
import { TUTORIAL_TARGETS } from "@/features/tutorial/model/tutorial-targets";
import type { TutorialDefinition } from "@/features/tutorial/model/tutorial.types";

/**
 * Recorrido del sitio público. Es el único con audiencia pública: se ofrece sin sesión
 * y no toca ninguna pantalla privada.
 */
export const PUBLIC_TUTORIALS: TutorialDefinition[] = [
  {
    id: "publico-introduccion",
    version: "1.0.0",
    title: "Conoce Corazón Migrante",
    description: "Un paseo de un minuto por la página principal: qué encuentras y por dónde empezar.",
    category: "introduccion",
    level: "basico",
    route: "/",
    audience: "publica",
    estimatedMinutes: 2,
    recommended: true,
    autoStart: true,
    steps: orderedSteps(
      intro(
        "bienvenida",
        "Te damos la bienvenida",
        "Te mostramos en menos de un minuto cómo moverte por la plataforma. Puedes salir cuando quieras con Escape.",
      ),
      {
        id: "biblioteca",
        title: "Biblioteca emocional",
        body: "Guías, historias reales y cursos para acompañar tu proceso, a tu ritmo y sin coste.",
        target: 'a[href^="/biblioteca"]',
        placement: "bottom",
        errorMessage: "El enlace a la biblioteca está en el menú superior; ábrelo para verlo resaltado.",
      },
      {
        id: "primer-paso",
        title: "Da el primer paso",
        body: "Con este botón creas tu cuenta y puedes solicitar tu primera cita.",
        target: TUTORIAL_TARGETS.landingEmpezar,
        placement: "bottom",
      },
      {
        id: "acceso",
        title: "Tu portal privado",
        body: "Si ya tienes cuenta, entra aquí para ver tus citas, tu contenido y tu perfil.",
        target: 'a[href^="/login"]',
        placement: "bottom",
      },
      {
        id: "contacto",
        title: "Habla con alguien",
        body: "¿Prefieres escribir? Este botón te conecta por WhatsApp. No hace falta tener las palabras perfectas.",
        target: TUTORIAL_TARGETS.landingContacto,
        placement: "left",
      },
      intro(
        "cierre",
        "Eso es todo",
        "Puedes reabrir este recorrido cuando quieras con el botón «¿Cómo funciona?» de la esquina.",
      ),
    ),
  },
];
