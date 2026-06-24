import React from "react";

export default function ConfirmModal({
    open,
    title = "Confirmar acción",
    message = "¿Seguro que quieres continuar?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* overlay */}
            <button
                type="button"
                className="absolute inset-0 bg-black/40"
                onClick={loading ? undefined : onCancel}
                aria-label="Cerrar"
            />

            {/* modal */}
            <div className="relative w-[92%] max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
                <div className="p-5 border-b border-slate-100">
                    <div className="text-base font-semibold text-slate-800">{title}</div>
                </div>

                <div className="p-5">
                    <p className="text-sm text-slate-600 whitespace-pre-line">{message}</p>
                </div>

                <div className="p-5 pt-0 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={[
                            "px-4 py-2 rounded-xl text-white disabled:opacity-60",
                            danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:opacity-95",
                        ].join(" ")}
                    >
                        {loading ? "Procesando..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
