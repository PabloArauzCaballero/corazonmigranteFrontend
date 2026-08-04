import { reportError } from "@/observability/core/report-error";
import { ERROR_SOURCE } from "@/observability/core/tracing.constants";
import type { ReactErrorBoundaryName } from "@/observability/react/react-error.types";

/**
 * Puente entre los límites de error de React/Next y la telemetría (Fase 19).
 *
 * Se importa desde los `error.tsx` que **ya existían**: no se sustituye ninguna
 * interfaz de error ni se cambia lo que ve la persona usuaria. Lo único que se añade
 * es una llamada dentro del `useEffect` que ya hacía `console.error`.
 *
 * Qué NO se envía, aunque React lo tenga a mano:
 *  - props ni estado de los componentes,
 *  - el árbol de componentes (`componentStack`): contiene nombres de pantallas junto a
 *    datos si alguien usó un nombre dinámico,
 *  - el HTML renderizado,
 *  - el contenido de ningún formulario.
 *
 * `digest` de Next tampoco se envía: es un hash del mensaje del servidor y en este
 * despliegue estático no hay servidor con el que correlacionarlo.
 */
export function reportReactError(error: Error, boundary: ReactErrorBoundaryName): void {
  reportError({
    error,
    source: ERROR_SOURCE.react,
    // El límite de error mostró una pantalla de recuperación con botón de reintento:
    // desde el punto de vista de la persona usuaria, está gestionado.
    handled: true,
    component: boundary,
  });
}
