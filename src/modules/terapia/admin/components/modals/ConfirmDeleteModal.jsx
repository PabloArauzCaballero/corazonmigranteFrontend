import React from "react";

export default function ConfirmDeleteModal({
  open,
  title = "Confirmar",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 mt-0.5">
              delete_forever
            </span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600 mt-2">
                {message || "¿Seguro que deseas realizar esta acción?"}
              </p>
            </div>

            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition-colors"
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
              className="flex-1 border border-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
              {isLoading ? "Procesando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
