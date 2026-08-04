/**
 * Ciclo de vida de la exportación (Fase 5).
 *
 * El `BatchSpanProcessor` vacía la cola cada 5 s. Si la persona cierra la pestaña o
 * pasa a segundo plano antes, esos spans se pierden. Se hace un `forceFlush()` de
 * mejor esfuerzo en los momentos en que el navegador avisa.
 *
 * Reglas que se respetan:
 *  - **no se bloquea la navegación**: nunca se espera a la promesa;
 *  - se usa `visibilitychange` + `pagehide`, no `beforeunload`, que rompe el bfcache
 *    de Safari y iOS y penaliza la navegación hacia atrás;
 *  - los fallos se ignoran: al cerrar la pestaña es normal que la petición se corte.
 */

type Flushable = { forceFlush: () => Promise<void> };

let installed = false;
let disposeListeners: (() => void) | undefined;

export function installLifecycleFlush(provider: Flushable) {
  if (installed || typeof document === "undefined") return;
  installed = true;

  const flush = () => {
    // Sin `await`: el usuario no puede esperar a que termine la telemetría.
    void provider.forceFlush().catch(() => {
      // Cortar la exportación al cerrar la pestaña es lo esperado, no un fallo.
    });
  };

  const onVisibilityChange = () => {
    // Solo al ocultarse. Al volver no hay nada que vaciar.
    if (document.visibilityState === "hidden") flush();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  // `pagehide` cubre la suspensión en móviles y el cierre de pestaña, incluyendo los
  // casos en los que la página entra en el bfcache.
  window.addEventListener("pagehide", flush);

  disposeListeners = () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", flush);
  };
}

export function uninstallLifecycleFlush() {
  disposeListeners?.();
  disposeListeners = undefined;
  installed = false;
}
