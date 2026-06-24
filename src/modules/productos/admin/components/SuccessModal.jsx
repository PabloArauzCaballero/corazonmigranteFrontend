import React from "react";

export default function SuccessModal({
    isOpen,
    title = "Cambios guardados",
    message = "Los cambios fueron realizados correctamente.",
    buttonText = "Aceptar",
    onClose,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                <div className="px-7 py-6 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-3xl text-emerald-600">check_circle</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-6">{message}</p>
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary-light transition-all"
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
