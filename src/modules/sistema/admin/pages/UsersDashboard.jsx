import React, { useMemo } from "react";
import HeaderAdmin from "../../../terapia/admin/components/HeaderAdmin";
import UsersForm from "../components/UsersForm";
import UsersTable from "../components/UsersTable";
import PageHeader from "../components/PageHeader";
import { useUsuariosAdmin } from "../hooks/useUsuariosAdmin";
import { exportUsersCsv } from "../utils/exportUsersCsv";
import ActionResultModal from "../../../../app/components/modals/ActionResultModal";

export default function UsersDashboard({ session, onLogout, activeTab, onNavigate }) {
    const { query, setQuery, onlyActive, setOnlyActive, users, filtered, reloadUsers } =
        useUsuariosAdmin(session);
    // Modal resultado (reemplazo de alert)
    const [resultOpen, setResultOpen] = React.useState(false);
    const [resultKind, setResultKind] = React.useState("info");
    const [resultTitle, setResultTitle] = React.useState("");
    const [resultMessage, setResultMessage] = React.useState("");

    const showResult = (kind, message, title = "") => {
        setResultKind(kind || "info");
        setResultTitle(title || "");
        setResultMessage(message || "");
        setResultOpen(true);
    };

    const totalActive = useMemo(
        () => (filtered ?? []).filter((u) => u.status === "Activo").length,
        [filtered]
    );

    return (
        <>
            <ActionResultModal
                open={resultOpen}
                kind={resultKind}
                title={resultTitle}
                message={resultMessage}
                onClose={() => setResultOpen(false)}
            />

        <div className="min-h-screen bg-background-soft text-slate-800 antialiased">
            <HeaderAdmin
                session={session}
                onLogout={onLogout}
                activeTab={activeTab}
                onNavigate={onNavigate}
            />

            <PageHeader
                breadcrumb={[
                    { label: "Inicio" },
                    { label: "Usuarios", active: true },
                ]}
                title="Registro y Control de Usuarios"
                subtitle="Gestión centralizada de acceso, roles y permisos"
                action={
                    <button
                        type="button"
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-black transition-all"
                        onClick={() => {
                            const res = exportUsersCsv(filtered ?? []);
                            if (res?.ok === false) {
                                showResult("info", res?.message || "No hay usuarios para exportar", "Información");
                            }
                        }}
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Exportar
                    </button>
                }
            />

            <main className="max-w-[1600px] mx-auto p-8">
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-6">
                        <UsersForm />
                    </div>

                    <div className="col-span-12 lg:col-span-6">
                        <UsersTable
                            query={query}
                            setQuery={setQuery}
                            onlyActive={onlyActive}
                            setOnlyActive={setOnlyActive}
                            users={filtered ?? []}
                            totalActive={totalActive}
                            session={session}
                            onRefresh={reloadUsers}
                            onResult={showResult}
                        />
                    </div>
                </div>
            </main>
        </div>
        </>
    );
}
