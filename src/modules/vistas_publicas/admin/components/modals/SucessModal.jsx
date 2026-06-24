import React from "react";

export default function SuccessModal({
    open,
    title = "Listo",
    message = "Cambios registrados con éxito.",
    buttonText = "OK",
    onClose,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <button
                type="button"
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-label="Cerrar"
            />

            <div className="relative w-[92%] max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                        ✓
                    </span>
                    <div className="text-base font-semibold text-slate-800">{title}</div>
                </div>

                <div className="p-5">
                    <p className="text-sm text-slate-600 whitespace-pre-line">{message}</p>
                </div>

                <div className="p-5 pt-0 flex items-center justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
