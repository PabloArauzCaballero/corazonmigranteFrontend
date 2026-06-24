import React from "react";

export default function ReprogramarModal({
    open,
    onClose,
    selected,
    reprogDate,
    setReprogDate,
    reprogStart,
    setReprogStart,
    reprogEnd,
    setReprogEnd,
    error,
    loading,
    onSubmit,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Reprogramar cita</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="text-sm text-slate-600">
                        Cita: <span className="font-semibold">{selected?.nombre}</span> (ID {selected?.id})
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Fecha</label>
                            <input
                                type="date"
                                value={reprogDate}
                                onChange={(e) => setReprogDate(e.target.value)}
                                className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Inicio</label>
                            <input
                                type="time"
                                value={reprogStart}
                                onChange={(e) => setReprogStart(e.target.value)}
                                className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Fin</label>
                            <input
                                type="time"
                                value={reprogEnd}
                                onChange={(e) => setReprogEnd(e.target.value)}
                                className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setReprogDate("");
                                    setReprogStart("");
                                    setReprogEnd("");
                                }}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        disabled={loading || !reprogDate || !reprogStart || !reprogEnd}
                        onClick={onSubmit}
                        className="px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-60"
                    >
                        {loading ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}
