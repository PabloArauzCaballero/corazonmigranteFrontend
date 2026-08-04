import { reportError } from "@/observability/core/report-error";
import { ERROR_SOURCE } from "@/observability/core/tracing.constants";

/**
 * Escuchas globales de error (Fase 18).
 *
 * Se **añaden**, no se sustituye nada: `window.onerror` no se reasigna, se usa
 * `addEventListener`, para no pisar ningún manejador existente ni el que pueda añadir
 * una extensión del navegador. No se llama a `preventDefault()`, así que el error
 * sigue llegando a la consola exactamente igual que antes.
 */

let installed = false;
let disposeListeners: (() => void) | undefined;

function onWindowError(event: ErrorEvent) {
  reportError({
    // Si `event.error` falta (error de un script de otro origen), se usa el mensaje.
    error: event.error ?? new Error(event.message),
    source: ERROR_SOURCE.window,
    handled: false,
  });
}

function onUnhandledRejection(event: PromiseRejectionEvent) {
  reportError({
    error: event.reason,
    source: ERROR_SOURCE.promise,
    handled: false,
  });
}

/**
 * Errores de carga de recursos (`<img>`, `<script>`, `<link>`).
 *
 * Se escucha en fase de captura porque estos eventos no burbujean. Solo interesan los
 * que impiden que la aplicación funcione: un `<script>` o un `<link>` que no cargan.
 * Las imágenes fallidas se ignoran a propósito — hay muchas, vienen de un CDN externo
 * y ya tienen su propio `onError` en `smart-image.tsx`.
 */
function onResourceError(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLScriptElement) && !(target instanceof HTMLLinkElement)) return;

  reportError({
    error: new Error(`No se pudo cargar un recurso ${target.tagName.toLowerCase()}`),
    source: ERROR_SOURCE.chunk,
    handled: false,
  });
}

export function installGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", onWindowError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onResourceError, true);

  disposeListeners = () => {
    window.removeEventListener("error", onWindowError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    window.removeEventListener("error", onResourceError, true);
  };
}

/** Retira las escuchas. Se usa en el ciclo de vida de HMR y en los tests. */
export function uninstallGlobalErrorHandlers() {
  disposeListeners?.();
  disposeListeners = undefined;
  installed = false;
}
