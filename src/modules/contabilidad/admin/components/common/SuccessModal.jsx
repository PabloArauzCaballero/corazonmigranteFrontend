import React from "react";

export default function SuccessModal({ open, title = "Listo", message = "", onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[92vw] max-w-md rounded-2xl bg-white shadow-xl border border-primary/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">check_circle</span>
          <h3 className="font-display text-lg text-gray-800">{title}</h3>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 whitespace-pre-line">{message}</p>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-primary text-white font-semibold shadow-sm hover:opacity-95 active:opacity-90"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
