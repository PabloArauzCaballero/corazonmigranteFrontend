export default function RejectModal({
    open,
    onClose,
    onSubmit,
    loading,
    error,
    selected,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Rechazar solicitud</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="text-sm text-slate-600">
                        Cita: <span className="font-semibold">{selected?.nombre}</span> (ID{" "}
                        {selected?.id})
                    </div>

                    <p className="text-sm text-slate-500">
                        Esto marcará la cita como{" "}
                        <span className="font-semibold">CANCELADO</span> y enviará el motivo
                        al usuario.
                    </p>

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
                        onClick={onSubmit}
                        disabled={loading}
                        className="px-6 py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-60"
                    >
                        {loading ? "Rechazando..." : "Confirmar rechazo"}
                    </button>
                </div>
            </div>
        </div>
    );
}
