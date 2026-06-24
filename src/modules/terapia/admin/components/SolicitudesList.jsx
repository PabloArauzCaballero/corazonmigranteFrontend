import React from "react";

export default function SolicitudesList({
    query,
    setQuery,
    filtered,
    selectedId,
    setSelectedId,
    loading,
    loadError,
}) {
    return (
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">
            <div className="relative mb-2">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                </span>
                <input
                    className="w-full pl-12 pr-4 py-4 bg-white border-slate-200 rounded-2xl text-sm focus:ring-primary focus:border-primary shadow-sm"
                    placeholder="Buscar por nombre o expediente..."
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {loading && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                        Cargando solicitudes...
                    </div>
                )}

                {loadError && !loading && (
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-sm">
                        {loadError}
                        <button className="ml-3 underline font-semibold" onClick={() => window.location.reload()}>
                            Reintentar
                        </button>
                    </div>
                )}

                {!loading && !loadError && filtered.length === 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                        No hay solicitudes.
                    </div>
                )}

                {filtered.map((s) => {
                    const isSelected = s.id === selectedId;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setSelectedId(s.id)}
                            className={
                                isSelected
                                    ? "w-full p-5 flex items-start gap-4 text-left rounded-2xl bg-white border-2 border-primary shadow-xl shadow-primary/5 transition-all group relative"
                                    : "w-full p-5 flex items-start gap-4 text-left rounded-2xl bg-white border border-slate-200 hover:border-primary/30 transition-all hover:shadow-lg group"
                            }
                        >
                            {s.avatar ? (
                                <img
                                    alt={s.nombre}
                                    className="h-14 w-14 rounded-xl object-cover shadow-md border-2 border-primary/10"
                                    src={s.avatar}
                                />
                            ) : (
                                <div className="h-14 w-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xl">
                                    {s.iniciales || "??"}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded tracking-tighter">
                                        {s.ref}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${s.estadoBadgeClass}`}>
                                            {s.estado}
                                        </span>
                                        {s.pagado ? (
                                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-violet-700 text-white">
                                                Pagado
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <h4 className={`font-bold text-slate-900 text-lg ${!isSelected ? "group-hover:text-primary transition-colors" : ""}`}>
                                    {s.nombre}
                                </h4>

                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                                    <span className={`material-symbols-outlined text-[16px] ${isSelected ? "text-primary" : ""}`}>
                                        calendar_today
                                    </span>
                                    {s.fecha} • {s.hora}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}