import React, { useEffect, useState } from "react";

export default function EditProductoModal({ isOpen, onClose, producto }) {
    const [form, setForm] = useState({
        nombre: "",
        categoria: "",
        duracion_minutos: "",
        precio_base: "",
        id_enfoque_default: "",
        enfoque_default_nombre: "",
    });

    useEffect(() => {
        if (!isOpen) return;
        setForm({
            nombre: producto?.nombre || "",
            categoria: producto?.categoria && producto?.categoria !== "—" ? producto?.categoria : "",
            duracion_minutos:
                producto?.duracion_minutos === null || producto?.duracion_minutos === undefined
                    ? ""
                    : String(producto?.duracion_minutos),
            precio_base: producto?.precio_base === null || producto?.precio_base === undefined ? "" : String(producto?.precio_base),
            id_enfoque_default: producto?.id_enfoque_default === null || producto?.id_enfoque_default === undefined ? "" : String(producto?.id_enfoque_default),
            enfoque_default_nombre: producto?.enfoque_default_nombre || "",
        });
    }, [isOpen, producto]);

    if (!isOpen) return null;

    const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSave = () => {
        // NOTE: todavía no conectamos modificar (solo UI). Queda listo para enlazar.
        // NOTE: todavía no conectamos modificar (solo UI). Queda listo para enlazar.
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
                <div className="px-7 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Productos</p>
                        <h3 className="text-lg font-bold text-slate-900">Editar producto</h3>
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

                <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                        <input
                            value={form.nombre}
                            onChange={onChange("nombre")}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary"
                            placeholder="Nombre del producto"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Categoría</label>
                        <input
                            value={form.categoria}
                            onChange={onChange("categoria")}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary"
                            placeholder="Ej: TERAPIA"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Duración (min)</label>
                        <input
                            value={form.duracion_minutos}
                            onChange={onChange("duracion_minutos")}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary"
                            placeholder="50"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Precio base</label>
                        <input
                            value={form.precio_base}
                            onChange={onChange("precio_base")}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary"
                            placeholder="150.00"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Moneda asumida: BOB</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ID enfoque default</label>
                        <input
                            value={form.id_enfoque_default}
                            onChange={onChange("id_enfoque_default")}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary"
                            placeholder="12"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Enfoque default (nombre)</label>
                        <input
                            value={form.enfoque_default_nombre}
                            onChange={onChange("enfoque_default_nombre")}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary"
                            placeholder="CBT (Actualizado)"
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
