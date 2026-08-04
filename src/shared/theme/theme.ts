/**
 * Contrato del tema visual (claro / oscuro / seguir al sistema).
 *
 * Este archivo no importa React a propósito: sus constantes las consume tanto el
 * proveedor de cliente como el script en línea que corre ANTES de la hidratación,
 * y así existe una sola definición de la clave de almacenamiento y de la clase CSS.
 */

/** Lo que la persona elige. `system` delega en `prefers-color-scheme`. */
export type ThemePreference = "system" | "light" | "dark";

/** Lo que finalmente se pinta. `system` ya está resuelto aquí. */
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "cm_theme";

/** Clase que activa el bloque `.dark { … }` de globals.css. */
export const DARK_CLASS = "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

/**
 * Color de la barra del navegador por tema. Debe coincidir con `--background`
 * de cada bloque en globals.css; se aplica al `<meta name="theme-color">` para
 * que el cromo del navegador siga a la elección MANUAL y no solo al sistema
 * (esa divergencia era la contradicción documentada en design-system/themes.md).
 */
export const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: "#fbf8f3",
  dark: "#170e0b",
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

/** Preferencia del sistema. Devuelve `light` si el navegador no la expone. */
export function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

/** Lee la preferencia guardada. Cualquier valor corrupto cae al defecto. */
export function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFERENCE;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(raw) ? raw : DEFAULT_THEME_PREFERENCE;
  } catch {
    // Modo privado de Safari y políticas de empresa pueden lanzar al leer.
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function writeStoredPreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Sin persistencia el tema sigue funcionando durante la sesión: no es un error
    // que deba interrumpir a nadie.
  }
}

/** Aplica el tema al documento. Única función que toca el DOM global. */
export function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle(DARK_CLASS, resolved === "dark");

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[resolved]);
}

/**
 * Script que se inyecta en el `<head>` y se ejecuta de forma síncrona ANTES del
 * primer pintado.
 *
 * Sin él, el documento se pinta en claro y salta a oscuro al hidratar React: un
 * destello blanco a pantalla completa, justo lo más molesto para quien elige el
 * tema oscuro. Va envuelto en try/catch porque un fallo aquí bloquearía el render
 * de toda la página, y el peor caso aceptable es quedarse en el tema claro.
 *
 * Requiere `'unsafe-inline'` en `script-src`, que la CSP de public/_headers ya
 * concede por el runtime de Next.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(p!=="light"&&p!=="dark"&&p!=="system")p=${JSON.stringify(DEFAULT_THEME_PREFERENCE)};var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle(${JSON.stringify(
  DARK_CLASS,
)},d);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",d?${JSON.stringify(
  THEME_COLOR.dark,
)}:${JSON.stringify(THEME_COLOR.light)});}catch(e){}})();`;
