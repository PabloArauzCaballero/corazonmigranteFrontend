import React, { useMemo } from "react";

export default function EnfoqueEditor({ enfoque }) {
    const safe = enfoque || {};

    const tags = useMemo(() => safe.tags || [], [safe.tags]);

    return (
        <div className="bg-card-light rounded-2xl shadow-soft border border-white p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-primary font-display font-bold text-lg mb-2">Nombre del Enfoque</label>
                        <input
                            className="w-full bg-white border border-border-light focus:ring-primary focus:border-primary rounded-xl px-4 py-3 text-text-main-light shadow-sm"
                            type="text"
                            value={safe.nombre || ""}
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block text-text-sub-light font-sans text-xs font-bold uppercase tracking-wider mb-2">
                            Breve Descripción
                        </label>
                        <textarea
                            className="w-full bg-white border border-border-light focus:ring-primary focus:border-primary rounded-xl px-4 py-3 text-text-main-light shadow-sm resize-none"
                            rows={4}
                            value={safe.descripcion || ""}
                            readOnly
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-text-sub-light font-sans text-xs font-bold uppercase tracking-wider mb-2">
                        Imagen Destacada
                    </label>
                    <div className="border-2 border-dashed border-border-light rounded-2xl p-8 bg-white/50 flex flex-col items-center justify-center text-center group hover:border-primary hover:bg-white transition-all cursor-pointer h-[230px]">
                        <span className="material-symbols-outlined text-4xl text-text-sub-light group-hover:text-primary mb-3">
                            cloud_upload
                        </span>
                        <p className="text-sm font-semibold text-text-main-light">Arrastra una imagen aquí</p>
                        <p className="text-xs text-text-sub-light mt-1">PNG, JPG hasta 5MB</p>
                        <button
                            type="button"
                            className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
                        >
                            Explorar archivos
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-border-light">
                <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-primary">settings_suggest</span>
                    <h3 className="font-display text-xl text-primary font-bold">Configuración Avanzada</h3>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm">
                        <label className="block text-text-main-light font-semibold text-base mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">label</span>
                            Tags:
                        </label>

                        <div className="flex flex-wrap items-center gap-2 p-3 bg-background-light/30 border border-border-light rounded-xl min-h-[60px]">
                            {tags.map((t) => (
                                <span
                                    key={t}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold shadow-sm"
                                >
                                    {t}
                                    <button
                                        type="button"
                                        className="hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center"
                                        title="Eliminar"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                </span>
                            ))}

                            <input
                                className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-text-main-light min-w-[150px]"
                                placeholder="Escribe y presiona enter..."
                                type="text"
                                readOnly
                            />
                        </div>

                        <p className="text-[10px] text-text-sub-light mt-3 uppercase tracking-widest font-bold px-1">
                            Sugerencias: Arraigo, Ciudadanía, Participación
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm">
                        <label className="block text-text-main-light font-semibold text-base mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">database</span>
                            Custom Metadata
                        </label>

                        <div className="border-2 border-dashed border-border-light/50 rounded-xl p-6 mb-4 flex flex-col items-center justify-center bg-background-light/10">
                            <p className="text-sm text-text-sub-light italic">
                                No hay pares clave-valor adicionales definidos.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="w-full group flex items-center justify-center gap-3 py-4 px-4 border border-dashed border-primary/40 text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-300 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-2xl">add_circle</span>
                            <span className="font-bold tracking-wide uppercase text-sm">+ Add Key-Value</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-10 flex items-center justify-between pt-8 border-t border-border-light">
                <button type="button" className="text-text-sub-light font-bold text-sm hover:text-primary transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined">delete</span>
                    Eliminar Borrador
                </button>

                <div className="flex items-center gap-4">
                    <button type="button" className="px-8 py-3 rounded-xl border border-border-light font-bold text-sm hover:bg-white transition-all text-text-main-light">
                        Descartar
                    </button>
                    <button type="button" className="px-10 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover hover:-translate-y-0.5 transition-all">
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}
