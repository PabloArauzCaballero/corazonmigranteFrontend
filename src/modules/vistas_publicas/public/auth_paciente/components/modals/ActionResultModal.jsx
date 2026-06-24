import React from "react";

export default function ActionResultModal({ open, kind = "success", title, message, onClose }) {
  if (!open) return null;

  const isError = String(kind).toLowerCase() === "error";
  const icon = isError ? "error" : "check_circle";
  const iconColor = isError ? "text-red-600" : "text-green-600";
  const safeTitle = title || (isError ? "Ocurrió un problema" : "Listo");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
            {safeTitle}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 leading-relaxed">{message || ""}</p>
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
