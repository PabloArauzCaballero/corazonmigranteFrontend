import React, { useEffect, useState } from "react";

export default function EditEnfoqueModal({ isOpen, onClose, enfoque }) {
    const [form, setForm] = useState({ nombre: "", descripcion: "" });

    useEffect(() => {
        if (!isOpen) return;
        setForm({
            nombre: enfoque?.nombre || "",
            descripcion: enfoque?.descripcion || "",
        });
    }, [isOpen, enfoque]);

    if (!isOpen) return null;

    const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSave = () => {
        // NOTE: todavía no conectamos modificar (solo UI). Queda listo para enlazar.
        // NOTE: todavía no conectamos modificar (solo UI). Queda listo para enlazar.
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
                <div className="px-7 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enfoques</p>
                        <h3 className="text-lg font-bold text-slate-900">Editar enfoque</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        aria-label="Cerrar"
                        title="Cerrar"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="px-7 py-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Nombre
                        </label>
                        <input
                            value={form.nombre}
                            onChange={onChange("nombre")}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary"
                            placeholder="Nombre del enfoque"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={form.descripcion}
                            onChange={onChange("descripcion")}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary min-h-[120px]"
                            placeholder="Descripción del enfoque"
                        />
                    </div>
                </div>

                <div className="px-7 py-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-95"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
