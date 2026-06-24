import React, { useState } from "react";
import HeaderAdmin from "../../../terapia/admin/components/HeaderAdmin";
import ProductosCatalog from "../components/ProductosCatalog";
import ProductoDetail from "../components/ProductoDetail";
import EditProductoModal from "../components/EditProductoModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import SuccessModal from "../components/SuccessModal";
import { useProductosAdmin } from "../hooks/useProductosAdmin";
import ActionResultModal from "../../../../app/components/modals/ActionResultModal";

export default function ProductosDashboard({ session, onLogout, activeTab, onNavigate }) {
    const { query, setQuery, filtered, selectedId, setSelectedId, draft, setDraft, isLoading, error, actions } = useProductosAdmin(session);

    const [isSaving, setIsSaving] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState(null);

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
            const rows = res?.rows;
            const msg = Array.isArray(rows) ? rows?.[0]?.message : null;
            return msg || null;
        } catch {
            return null;
        }
    };

    const formatDateTime = (iso) => {
        if (!iso) return "---";
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return String(iso);
            return d.toLocaleString();
        } catch (e) {
            return String(iso);
        }
    };

    const handleSave = async () => {
        if (!draft) return;

        const isNew = !draft.id;
        setIsSaving(true);
        try {
            if (isNew) {
                const { producto } = await actions.crear(draft);
                if (producto) setDraft({ ...producto, _original: { ...producto } });
            } else {
                const { producto } = await actions.modificar(draft);
                if (producto) setDraft({ ...producto, _original: { ...producto } });
            }
        } catch (err) {
            console.error("[Productos] save error", err);
            showResult("error", err?.data?.message || err?.message || "No se pudo guardar el producto", "Ocurrió un problema");
        } finally {
            setIsSaving(false);
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

            <EditProductoModal
                isOpen={editOpen}
                producto={editing}
                onClose={() => {
                    setEditOpen(false);
                    setEditing(null);
                }}
            />

            <ConfirmDeleteModal
                isOpen={deleteOpen}
                title="¿Eliminar producto?"
                message={
                    deleting
                        ? `¿Seguro que deseas eliminar el producto "${deleting.nombre}"? Esta acción requerirá el endpoint correspondiente (pendiente).`
                        : "¿Seguro que deseas eliminar este producto?"
                }
                onCancel={() => {
                    setDeleteOpen(false);
                    setDeleting(null);
                }}
                onConfirm={() => {

                    setDeleteOpen(false);
                    setDeleting(null);
                }}
            />

            <SuccessModal
                isOpen={successOpen}
                title={successTitle}
                message={successMessage}
                onClose={() => setSuccessOpen(false)}
            />

            <main className="max-w-7xl mx-auto p-6 lg:p-10">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <nav className="flex items-center gap-2 text-xs text-text-muted-light mb-2 uppercase tracking-widest">
                            <span>Inicio</span>
                            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                            <span className="text-primary font-bold">Productos</span>
                        </nav>
                        <h2 className="font-display text-4xl font-bold text-primary">Gestión de Productos</h2>
                        <p className="text-text-muted-light font-light text-lg mt-1">
                            Configuración técnica y categorización del catálogo institucional.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-all shadow-md text-sm font-medium"
                            onClick={() => {
                                // Nuevo producto: limpiar selección y setear draft con defaults
                                setSelectedId(null);
                                setDraft(actions.nuevoProductoDraft());
                            }}
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Nuevo Producto
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <section className="lg:col-span-5 space-y-4">
                        <ProductosCatalog
                            query={query}
                            onChangeQuery={setQuery}
                            productos={filtered}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onEdit={(row) => {
                                setEditing(row);
                                setEditOpen(true);
                            }}
                            onDelete={(row) => {
                                setDeleting(row);
                                setDeleteOpen(true);
                            }}
                        />

                        {isLoading ? (
                            <p className="text-xs text-text-muted-light">Cargando productos...</p>
                        ) : error ? (
                            <p className="text-xs text-red-600">{error}</p>
                        ) : null}
                    </section>

                    <section className="lg:col-span-7 space-y-6">
                        <ProductoDetail
                            draft={draft}
                            setDraft={setDraft}
                            isSaving={isSaving}
                            onSave={async () => {
                                if (!draft) return;
                                setIsSaving(true);
                                try {
                                    // Regla:
                                    // - Si NO hay id -> crear
                                    // - Si hay id -> modificar
                                    const isNew = !draft?.id;
                                    const result = isNew ? await actions.crear(draft) : await actions.modificar(draft);

                                    // Refrescar draft con lo retornado (trae updated_at e id_version)
                                    if (result?.producto) {
                                        setDraft({ ...result.producto, _original: { ...result.producto } });
                                    }

                                    // Re-listar para sincronizar catálogo
                                    await actions.listar({ onlyActivos: true });

                                    // Modal de éxito (no depende de listar)
                                    const backendMsg = extractOkMessage(result?.res);
                                    setSuccessTitle(isNew ? "Producto creado" : "Producto actualizado");
                                    setSuccessMessage(backendMsg || (isNew ? "Producto creado correctamente." : "Producto actualizado correctamente."));
                                    setSuccessOpen(true);
                                } catch (err) {
                                    console.error("[Productos] save error", err);
                                    showResult("error", err?.data?.message || err?.message || "No se pudo guardar el producto", "Ocurrió un problema");
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
