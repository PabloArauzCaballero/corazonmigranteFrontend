import React, { useEffect, useMemo, useState } from "react";
import EditUserModal from "./EditUserModal";

export default function UsersTable({
    query,
    setQuery,
    onlyActive,
    setOnlyActive,

    // IMPORTANT: idealmente esto es el array completo (ya filtrado por query/onlyActive en el hook)
    users = [],

    // total real (si `users` ya está paginado desde backend, este total debe venir del backend)
    totalActive,

    session,
}) {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Deactivation modal state
    const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
    const [userToDeactivate, setUserToDeactivate] = useState(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

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

    const handleModificar = (user) => {
        setEditingUser(user);
        setEditModalOpen(true);
    };

    const handleDesactivar = (user) => {
        setUserToDeactivate(user);
        setDeactivateModalOpen(true);
    };

    const confirmDeactivate = async () => {

        showResult("info", "Pendiente: conectar con endpoint USUARIOS_ACTUALIZAR_ESTADO", "Información");
        setDeactivateModalOpen(false);
        setUserToDeactivate(null);
    };

    // Helper to check if user is editable (not PACIENTE/USUARIO)
    const isEditable = (role) => {
        const editableRoles = ["SUPER_ADMIN", "ADMIN", "TERAPEUTA"];
        return editableRoles.includes(role?.toUpperCase());
    };

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [query, onlyActive]);

    // Total (si ya tienes filtro aplicado antes de pasar `users`, esto funciona perfecto)
    // Si tu backend pagina, usa un `total` real del backend en vez de users.length.
    const total = useMemo(() => {
        // Si `users` es el universo filtrado, total = users.length.
        // Si `users` ya viene paginado, NO uses users.length: usa total desde backend.
        return Array.isArray(users) ? users.length : 0;
    }, [users]);

    const totalPages = useMemo(() => {
        const t = total;
        const l = Math.max(1, Number(limit) || 10);
        return Math.max(1, Math.ceil(t / l));
    }, [total, limit]);

    // Clamp page if data/limit changes
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
        if (page < 1) setPage(1);
    }, [page, totalPages]);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const pagedUsers = useMemo(() => {
        if (!Array.isArray(users)) return [];
        return users.slice(startIndex, endIndex);
    }, [users, startIndex, endIndex]);

    const showingFrom = total === 0 ? 0 : startIndex + 1;
    const showingTo = Math.min(endIndex, total);

    const hasPrev = page > 1;
    const hasNext = page < totalPages;

    return (
        <>
            <ActionResultModal
                open={resultOpen}
                kind={resultKind}
                title={resultTitle}
                message={resultMessage}
                onClose={() => setResultOpen(false)}
            />

            <EditUserModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setEditingUser(null);
                }}
                user={editingUser}
                session={session}
            />

            {/* Deactivation Confirmation Modal */}
            {deactivateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="px-7 py-6 text-center">
                            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-red-600">
                                    warning
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                ¿Desactivar usuario?
                            </h3>
                            <p className="text-slate-500 text-sm mb-6">
                                ¿Estás seguro que deseas desactivar a{" "}
                                <strong>{userToDeactivate?.name || userToDeactivate?.email}</strong>?
                                <br />
                                Esta acción puede revertirse posteriormente.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeactivateModalOpen(false);
                                        setUserToDeactivate(null);
                                    }}
                                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeactivate}
                                    className="px-5 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all"
                                >
                                    Sí, Desactivar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-7 py-6 border-b border-slate-200 bg-brand-cream flex items-end justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Directorio de Usuarios</h3>
                        <p className="text-xs text-slate-500 mt-1">Total: {totalActive} activos</p>
                    </div>

                    {/* Controls right side */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <span>Mostrar</span>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    const v = Number(e.target.value) || 10;
                                    setLimit(v);
                                    setPage(1);
                                }}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={!hasPrev}
                                onClick={() => hasPrev && setPage((p) => p - 1)}
                                className={
                                    !hasPrev
                                        ? "px-3 py-2 rounded-xl bg-slate-100 text-slate-300 text-xs font-bold uppercase tracking-widest border border-slate-200 cursor-not-allowed"
                                        : "px-3 py-2 rounded-xl bg-white text-slate-600 text-xs font-bold uppercase tracking-widest border border-slate-200 hover:bg-slate-50"
                                }
                            >
                                Anterior
                            </button>

                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Página <span className="text-slate-900">{page}</span> /{" "}
                                <span className="text-slate-900">{totalPages}</span>
                            </div>

                            <button
                                type="button"
                                disabled={!hasNext}
                                onClick={() => hasNext && setPage((p) => p + 1)}
                                className={
                                    !hasNext
                                        ? "px-3 py-2 rounded-xl bg-slate-100 text-slate-300 text-xs font-bold uppercase tracking-widest border border-slate-200 cursor-not-allowed"
                                        : "px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:opacity-95"
                                }
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-7 py-5 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
                    <div className="relative w-full md:w-96">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">
                            search
                        </span>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-sm outline-none focus:bg-white focus:border-primary"
                            placeholder="Buscar por nombre, ID o email..."
                            type="text"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Solo activos
                        </span>
                        <button
                            type="button"
                            onClick={() => setOnlyActive(!onlyActive)}
                            className={
                                onlyActive
                                    ? "px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest"
                                    : "px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest border border-slate-200"
                            }
                        >
                            {onlyActive ? "ON" : "OFF"}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-[10px] uppercase tracking-[0.15em] font-bold border-b border-slate-200 bg-slate-50">
                                <th className="px-7 py-4">Usuario</th>
                                <th className="px-7 py-4">Acceso / Rol</th>
                                <th className="px-7 py-4 hidden sm:table-cell">Estado</th>
                                <th className="px-7 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {pagedUsers.map((u) => {
                                const inactive = u.status === "Inactivo";
                                return (

                                    <tr
                                        key={u.id}
                                        className={inactive ? "bg-red-50/30" : "hover:bg-slate-50"}
                                    >
                                        <td className="px-7 py-5">
                                            <div className={"flex items-center gap-4 " + (inactive ? "opacity-70" : "")}>
                                                <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold">
                                                    {u.initials}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                                    <p className="text-xs text-slate-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className={"px-7 py-5 " + (inactive ? "opacity-70" : "")}>
                                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                                                {u.role}
                                            </span>
                                        </td>

                                        <td className={"px-7 py-5 hidden sm:table-cell " + (inactive ? "opacity-70" : "")}>
                                            <span
                                                className={
                                                    u.status === "Activo"
                                                        ? "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100"
                                                        : "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100"
                                                }
                                            >
                                                <span
                                                    className={
                                                        u.status === "Activo"
                                                            ? "h-2 w-2 rounded-full bg-green-500"
                                                            : "h-2 w-2 rounded-full bg-red-400"
                                                    }
                                                />
                                                {u.status}
                                            </span>
                                        </td>

                                        <td className="px-7 py-5 text-right">
                                            {inactive ? (
                                                <button
                                                    type="button"
                                                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                                    onClick={() => showResult("info", "Pendiente: activar usuario", "Información")}
                                                >
                                                    <span className="material-symbols-outlined text-sm align-middle mr-1">
                                                        check_circle
                                                    </span>
                                                    Activar
                                                </button>
                                            ) : isEditable(u.role) ? (
                                                <div className="relative inline-block group">
                                                    <button
                                                        type="button"
                                                        className="p-2 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined">more_vert</span>
                                                    </button>
                                                    <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                        <button
                                                            type="button"
                                                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-xl"
                                                            onClick={() => handleModificar(u)}
                                                        >
                                                            <span className="material-symbols-outlined text-base text-slate-400">
                                                                edit
                                                            </span>
                                                            Modificar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-xl"
                                                            onClick={() => handleDesactivar(u)}
                                                        >
                                                            <span className="material-symbols-outlined text-base">block</span>
                                                            Desactivar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                    onClick={() => handleDesactivar(u)}
                                                >
                                                    <span className="material-symbols-outlined text-sm align-middle mr-1">
                                                        block
                                                    </span>
                                                    Desactivar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {pagedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-7 py-10 text-sm text-slate-500">
                                        No hay resultados con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody >
                    </table>
                </div>

                <div className="px-7 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Mostrando{" "}
                        <span className="text-slate-900">
                            {showingFrom}-{showingTo}
                        </span>{" "}
                        de <span className="text-slate-900">{total}</span>
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={!hasPrev}
                            onClick={() => hasPrev && setPage((p) => p - 1)}
                            className={
                                !hasPrev
                                    ? "px-3 py-2 rounded-xl bg-slate-100 text-slate-300 text-xs font-bold uppercase tracking-widest border border-slate-200 cursor-not-allowed"
                                    : "px-3 py-2 rounded-xl bg-white text-slate-600 text-xs font-bold uppercase tracking-widest border border-slate-200 hover:bg-slate-50"
                            }
                        >
                            Anterior
                        </button>
                        <button
                            type="button"
                            disabled={!hasNext}
                            onClick={() => hasNext && setPage((p) => p + 1)}
                            className={
                                !hasNext
                                    ? "px-3 py-2 rounded-xl bg-slate-100 text-slate-300 text-xs font-bold uppercase tracking-widest border border-slate-200 cursor-not-allowed"
                                    : "px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:opacity-95"
                            }
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}
