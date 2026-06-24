import React, { useEffect, useMemo, useRef, useState } from "react";

// Util: formatear metadata a pares key-value (sin tags)
function metadataToPairs(metadata) {
    const m = metadata && typeof metadata === "object" ? metadata : {};
    return Object.entries(m)
        .filter(([k]) => k !== "tags")
        .map(([k, v]) => ({ key: k, value: v }));
}

function normalizeMetadata(metadata) {
    if (!metadata || typeof metadata !== "object") return { tags: [] };
    const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
    return { ...metadata, tags };
}

export default function EnfoqueDetail({ draft, setDraft, onSave, isSaving = false }) {
    const d = draft || {};

    // Imagen
    const fileInputRef = useRef(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

    // Reset de preview local cuando cambias de enfoque (o cuando el backend ya devolvió una url)
    useEffect(() => {
        setLocalPreviewUrl(null);
        // Nota: no limpiamos d._image_file aquí porque el draft vive arriba.
        // Pero sí dejamos el input vacío para permitir re-seleccionar el mismo archivo.
        if (fileInputRef.current) fileInputRef.current.value = "";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [d?.id]);

    const meta = useMemo(() => normalizeMetadata(d.metadata), [d.metadata]);
    const tags = meta.tags || [];

    const [tagInput, setTagInput] = useState("");
    const [kvKey, setKvKey] = useState("");
    const [kvValue, setKvValue] = useState("");

    const kvPairs = useMemo(() => metadataToPairs(meta), [meta]);

    const setField = (key, value) => setDraft?.((prev) => ({ ...prev, [key]: value }));
    const setMetadata = (nextMeta) => setField("metadata", nextMeta);

    const onPickImage = (file) => {
        if (!file) return;
        // Guardamos solo a nivel UI (para que el usuario vea la previsualización).
        try {
            const url = URL.createObjectURL(file);
            setLocalPreviewUrl(url);
        } catch {
            // no-op
        }
        // Guardamos el archivo en el draft para que el hook decida si usa *-con-archivo.
        setField("_image_file", file);
    };

    const addTag = (raw) => {
        const t = String(raw || "").trim();
        if (!t) return;
        if (tags.includes(t)) return;
        setMetadata({ ...meta, tags: [...tags, t] });
    };

    const removeTag = (t) => {
        setMetadata({ ...meta, tags: (tags || []).filter((x) => x !== t) });
    };

    const addKeyValue = () => {
        const k = String(kvKey || "").trim();
        if (!k) return;
        // Intento de parse simple: si es número, guardar número; si es 'true/false', boolean
        let v = kvValue;
        const vStr = String(kvValue ?? "").trim();
        if (vStr === "true") v = true;
        else if (vStr === "false") v = false;
        else if (vStr !== "" && !Number.isNaN(Number(vStr))) v = Number(vStr);
        setMetadata({ ...meta, [k]: v });
        setKvKey("");
        setKvValue("");
    };

    const removeKey = (k) => {
        const next = { ...meta };
        delete next[k];
        setMetadata(next);
    };

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
            <div className="p-6 border-b border-border-light bg-brand-cream flex justify-between items-center">
                <div>
                    <h3 className="font-display text-2xl font-bold text-text-main-light">Detalle del Enfoque</h3>
                    <p className="text-xs text-text-muted-light uppercase tracking-widest mt-1">ID: {d.id ?? "---"}</p>
                </div>
            </div>

            <form
                className="p-8 space-y-8"
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (typeof onSave === "function") await onSave();
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-text-muted-light uppercase tracking-widest">
                            Nombre del Enfoque
                        </label>
                        <input
                            className="w-full bg-background-light border-transparent focus:bg-white focus:border-primary rounded-lg py-3 px-4 text-sm transition-all focus:ring-0"
                            type="text"
                            value={d.nombre || ""}
                            onChange={(e) => setField("nombre", e.target.value)}
                        />
                    </div>

                    {/* Imagen destacada (placeholder) */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-text-muted-light uppercase tracking-widest">
                            Imagen destacada
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Espacio 1: Subida */}
                            <div
                                className="border border-dashed border-border-light rounded-2xl p-5 bg-white flex flex-col items-center justify-center text-center gap-2"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const f = e.dataTransfer?.files?.[0];
                                    if (f) onPickImage(f);
                                }}
                            >
                                <span className="material-symbols-outlined text-primary">cloud_upload</span>
                                <p className="text-sm font-semibold">Arrastra una imagen aquí</p>
                                <p className="text-xs text-text-muted-light">PNG, JPG hasta 5MB</p>
                                <button
                                    type="button"
                                    className="mt-2 px-4 py-2 rounded-full border border-border-light bg-white hover:bg-gray-50 text-sm font-semibold"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Explorar archivos
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        onPickImage(f);
                                    }}
                                />
                            </div>

                            {/* Espacio 2: Vista previa */}
                            <div className="border border-border-light rounded-2xl p-3 bg-white flex items-center justify-center overflow-hidden min-h-[170px]">
                                {localPreviewUrl ? (
                                    <img src={localPreviewUrl} alt="Vista previa" className="max-h-[160px] w-auto rounded-xl" />
                                ) : (d?.archivo_url || d?.url) ? (
                                    <img
                                        src={d.archivo_url || d.url}
                                        alt="Imagen del enfoque"
                                        className="max-h-[160px] w-auto rounded-xl"
                                    />
                                ) : (
                                    <div className="text-center text-sm text-text-muted-light">
                                        <span className="material-symbols-outlined text-primary">image</span>
                                        <p className="mt-2">No se ha subido ninguna imagen</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-text-muted-light uppercase tracking-widest">
                        Breve descripción
                    </label>
                    <textarea
                        className="w-full bg-background-light border-transparent focus:bg-white focus:border-primary rounded-lg py-3 px-4 text-sm transition-all focus:ring-0"
                        rows={4}
                        value={d.descripcion || ""}
                        onChange={(e) => setField("descripcion", e.target.value)}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">settings</span>
                        <h4 className="font-display text-lg font-semibold text-text-main-light">Configuración avanzada</h4>
                    </div>

                    {/* TAGS */}
                    <div className="bg-surface-light border border-border-light rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">label</span>
                            <p className="text-sm font-semibold">Tags</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {(tags || []).map((t) => (
                                <span
                                    key={t}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/40 text-xs"
                                >
                                    {t}
                                    <button
                                        type="button"
                                        className="text-text-muted-light hover:text-primary"
                                        onClick={() => removeTag(t)}
                                        title="Quitar"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                </span>
                            ))}
                        </div>

                        <input
                            className="w-full bg-white border border-border-light rounded-full py-3 px-5 text-sm focus:border-primary outline-none"
                            placeholder="Escribe y presiona Enter..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTag(tagInput);
                                    setTagInput("");
                                }
                            }}
                        />
                        <p className="text-[10px] text-text-muted-light uppercase tracking-widest">
                            Se guarda en <span className="font-mono">metadata.tags</span>
                        </p>
                    </div>

                    {/* KEY-VALUE */}
                    <div className="bg-surface-light border border-border-light rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">database</span>
                            <p className="text-sm font-semibold">Custom Metadata (atributo - valor)</p>
                        </div>

                        {kvPairs.length ? (
                            <div className="border border-border-light rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-[10px] font-bold text-text-muted-light uppercase tracking-widest">
                                                Atributo
                                            </th>
                                            <th className="text-left px-4 py-3 text-[10px] font-bold text-text-muted-light uppercase tracking-widest">
                                                Valor
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {kvPairs.map((row) => (
                                            <tr key={row.key} className="bg-white border-t border-border-light">
                                                <td className="px-4 py-3 font-mono text-xs">{row.key}</td>
                                                <td className="px-4 py-3 font-mono text-xs">{JSON.stringify(row.value)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        className="text-red-600 hover:text-red-700 text-xs font-semibold"
                                                        onClick={() => removeKey(row.key)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="border border-dashed border-border-light rounded-xl p-6 text-center text-sm text-text-muted-light">
                                No hay pares clave-valor adicionales definidos.
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                            <input
                                className="md:col-span-2 w-full bg-white border border-border-light rounded-lg py-3 px-4 text-sm"
                                placeholder="atributo (ej: nivel)"
                                value={kvKey}
                                onChange={(e) => setKvKey(e.target.value)}
                            />
                            <input
                                className="md:col-span-2 w-full bg-white border border-border-light rounded-lg py-3 px-4 text-sm"
                                placeholder="valor (ej: base)"
                                value={kvValue}
                                onChange={(e) => setKvValue(e.target.value)}
                            />
                            <button
                                type="button"
                                className="md:col-span-1 w-full px-4 py-3 rounded-lg border border-border-light bg-white hover:bg-gray-50 text-sm font-semibold"
                                onClick={addKeyValue}
                            >
                                + Add
                            </button>
                        </div>
                        <p className="text-[10px] text-text-muted-light uppercase tracking-widest">
                            Se guarda en <span className="font-mono">metadata</span> (excepto <span className="font-mono">tags</span>).
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-dashed border-border-light flex gap-4 justify-end">
                    <button
                        className="px-6 py-2.5 rounded-lg border border-border-light text-text-muted-light hover:bg-gray-50 font-medium transition-all text-sm"
                        type="button"
                        onClick={() => {
                            // Reset a original si existe
                            if (d?._original) setDraft({ ...d._original, _original: { ...d._original } });
                        }}
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
