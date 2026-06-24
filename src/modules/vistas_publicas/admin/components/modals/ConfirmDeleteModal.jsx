import React from "react";

export default function ConfirmDeleteModal({
    open,
    title = "Confirmar eliminación",
    message,
    confirmText = "Eliminar",
    cancelText = "Cancelar",
    isLoading = false,
    onConfirm,
    onCancel,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-red-500 mt-0.5">
                            delete_forever
                        </span>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                            <p className="text-sm text-gray-600 mt-2">
                                {message || "¿Seguro que deseas eliminar este archivo? Esta acción no se puede deshacer."}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={onCancel}
                            aria-label="Cerrar"
                            disabled={isLoading}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            className="flex-1 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-all"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </button>

                        <button
                            type="button"
                            className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? "Eliminando..." : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
