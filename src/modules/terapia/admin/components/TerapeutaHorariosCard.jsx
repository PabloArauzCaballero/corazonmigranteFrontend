import React from "react";

export default function TerapeutaHorariosCard({
  horarios = [],
  onAdd,
  onRemove,
  onRefresh,
  loading = false,
}) {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">calendar_month</span>
          Horarios Disponibles
        </h3>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-50 rounded-lg"
            title="Recargar"
            disabled={loading}
          >
            <span className="material-symbols-outlined text-lg">
              {loading ? "sync" : "refresh"}
            </span>
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-12 px-2 mb-2 gap-2">
        <div className="col-span-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Día
        </div>
        <div className="col-span-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Horario
        </div>
        <div className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right" />
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-xs text-slate-500 px-2 py-3">Cargando horarios...</div>
        ) : horarios?.length ? (
          horarios.map((h) => (
            <div
              key={h.id}
              className="grid grid-cols-12 items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50 gap-2 hover:border-primary/20 transition-colors"
            >
              <div className="col-span-4 text-xs font-medium text-slate-700">
                {h.dia}
              </div>
              <div className="col-span-6 text-xs font-bold text-primary bg-white px-2 py-1 rounded border border-slate-100 w-fit">
                {h.rango}
              </div>
              <div className="col-span-2 text-right">
                <button
                  type="button"
                  onClick={() => onRemove?.(h)}
                  className="text-slate-400 hover:text-primary transition-colors p-1 hover:bg-white rounded-lg group"
                  title="Eliminar"
                >
                  <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-500 px-2 py-3">
            No hay horarios cargados.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={loading}
        className="w-full mt-6 py-3 px-4 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">add_circle</span>
        Añadir horario
      </button>
    </div>
  );
}
