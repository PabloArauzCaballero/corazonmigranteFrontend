import React, { useMemo } from "react";

/**
 * Paginación simple por offset/limit (estilo backend).
 * - "Siguiente" se habilita si la página actual viene llena (count === limit)
 * - No depende de "total" (porque el backend no lo devuelve en este módulo)
 */
export default function PaginationControls({
  offset = 0,
  limit = 50,
  count = 0,
  isLoading = false,
  onPrev,
  onNext,
  onLimitChange,
  limitOptions = [25, 50, 100, 200],
}) {
  const page = useMemo(() => Math.floor((Number(offset) || 0) / (Number(limit) || 1)) + 1, [offset, limit]);
  const from = useMemo(() => (count > 0 ? (Number(offset) || 0) + 1 : 0), [offset, count]);
  const to = useMemo(() => (Number(offset) || 0) + (Number(count) || 0), [offset, count]);
  const canPrev = (Number(offset) || 0) > 0 && !isLoading;
  const canNext = (Number(count) || 0) === (Number(limit) || 0) && !isLoading;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="text-xs text-gray-500 flex items-center gap-3">
        <span>
          Página <span className="font-semibold text-gray-700">{page}</span>
        </span>
        <span className="hidden sm:inline">•</span>
        <span>
          Mostrando <span className="font-semibold text-gray-700">{from}</span>
          {" - "}
          <span className="font-semibold text-gray-700">{to}</span>
        </span>
        <span className="hidden sm:inline">•</span>
        <span className="flex items-center gap-2">
          <span>Por página</span>
          <select
            className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1"
            value={String(limit)}
            onChange={(e) => onLimitChange?.(Number(e.target.value) || 50)}
            disabled={isLoading}
          >
            {limitOptions.map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </span>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          onClick={onPrev}
          disabled={!canPrev}
        >
          <span className="material-icons text-base">chevron_left</span>
          Anterior
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          onClick={onNext}
          disabled={!canNext}
        >
          Siguiente
          <span className="material-icons text-base">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
