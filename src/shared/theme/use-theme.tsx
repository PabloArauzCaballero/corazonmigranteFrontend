"use client";

import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  parseSnapshot,
  setPreference,
  subscribe,
} from "@/shared/theme/theme-store";
import type { ResolvedTheme, ThemePreference } from "@/shared/theme/theme";

export type UseThemeResult = {
  /** Lo que la persona eligió; puede ser `system`. */
  preference: ThemePreference;
  /** Lo que se está pintando ahora mismo. */
  resolved: ResolvedTheme;
  /**
   * `false` mientras se sirve el HTML estático y durante la hidratación.
   *
   * Con `output: "export"` el mismo HTML llega a todo el mundo, así que el
   * servidor no puede saber qué tema eligió cada persona. Los controles usan
   * esta bandera para no marcar una opción que contradiga al HTML servido.
   */
  ready: boolean;
  setPreference: (preference: ThemePreference) => void;
};

/**
 * No hay Provider: el tema es estado del DOM, no del árbol de React, y
 * `useSyncExternalStore` permite leerlo desde cualquier componente sin
 * envolver la aplicación ni provocar renders en cascada.
 */
export function useTheme(): UseThemeResult {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { preference, resolved } = parseSnapshot(snapshot);

  return { preference, resolved, ready: useIsHydrated(), setPreference };
}

/** Suscripción vacía: este valor solo cambia una vez, al hidratar. */
const noopSubscribe = () => () => {};

/**
 * `false` durante el render del servidor y la hidratación; `true` después.
 *
 * No sirve `typeof window !== "undefined"`: al hidratar, `window` YA existe, de
 * modo que el primer render del cliente devolvería `true` mientras el HTML
 * servido decía `false` — justo el desajuste que se quiere evitar.
 */
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
