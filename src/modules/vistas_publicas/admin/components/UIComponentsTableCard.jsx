import React from "react";

export default function UIComponentsTableCard({
    rows = [],
    isLoading = false,
    error = "",
    onRefresh,
    onEdit,

    // pagination
    page = 1,
    limit = 10,
    hasNext = false,
    onPrev,
    onNext,
    onLimitChange,
    activeId,
}) {
    return (
        <section className="rounded-xl overflow-hidden shadow-sm bg-white/70 backdrop-blur border border-primary/10">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">view_quilt</span>
                    <h3 className="font-display text-xl text-gray-800">Elementos UI</h3>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        <span>Mostrar</span>
                        <select
                            value={limit}
                            disabled={isLoading}
                            onChange={(e) => onLimitChange?.(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 bg-white"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => onRefresh?.()}
                        className="text-gray-400 hover:text-primary transition-colors disabled:opacity-60"
                        disabled={isLoading}
                        aria-label="refresh"
                        title="Refrescar"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                </div>
            </div>

            {error ? <div className="p-6 text-sm text-red-600">{error}</div> : null}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID Elemento</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Página</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tipo</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Código</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Acción</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                                    Cargando elementos UI...
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                                    No hay elementos para mostrar.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, idx) => {
                                const isActive = activeId != null && row.id === activeId;

                                return (
                                    <tr
                                        key={row.id ?? `row_${idx}`}
                                        className={[
                                            "hover:bg-gray-50 transition-colors",
                                            idx % 2 === 1 ? "bg-gray-50/30" : "",
                                            isActive ? "ring-1 ring-primary/30 bg-primary/5" : "",
                                        ].join(" ")}
                                    >
                                        <td className="px-6 py-4 text-sm font-mono text-primary">{row.id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{row.page || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{row.type || "-"}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{row.code || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{row.value || "-"}</td>

                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
                                                type="button"
                                                title="Editar"
                                                onClick={() => onEdit?.(row)}
                                                disabled={isLoading}
                                            >
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => onPrev?.()}
                    disabled={isLoading || page <= 1}
                    className="w-8 h-8 rounded-full hover:bg-white text-xs transition-colors flex items-center justify-center disabled:opacity-40"
                    title="Anterior"
                >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>

                <span className="text-xs font-bold text-gray-600">Página {page}</span>

                <button
                    type="button"
                    onClick={() => onNext?.()}
                    disabled={isLoading || !hasNext}
                    className="w-8 h-8 rounded-full hover:bg-white text-xs transition-colors flex items-center justify-center disabled:opacity-40"
                    title="Siguiente"
                >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>
        </section>
    );
}
