import type { Permission, UserRole } from "@/shared/auth/roles";

/**
 * Contratos del motor de tutoriales.
 *
 * Este archivo NO importa React ni nada del navegador a propósito: los tutoriales se
 * declaran como datos puros y se validan (y testean) sin montar interfaz. La capa
 * visual (`ui/`) y el motor (`engine/`) consumen estos tipos, nunca al revés.
 */

/** Agrupación temática que usa el Centro de tutoriales para navegar el catálogo. */
export const TUTORIAL_CATEGORIES = [
  "introduccion",
  "navegacion",
  "perfil",
  "citas",
  "contenido",
  "publicidad",
  "administracion",
  "contabilidad",
  "ayuda",
] as const;
export type TutorialCategory = (typeof TUTORIAL_CATEGORIES)[number];

export const TUTORIAL_CATEGORY_LABELS: Record<TutorialCategory, string> = {
  introduccion: "Introducción",
  navegacion: "Navegación",
  perfil: "Perfil",
  citas: "Citas y agenda",
  contenido: "Contenido editorial",
  publicidad: "Publicidad",
  administracion: "Administración",
  contabilidad: "Contabilidad",
  ayuda: "Centro de ayuda",
};

export const TUTORIAL_LEVELS = ["basico", "intermedio", "avanzado"] as const;
export type TutorialLevel = (typeof TUTORIAL_LEVELS)[number];

export const TUTORIAL_LEVEL_LABELS: Record<TutorialLevel, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

/** Preferencia de posición de la tarjeta respecto al elemento resaltado. */
export type StepPlacement = "top" | "bottom" | "left" | "right" | "center";

/**
 * Quién puede ver el tutorial cuando no hay filtro de rol explícito.
 *  - `publica`: visible sin sesión (recorridos del sitio público).
 *  - `privada`: requiere sesión iniciada.
 */
export type TutorialAudience = "publica" | "privada";

/**
 * Acción que se le pide a la persona antes de habilitar «Siguiente».
 *
 * Ninguna variante ejecuta operaciones por su cuenta: el motor solo ESCUCHA lo que
 * hace el usuario. Por eso no existe una variante que envíe formularios, borre
 * registros ni confirme pagos — ver `autoAction` para lo único que el motor hace solo.
 */
export type StepInteraction =
  /** El paso avanza con el botón «Siguiente» (comportamiento por defecto). */
  | { kind: "ninguna" }
  /** Espera a que la persona pulse el elemento indicado (o el del paso). */
  | { kind: "click"; target?: string }
  /** Espera a que escriba en un campo. `minLength` por defecto es 1. */
  | { kind: "escritura"; target?: string; minLength?: number }
  /** Espera a que elija una opción de un `<select>` o control con valor. */
  | { kind: "seleccion"; target?: string }
  /** Espera a que la ruta actual coincida con `route`. */
  | { kind: "navegacion"; route: string }
  /** Espera a que un elemento aparezca en pantalla (resultado de una petición). */
  | { kind: "aparicion"; target: string };

/**
 * Acción automática que el motor puede ejecutar al entrar en un paso.
 *
 * Deliberadamente limitada a operaciones inocuas de interfaz. No existe una variante
 * de «enviar» ni de «confirmar»: el motor nunca dispara operaciones destructivas,
 * pagos ni eliminaciones en nombre de la persona.
 */
export type StepAutoAction = "focus" | "scroll" | "abrir-menu";

/**
 * Control que hay que desplegar para que el objetivo del paso llegue a existir.
 *
 * Resuelve el caso de los elementos que solo están en el DOM cuando algo está abierto:
 * el cajón de navegación en móvil, un acordeón, una pestaña. El motor lo activa **solo
 * si el objetivo no está ya visible**, y únicamente si el control declara
 * `aria-expanded="false"`; es decir, si es un desplegable. Un botón de guardar, pagar o
 * eliminar no expone ese atributo y por tanto nunca puede activarse por esta vía.
 */
