import React, { useEffect, useMemo } from "react";

export default function ProductoDetail({ draft, setDraft, onSave, isSaving = false }) {
    const d = draft || {};

    const setField = (key, value) => setDraft?.((prev) => ({ ...prev, [key]: value }));

    const categorias = useMemo(() => {
        // IMPORTANTE:
        // - No mostramos "Seleccione..." como opción visible.
        // - Si no hay categoría, seteamos una por defecto (primera del array base).
        const base = ["TERAPIA", "CURSO", "PRODUCTO"];
        const current = d?.categoria && d?.categoria !== "—" ? [d.categoria] : [];
        return Array.from(new Set([...current, ...base]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [d?.categoria]);

    // Si está vacío, forzar una categoría por defecto (sin mostrar "Seleccione...")
    useEffect(() => {
        const empty = d?.categoria === null || d?.categoria === undefined || String(d?.categoria).trim() === "" || d?.categoria === "—";
        if (empty && categorias?.length) {
            setField("categoria", categorias[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [d?.categoria, categorias?.length]);

    return (
        <div className="bg-surface-light rounded-2xl shadow-soft border border-border-light overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-light" />

            <div className="p-6 border-b border-border-light bg-secondary/10 flex justify-between items-center">
                <div>
                    <h3 className="font-display text-2xl font-bold text-text-main-light">Detalle del Producto</h3>
                    <p className="text-xs text-text-muted-light uppercase tracking-widest mt-1">ID: {d.id ? String(d.id).toUpperCase() : "---"}</p>
                </div>
                <div className="flex gap-2">
                    <button type="button" className="p-2 text-text-muted-light hover:text-primary transition-colors" title="Eliminar">
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                    <button type="button" className="p-2 text-text-muted-light hover:text-primary transition-colors" title="Compartir">
                        <span className="material-symbols-outlined">share</span>
                    </button>
                </div>
            </div>

            <form
                className="p-8 space-y-8"
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (typeof onSave === "function") {
                        await onSave();
                    }
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-text-muted-light uppercase tracking-widest">
                            Nombre del Producto
                        </label>
                        <input
                            className="w-full bg-background-light border-transparent focus:bg-white focus:border-primary rounded-lg py-3 px-4 text-sm transition-all focus:ring-0"
                            type="text"
                            value={d.nombre || ""}
                            onChange={(e) => setField("nombre", e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-text-muted-light uppercase tracking-widest">
                            Categoría
                        </label>
                        <select
                            className="w-full bg-background-light border-transparent focus:bg-white focus:border-primary rounded-lg py-3 px-4 text-sm transition-all focus:ring-0 cursor-pointer"
                            value={d.categoria && d.categoria !== "—" ? d.categoria : ""}
                            onChange={(e) => setField("categoria", e.target.value)}
                        >
                            {/* opción placeholder oculta */}
                            <option value="" disabled hidden>
                                Seleccione una categoría
                            </option>
                            {categorias.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-text-muted-light uppercase tracking-widest">Descripción</label>
                    <textarea
                        className="w-full bg-background-light border-transparent focus:bg-white focus:border-primary rounded-lg py-3 px-4 text-sm transition-all focus:ring-0"
                        rows={4}
                        value={d.descripcion || ""}
                        onChange={(e) => setField("descripcion", e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-text-muted-light uppercase tracking-widest">Precio Unitario</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-text-muted-light text-sm">$</span>
                            <input
                                className="w-full bg-background-light border-transparent focus:bg-white focus:border-primary rounded-lg py-3 pl-8 pr-4 text-sm transition-all focus:ring-0 font-mono"
                                type="number"
                                value={Number(d.precio || 0)}
                                onChange={(e) => setField("precio", Number(e.target.value || 0))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-text-muted-light uppercase tracking-widest">Stock Disponible</label>
                        <input
                            className="w-full bg-background-light border-transparent focus:bg-white focus:border-primary rounded-lg py-3 px-4 text-sm transition-all focus:ring-0 font-mono"
                            type="number"
                            value={Number(d.stock || 0)}
                            onChange={(e) => setField("stock", Number(e.target.value || 0))}
                        />
                    </div>

                    {/* Toggle de estado removido por requerimiento (el backend maneja estado por acciones). */}
                </div>

                <div className="pt-6 border-t border-dashed border-border-light flex gap-4 justify-end">
                    <button
                        className="px-6 py-2.5 rounded-lg border border-border-light text-text-muted-light hover:bg-gray-50 font-medium transition-all text-sm"
                        type="button"
                    >
                        Descartar
                    </button>
                    <button
                        className="px-10 py-2.5 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
                        type="submit"
                        disabled={isSaving}
                    >
                        <span className="material-symbols-outlined text-sm">save</span>
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}
