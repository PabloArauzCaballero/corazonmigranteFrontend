"use client";

import { useSyncExternalStore } from "react";

/**
 * Suscribe un componente a una media query del navegador.
 *
 * Se usa `useSyncExternalStore` en lugar de `useState` + `useEffect` por dos motivos:
 *  - durante el render en servidor (`output: "export"` prerenderiza el HTML) no hay
 *    `window`, y el snapshot de servidor devuelve el valor por defecto sin provocar
 *    un mismatch de hidratación;
 *  - si la persona cambia el ajuste del sistema (p. ej. activa "reducir movimiento"
 *    en el SO) el valor se actualiza en caliente, sin recargar la página.
 */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : serverFallback),
    () => serverFallback
  );
}

/**
 * `true` cuando la persona ha pedido al sistema operativo reducir las animaciones.
 * Toda la capa de movimiento de la landing debe consultarlo antes de animar.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
