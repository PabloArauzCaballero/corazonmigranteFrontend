"use client";

import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

const SHOW_DELAY_MS = 150;
const HIDE_DELAY_MS = 200;

/**
 * Barra de carga fija arriba de la pantalla, visible en toda la app (publica,
 * paciente, terapeuta y admin) mientras haya una petición activa a la API.
 * El retraso al mostrar evita parpadeos en peticiones instantáneas; el retraso
 * al ocultar evita que desaparezca a mitad de una transición de página a página.
 */
export function GlobalLoadingBar() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const active = isFetching > 0 || isMutating > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      const timeout = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-primary/15" role="status" aria-live="polite" aria-label="Cargando">
      <div className="h-full w-1/3 animate-[global-loading-bar_1.1s_ease-in-out_infinite] bg-primary shadow-[0_0_12px_rgba(99,48,35,0.5)]" />
    </div>
  );
}
