/**
 * Almacén externo del tema, pensado para `useSyncExternalStore`.
 *
 * ¿Por qué un almacén externo y no `useState` + `useEffect`?
 *
 *  - El tema vive FUERA de React: lo escribe el script en línea del `<head>`
 *    antes de que React exista, y lo puede cambiar otra pestaña.
 *  - Leerlo con un efecto de montaje obliga a un `setState` síncrono dentro del
 *    efecto, que es exactamente lo que prohíbe la regla de react-hooks activa en
 *    este proyecto (provoca renders en cascada).
 *  - `useSyncExternalStore` resuelve además la hidratación: React usa el
 *    snapshot de servidor para el primer render y vuelve a renderizar solo si el
 *    del cliente difiere, sin desajustes.
 *
 * El snapshot es una CADENA (`"system|dark"`) y no un objeto: `getSnapshot` debe
 * devolver un valor estable por identidad o React entra en un bucle de renders.
 */
import {
  DEFAULT_THEME_PREFERENCE,
  applyTheme,
  readStoredPreference,
  resolveTheme,
  writeStoredPreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/shared/theme/theme";

export type ThemeSnapshot = `${ThemePreference}|${ResolvedTheme}`;

const SERVER_SNAPSHOT: ThemeSnapshot = `${DEFAULT_THEME_PREFERENCE}|light`;

const listeners = new Set<() => void>();
let cached: ThemeSnapshot | null = null;

function compute(): ThemeSnapshot {
  const preference = readStoredPreference();
  return `${preference}|${resolveTheme(preference)}`;
}

/** Recalcula y avisa. Se llama tras un cambio local, de otra pestaña o del SO. */
function refresh(): void {
  const next = compute();
  if (next === cached) return;
  cached = next;
  applyTheme(parseSnapshot(next).resolved);
  listeners.forEach((listener) => listener());
}

export function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);

  // Cambio hecho en OTRA pestaña del mismo origen.
  window.addEventListener("storage", refresh);

  // Cambio del ajuste del sistema operativo, relevante cuando la preferencia
  // es `system` (y barato de ignorar cuando no lo es: `refresh` compara).
  const media =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
  media?.addEventListener("change", refresh);

  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", refresh);
    media?.removeEventListener("change", refresh);
  };
}

export function getSnapshot(): ThemeSnapshot {
  if (cached === null) cached = compute();
  return cached;
}

export function getServerSnapshot(): ThemeSnapshot {
  return SERVER_SNAPSHOT;
}

export function parseSnapshot(snapshot: ThemeSnapshot): {
  preference: ThemePreference;
  resolved: ResolvedTheme;
} {
  const [preference, resolved] = snapshot.split("|") as [ThemePreference, ResolvedTheme];
  return { preference, resolved };
}

/** Único punto de escritura: persiste, aplica al DOM y notifica. */
export function setPreference(preference: ThemePreference): void {
  writeStoredPreference(preference);
  refresh();
}
