import React, { useState } from "react";
import HeaderAdmin from "../../../terapia/admin/components/HeaderAdmin";
import EnfoquesList from "../components/EnfoquesList";
import EnfoqueDetail from "../components/EnfoqueDetail";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import SuccessModal from "../components/SuccessModal";
import { useEnfoquesAdmin } from "../hooks/useEnfoquesAdmin";
import ActionResultModal from "../../../../app/components/modals/ActionResultModal";

export default function EnfoquesDashboard({ session, onLogout, activeTab, onNavigate }) {
    const { query, setQuery, filtered, selectedId, setSelectedId, draft, setDraft, isLoading, error, actions } = useEnfoquesAdmin(session);

    const [isSaving, setIsSaving] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const [successOpen, setSuccessOpen] = useState(false);
    const [successTitle, setSuccessTitle] = useState("Cambios guardados");
    const [successMessage, setSuccessMessage] = useState("Los cambios fueron realizados correctamente.");

    // Modal resultado (reemplazo de alert)
    const [resultOpen, setResultOpen] = useState(false);
    const [resultKind, setResultKind] = useState("info");
    const [resultTitle, setResultTitle] = useState("");
    const [resultMessage, setResultMessage] = useState("");

    const showResult = (kind, message, title = "") => {
        setResultKind(kind || "info");
        setResultTitle(title || "");
        setResultMessage(message || "");
        setResultOpen(true);
    };

    const extractOkMessage = (res) => {
        try {
            // casos: normal {rows:[{message}]} o flujo con archivo {link:{rows:[{message}]}, create:{...}, update:{...}}
            const tryGet = (obj) => {
                const rows = obj?.rows;
                return Array.isArray(rows) ? rows?.[0]?.message : null;
            };
            return (
                tryGet(res?.link) ||
                tryGet(res?.update) ||
                tryGet(res?.create) ||
                tryGet(res) ||
                null
            );
        } catch {
            return null;
        }
    };

    return (
        <div className="min-h-screen bg-background-light text-text-main-light antialiased">
            <HeaderAdmin session={session} onLogout={onLogout} activeTab={activeTab} onNavigate={onNavigate} />

            <ActionResultModal
                open={resultOpen}
                kind={resultKind}
                title={resultTitle}
                message={resultMessage}
                onClose={() => setResultOpen(false)}
            />

            <ConfirmDeleteModal
                isOpen={deleteOpen}
                title="¿Eliminar enfoque?"
                message={
                    deleting
                        ? `¿Seguro que deseas eliminar el enfoque "${deleting.nombre}"?`
                        : "¿Seguro que deseas eliminar este enfoque?"
                }
                onCancel={() => {
                    setDeleteOpen(false);
                    setDeleting(null);
                }}
                onConfirm={async () => {
                    try {
                        if (deleting?.id) await actions.apagar(deleting.id);
                        await actions.listar({ onlyActivos: true });
                    } finally {
                        setDeleteOpen(false);
                        setDeleting(null);
                    }
                }}
            />

            <SuccessModal
                isOpen={successOpen}
                title={successTitle}
                message={successMessage}
                onClose={() => setSuccessOpen(false)}
            />

            <main className="max-w-[1600px] mx-auto p-6 lg:p-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-text-sub-light text-[10px] uppercase tracking-widest font-bold mb-2">
                        <span>Inicio</span>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span className="text-primary">Productos</span>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span className="text-primary">Enfoques</span>
                    </div>
                    <div>
                        <h1 className="font-display text-3xl font-bold text-primary tracking-tight">Gestión de Enfoques</h1>
                        <p className="text-sm text-text-sub-light mt-1">Configuración y edición de enfoques institucionales.</p>
                    </div>

                    <button
                        type="button"
                        className="px-6 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        onClick={() => {
                            setSelectedId(null);
                            setDraft(actions.nuevoEnfoqueDraft());
                        }}
                    >
                        <span className="material-symbols-outlined">add</span>
                        Nuevo Enfoque
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-5 space-y-6">
                        <EnfoquesList
                            query={query}
                            onChangeQuery={setQuery}
                            enfoques={filtered}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onEdit={(row) => {
                                // En esta pantalla, "Editar" solo selecciona para editar en el panel derecho
                                if (row?.id) setSelectedId(row.id);
                            }}
                            onDelete={(row) => {
                                setDeleting(row);
                                setDeleteOpen(true);
                            }}
                        />

                        {isLoading ? (
                            <p className="text-xs text-text-sub-light">Cargando enfoques...</p>
                        ) : error ? (
                            <p className="text-xs text-red-600">{error}</p>
                        ) : null}
                    </section>

                    <section className="lg:col-span-7 space-y-6">
                        <EnfoqueDetail
                            draft={draft}
                            setDraft={setDraft}
                            isSaving={isSaving}
                            onSave={async () => {
                                if (!draft) return;
                                setIsSaving(true);
                                try {
                                    const isNew = !draft?.id;
                                    const result = isNew ? await actions.crear(draft) : await actions.modificar(draft);
                                    if (result?.enfoque) {
                                        setDraft({ ...result.enfoque, _original: { ...result.enfoque } });
                                    }
                                    await actions.listar({ onlyActivos: true });

                                    const backendMsg = extractOkMessage(result?.res);
                                    setSuccessTitle(isNew ? "Enfoque creado" : "Enfoque actualizado");
                                    setSuccessMessage(
                                        backendMsg || (isNew ? "Enfoque creado correctamente." : "Enfoque actualizado correctamente.")
                                    );
                                    setSuccessOpen(true);
                                } catch (err) {
                                    console.error("[Enfoques] save error", err);
                                    showResult("error", err?.data?.message || err?.message || "No se pudo guardar el enfoque", "Ocurrió un problema");
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-surface-light border border-border-light rounded-xl flex items-center gap-4">
                                <div className="p-3 bg-secondary/50 rounded-lg">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-text-muted-light uppercase tracking-widest">
                                        Última Modificación
                                    </p>
                                    <p className="text-xs font-medium">
                                        {draft?.updated_at ? new Date(draft.updated_at).toLocaleString() : "---"}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-surface-light border border-border-light rounded-xl flex items-center gap-4">
                                <div className="p-3 bg-secondary/50 rounded-lg">
                                    <span className="material-symbols-outlined text-primary">local_shipping</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-text-muted-light uppercase tracking-widest">
                                        Número de versión del registro
                                    </p>
                                    <p className="text-xs font-medium">{draft?.id_version ?? "---"}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
