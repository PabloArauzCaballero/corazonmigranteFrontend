import type { StepAutoAction } from "@/features/tutorial/model/tutorial.types";

/**
 * Localización de elementos en pantalla.
 *
 * Los pasos referencian elementos por un atributo estable (`data-tutorial-id`) en vez
 * de por clases CSS: las clases son de presentación y cambian con cualquier retoque
 * visual, dejando tutoriales rotos sin que nadie se entere. Se admiten selectores CSS
 * explícitos como escape para elementos de terceros que no podemos anotar.
 */

export const TUTORIAL_ATTRIBUTE = "data-tutorial-id";

export type TargetRect = { top: number; left: number; width: number; height: number };

const CSS_SELECTOR_HINT = /[[\]#.>:\s,=]/;

/** Convierte el `target` de un paso en un selector CSS utilizable. */
export function toSelector(target: string): string {
  const value = target.trim();
  if (CSS_SELECTOR_HINT.test(value)) return value;
  return `[${TUTORIAL_ATTRIBUTE}="${value}"]`;
}

/**
 * Devuelve la primera coincidencia VISIBLE. El mismo `data-tutorial-id` puede existir
 * en el menú de escritorio y en el cajón móvil; hay que resaltar el que se ve.
 */
export function findVisibleElement(selector: string, root: ParentNode = document): HTMLElement | null {
  let candidates: HTMLElement[];
  try {
    candidates = Array.from(root.querySelectorAll<HTMLElement>(selector));
  } catch {
    // Selector inválido en la definición: se trata como «no encontrado» para que el
    // motor siga su ruta de error controlada en vez de lanzar.
    return null;
  }
  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) return element;
  }
  return null;
}

export type WaitOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
  root?: ParentNode & Node;
};

export const DEFAULT_TARGET_TIMEOUT_MS = 6000;

/**
 * Espera a que el elemento exista y sea visible.
 *
 * Se apoya en `MutationObserver` (reacciona en cuanto el DOM cambia, sin sondeo) y usa
 * el tiempo solo como límite superior, no como mecanismo de sincronización: por eso
 * funciona igual con contenido que llega tras una petición al backend, dentro de un
 * modal o al abrirse un desplegable. Resuelve `null` si nunca aparece.
 */
export function waitForElement(selector: string, options: WaitOptions = {}): Promise<HTMLElement | null> {
  const { timeoutMs = DEFAULT_TARGET_TIMEOUT_MS, signal, root = document } = options;

  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const immediate = findVisibleElement(selector, root);
    if (immediate) {
      resolve(immediate);
      return;
    }
    if (signal?.aborted) {
      resolve(null);
      return;
    }

    let settled = false;
    const finish = (element: HTMLElement | null) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      resolve(element);
    };

    const onAbort = () => finish(null);
    const observer = new MutationObserver(() => {
      const found = findVisibleElement(selector, root);
      if (found) finish(found);
    });

    const timer = window.setTimeout(() => finish(findVisibleElement(selector, root)), timeoutMs);

    observer.observe(root instanceof Document ? root.documentElement : root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", TUTORIAL_ATTRIBUTE],
    });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Abre el desplegable indicado para que el objetivo de un paso pueda existir.
 *
 * Se aplica al cajón de navegación en móvil, a los acordeones del menú y a cualquier
 * control de despliegue. La comprobación de `aria-expanded="false"` es la salvaguarda:
 * garantiza que solo se pulsan controles que abren algo — un botón de guardar, pagar o
 * eliminar no expone ese atributo — y evita volver a cerrar lo que ya estaba abierto.
 *
 * Devuelve `true` si llegó a pulsar algo.
 */
export function openDisclosure(selector: string, root: ParentNode = document): boolean {
  const control = findVisibleElement(selector, root);
  if (!control || control.getAttribute("aria-expanded") !== "false") return false;
  control.click();
  return true;
}

export function elementRect(element: HTMLElement): TargetRect {
  const rect = element.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

/** `true` si el elemento está fuera de la parte visible de la ventana. */
export function isOutsideViewport(rect: TargetRect): boolean {
  return rect.top < 0 || rect.left < 0 || rect.top + rect.height > window.innerHeight || rect.left + rect.width > window.innerWidth;
}

/**
 * Acciones automáticas permitidas al entrar en un paso.
 *
 * Solo operaciones de interfaz sin efecto de negocio. `abrir-menu` pulsa un control de
 * despliegue (menú lateral, acordeón) y por eso comprueba `aria-expanded`: si ya está
 * abierto no hace nada, y nunca se aplica a botones de guardar, pagar o eliminar
 * porque esos no exponen ese atributo.
 */
export function runAutoAction(element: HTMLElement, action: StepAutoAction): void {
  if (action === "focus") {
    element.focus({ preventScroll: true });
    return;
  }
  if (action === "scroll") {
    element.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  if (element.getAttribute("aria-expanded") === "false") element.click();
}

/**
 * Desplaza el elemento a la vista respetando la preferencia de movimiento reducido.
 * Se comprueba que el método exista: no todos los entornos de render lo implementan y
 * un tutorial no debe caerse por no poder hacer scroll.
 */
export function scrollIntoViewSafely(element: HTMLElement, reducedMotion: boolean): void {
  if (typeof element.scrollIntoView !== "function") return;
  element.scrollIntoView({ block: "center", inline: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
}
