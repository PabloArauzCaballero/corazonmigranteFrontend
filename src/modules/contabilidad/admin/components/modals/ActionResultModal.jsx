import React from "react";

export default function ActionResultModal({ open, kind = "success", title, message, onClose }) {
  if (!open) return null;

  const isError = String(kind).toLowerCase() === "error";
  const icon = isError ? "error" : "check_circle";
  const iconColor = isError ? "text-red-600" : "text-green-600";
  const safeTitle = title || (isError ? "Ocurrió un problema" : "Listo");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
            <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
            {safeTitle}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{message || ""}</p>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-95"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
