/**
 * Fuente única de breakpoints del sistema.
 *
 * Los valores son EXACTAMENTE los de Tailwind por defecto (que es lo que el proyecto
 * ya venía usando en las clases `sm:`/`md:`/`lg:`…): este módulo no los cambia, los
 * hace explícitos para que el CSS, los componentes y las pruebas compartan la misma
 * escala en vez de repetir números sueltos.
 *
 * Regla de uso: un breakpoint se elige por el momento en que el CONTENIDO necesita
 * reorganizarse, no por el nombre de un dispositivo. Antes de introducir uno nuevo,
 * comprobar si alguno de estos ya sirve.
 */
export const BREAKPOINTS = {
  /** Móvil grande / phablet. */
  sm: 640,
  /** Tablet vertical. Umbral canónico "compacto ↔ amplio" del sistema. */
  md: 768,
  /** Tablet horizontal y portátiles pequeños. A partir de aquí la sidebar es fija. */
  lg: 1024,
  /** Escritorio. */
  xl: 1280,
  /** Tope del contenedor de contenido (`tailwind.config.ts` → container.screens). */
  "2xl": 1536,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;

/**
 * Ancho máximo del contenido. Coincide con `container.screens["2xl"]` de Tailwind.
 * Decisión editorial: en pantallas ultraanchas el contenido se centra, no se estira.
 */
export const CONTENT_MAX_WIDTH = 1200;

/**
 * Umbral en el que las tablas del sistema pasan de lista de tarjetas (compacto) a
 * tabla con columnas (amplio). Lo consume `DataTable`.
 */
export const TABLE_CARD_BREAKPOINT: BreakpointName = "md";

/**
 * Objetivo táctil mínimo, en píxeles CSS.
 *
 * WCAG 2.2 AA (2.5.8 Target Size, Minimum) exige 24×24. Se adopta 44 como objetivo
 * propio por comodidad real con el dedo; se alcanza ampliando el área de pulsado en
 * punteros gruesos, sin agrandar los controles visualmente.
 */
export const TOUCH_TARGET_MIN = 24;
export const TOUCH_TARGET_COMFORTABLE = 44;

/** Media query "de ancho mínimo" para el breakpoint dado. */
export function minWidth(name: BreakpointName): string {
  return `(min-width: ${BREAKPOINTS[name]}px)`;
}

/** Media query "por debajo de" el breakpoint dado. */
export function below(name: BreakpointName): string {
  return `(max-width: ${BREAKPOINTS[name] - 0.02}px)`;
}