export type StepPreparation = {
  target: string;
};

export interface TutorialStep {
  /** Identificador único dentro del tutorial. */
  id: string;
  title: string;
  body: string;
  /**
   * Elemento a resaltar. Se admite un token estable (`"nav-usuarios"` → resuelve
   * `[data-tutorial-id="nav-usuarios"]`) o un selector CSS explícito. Si se omite,
   * el paso se muestra centrado.
   */
  target?: string;
  placement?: StepPlacement;
  /** Ruta en la que debe ejecutarse. Si difiere de la actual, el motor navega. */
  route?: string;
  /** Orden explícito; se valida que sea consecutivo desde 1. */
  order: number;
  /** Acción que debe realizar la persona antes de poder avanzar. */
  interaction?: StepInteraction;
  /** Texto de ayuda mientras la acción esperada no se cumple. */
  hint?: string;
  /** Mensaje mostrado si el elemento objetivo no aparece nunca. */
  errorMessage?: string;
  /** Acción automática segura al entrar en el paso. */
  autoAction?: StepAutoAction;
  /** Desplegable que hay que abrir si el objetivo no está visible. */
  prepare?: StepPreparation;
  /** Tiempo máximo de espera del elemento objetivo (ms). Por defecto 6000. */
  waitForMs?: number;
  /** Restringe el paso a ciertos roles; si no coinciden, se omite el paso. */
  roles?: UserRole[];
  /** Restringe el paso a ciertos permisos; si no coinciden, se omite el paso. */
  permissions?: Permission[];
  /**
   * `true` deja el elemento resaltado utilizable (no se bloquea el clic). Se activa
   * solo cuando el paso pide una interacción real sobre ese elemento.
   */
  interactiveTarget?: boolean;
}

export interface TutorialDefinition {
  id: string;
  /** Versión semántica del contenido. Al subirla, el progreso queda «desactualizado». */
  version: string;
  title: string;
  description: string;
  category: TutorialCategory;
  level: TutorialLevel;
  /** Ruta donde arranca el recorrido. El motor navega ahí antes del primer paso. */
  route?: string;
  roles?: UserRole[];
  permissions?: Permission[];
  audience?: TutorialAudience;
  estimatedMinutes?: number;
  /** Ids de tutoriales que conviene completar antes. */
  prerequisites?: string[];
  /** Obligatorio para el rol: el Centro lo destaca y lo ordena primero. */
  required?: boolean;
  /** Recomendado: aparece en la sección de sugeridos. */
  recommended?: boolean;
  /** Se ofrece automáticamente la primera vez que se entra en `route`. */
  autoStart?: boolean;
  /** Id del tutorial que se propone al terminar este. */
  nextTutorialId?: string;
  steps: TutorialStep[];
}

/** Contexto del usuario con el que se filtra el catálogo. */
export type TutorialAccessContext = {
  role?: UserRole;
  permissions?: Permission[];
  isAuthenticated: boolean;
};

export type TutorialProgressStatus = "sin_empezar" | "en_progreso" | "completado" | "omitido";

export interface TutorialProgressRecord {
  tutorialId: string;
  /** Versión del tutorial con la que se registró este avance. */
  version: string;
  status: TutorialProgressStatus;
  /** Id del paso en el que quedó (no el índice: los índices cambian al editar pasos). */
  currentStepId?: string;
  startedAt?: string;
  completedAt?: string;
  lastInteractionAt: string;
  /** Cuántas veces se ha completado o reiniciado. */
  repetitions: number;
  /** La persona pidió «no volver a mostrar» este tutorial automático. */
  dismissed?: boolean;
}

export type TutorialProgressMap = Record<string, TutorialProgressRecord>;

/** Estado derivado que consume el Centro de tutoriales. */
export type TutorialViewStatus = TutorialProgressStatus | "desactualizado";
