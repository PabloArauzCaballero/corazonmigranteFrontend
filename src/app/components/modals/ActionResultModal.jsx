import React from "react";

/**
 * Modal genérico para reemplazar alert().
 * kind: success | error | info
 */
export default function ActionResultModal({ open, kind = "success", title, message, onClose }) {
  if (!open) return null;

  const k = String(kind || "").toLowerCase();
  const isError = k === "error";
  const isInfo = k === "info";

  const icon = isError ? "error" : isInfo ? "info" : "check_circle";
  const iconColor = isError ? "text-red-600" : isInfo ? "text-blue-600" : "text-green-600";
  const safeTitle =
    title || (isError ? "Ocurrió un problema" : isInfo ? "Información" : "Listo");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
            {safeTitle}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{message || ""}</p>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
