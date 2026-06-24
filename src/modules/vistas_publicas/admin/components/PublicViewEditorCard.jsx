import React, { useMemo, useState } from "react";
import ConfirmModal from "../components/modals/ConfirmModal.jsx";
import SuccessModal from "../components/modals/SucessModal.jsx";

export default function PublicViewEditorCard({
    selectedView,
    setSelectedView,
    title,
    setTitle,
    description,
    setDescription,
    isVisible,
    setIsVisible,
    file,
    setFile,
    onSubmit,
    onCancel,
    disabled = false,
    isSaving = false,
    saveError = "",
    uploadDir = "",
}) {
    const glassCard =
        "rounded-xl p-8 shadow-sm bg-white/70 backdrop-blur border border-primary/10";

    // ---- Modals state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [successMsg, setSuccessMsg] = useState("Cambios registrados con éxito.");

    // Mensaje del confirm con mini-resumen (opcional, pero útil)
    const confirmMessage = useMemo(() => {
        const lines = [
            "¿Seguro que quieres guardar estos cambios en la vista pública?",
            "",
            `• Código: ${title || "-"}`,
            `• Carpeta destino: ${uploadDir ? `/${uploadDir}` : "(sin seleccionar)"}`,
            file ? `• Archivo: ${file.name}` : "• Archivo: (sin archivo)",
        ];
        return lines.join("\n");
    }, [title, uploadDir, file]);

    const handleAskSave = () => {
        if (disabled || isSaving) return;
        setConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        if (isSaving) return;

        try {
            // Cerramos el confirm y ejecutamos el submit real
            setConfirmOpen(false);

            // onSubmit debe retornar el JSON (res) {ok, message, data}
            const res = await (onSubmit?.() ?? Promise.resolve(null));

            if (res?.ok) {
                setSuccessMsg(res?.message || "Cambios registrados con éxito.");
                setSuccessOpen(true);
            }
            // Si no ok, el saveError ya se mostrará (lo setea el hook)
        } catch (e) {
            // Si tu hook ya setea saveError, no necesitas duplicar. Solo log.
            console.error("[PublicViewEditorCard] submit error:", e);
        }
    };

    const handleCloseSuccess = () => {
        setSuccessOpen(false);
    };

    return (
        <>
            {/* Confirm modal */}
            <ConfirmModal
                open={confirmOpen}
                title="Confirmar guardado"
                message={confirmMessage}
                confirmText="Sí, guardar"
                cancelText="Cancelar"
                loading={isSaving}
                onConfirm={handleConfirmSave}
                onCancel={() => setConfirmOpen(false)}
            />

            {/* Success modal */}
            <SuccessModal
                open={successOpen}
                title="Cambios registrados"
                message={successMsg}
                buttonText="OK"
                onClose={handleCloseSuccess}
            />

            <section className={glassCard}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">
                            edit_note
                        </span>
                        <h3 className="font-display text-2xl text-gray-800 italic">
                            Editar Vista Pública
                        </h3>
                    </div>
                </div>

                {/* arriba del formulario */}
                {disabled ? (
                    <div className="mb-4 text-xs text-gray-500">
                        Selecciona un elemento (icono de pluma) para editarlo.
                    </div>
                ) : null}

                <div className={disabled ? "opacity-60 pointer-events-none select-none" : ""}>
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Título *
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-background-light border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-sm"
                                placeholder="Escribe un título..."
                                type="text"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={description}
                                disabled={disabled}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-background-light border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary transition-all text-sm"
                                placeholder="Describa el propósito de la vista pública..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Archivo Adjunto
                            </label>
                            <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-gray-400 mb-2">
                                    upload_file
                                </span>

                                <span className="text-sm text-gray-500">
                                    {file ? `Seleccionado: ${file.name}` : "Haz click o arrastra un archivo"}
                                </span>

                                <input
                                    disabled={disabled}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>

                            {/* Carpeta destino (se elige en el explorador) */}
                            <div className="mt-3 text-xs text-gray-500">
                                Carpeta destino:{" "}
                                <span className="font-mono">
                                    {uploadDir ? `/${uploadDir}` : "(selecciona una carpeta en el explorador)"}
                                </span>
                            </div>
                        </div>

                        {saveError ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs p-3">
                                {saveError}
                            </div>
                        ) : null}

                        <div className="flex gap-4 pt-4">
                            <button
                                disabled={disabled || isSaving}
                                type="button"
                                className="flex-1 bg-primary text-white font-medium py-3 rounded-lg hover:opacity-90 transition-all shadow-md"
                                onClick={handleAskSave}
                            >
                                {isSaving ? "Guardando..." : "Guardar vista pública"}
                            </button>

                            <button
                                disabled={disabled || isSaving}
                                type="button"
                                className="px-8 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-all"
                                onClick={onCancel}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </>
    );
}
