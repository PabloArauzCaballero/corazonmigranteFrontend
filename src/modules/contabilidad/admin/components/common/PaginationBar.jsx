import React from "react";

export default function PaginationBar({
  page = 1,
  limit = 10,
  hasNext = false,
  isLoading = false,
  onPrev,
  onNext,
  onLimitChange,
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
        <span>Mostrar</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange?.(Number(e.target.value))}
          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-primary/30"
          disabled={isLoading}
        >
          {[5, 10, 15, 20, 30, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={isLoading || page <= 1}
          className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">chevron_left</span>
        </button>
        <div className="min-w-[72px] text-center text-xs font-semibold text-gray-700">
          Página {page}
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading || !hasNext}
          className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
