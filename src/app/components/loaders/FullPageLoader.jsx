import React from "react";

/**
 * Overlay de carga a pantalla completa.
 * - No modifica lógica, solo muestra un estado visual.
 * - Bloquea interacción para evitar acciones mientras carga/guarda.
 */
export default function FullPageLoader({
  show = false,
  label = "Cargando...",
  sublabel = "",
  zIndex = 50,
}) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
      style={{ zIndex }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-soft border border-black/10 dark:border-white/10 px-6 py-5 max-w-[92vw]">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-black/10 dark:border-white/10 border-t-transparent animate-spin" />
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
              {label}
            </div>
            {sublabel ? (
              <div className="text-sm text-slate-500 dark:text-slate-300 mt-0.5">
                {sublabel}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
