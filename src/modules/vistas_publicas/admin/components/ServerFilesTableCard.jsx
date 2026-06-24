import React, { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";

export default function ServerFilesTableCard({
    rows = [],
    onDelete,
    onDownload,
    isDeleting = false,
    isDownloading = false,
    defaultLimit = 10,
}) {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetFile, setTargetFile] = useState(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(defaultLimit);

    // Cuando cambia rows o limit, asegúrate de estar en página válida
    useEffect(() => {
        setPage(1);
    }, [limit]);

    const totalPages = useMemo(() => {
        const n = Math.ceil((rows?.length || 0) / (limit || 1));
        return Math.max(1, n);
    }, [rows, limit]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
        if (page < 1) setPage(1);
    }, [page, totalPages]);

    const pagedRows = useMemo(() => {
        const start = (page - 1) * limit;
        const end = start + limit;
        return rows.slice(start, end);
    }, [rows, page, limit]);

    const openDeleteModal = (file) => {
        setTargetFile(file);
        setIsModalOpen(true);
    };

    const closeDeleteModal = () => {
        if (isDeleting) return;
        setIsModalOpen(false);
        setTargetFile(null);
    };

    const confirmDelete = async () => {
        if (!targetFile?.id) return;
        try {
            await onDelete?.(targetFile.id);
            closeDeleteModal();
        } catch (e) {
            console.error("Delete failed:", e);
        }
    };

    // UI pages (estilo: 1 2 3 ... >)
    const pagesToShow = useMemo(() => {
        // muestra siempre 1..3 si existen, y si estás más adelante muestra cerca del current
        if (totalPages <= 4) return Array.from({ length: totalPages }, (_, i) => i + 1);

        // si estás en 1-3, muestra 1,2,3
        if (page <= 3) return [1, 2, 3];

        // si estás cerca del final, muestra last-2,last-1,last
        if (page >= totalPages - 2) return [totalPages - 2, totalPages - 1, totalPages];

        // si estás en medio, muestra page-1,page,page+1
        return [page - 1, page, page + 1];
    }, [page, totalPages]);

    const canNext = page < totalPages;
    const canPrev = page > 1;

    return (
        <section className="rounded-xl overflow-hidden shadow-sm bg-white/70 backdrop-blur border border-primary/10">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">folder_open</span>
                    <h3 className="font-display text-xl text-gray-800">Tabla de Archivos en Servidor</h3>
                </div>

                {/* Limit selector */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Mostrar
                    </span>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-200 rounded-lg text-xs px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                ID Archivo
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Nombre
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                Tamaño
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">
                                Acción
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {pagedRows.length === 0 ? (
                            <tr>
                                <td className="px-6 py-6 text-sm text-gray-500" colSpan={4}>
                                    No hay archivos para mostrar.
                                </td>
                            </tr>
                        ) : (
                            pagedRows.map((f, idx) => (
                                <tr
                                    key={f.id}
                                    className={[
                                        "hover:bg-gray-50 transition-colors",
                                        idx % 2 === 1 ? "bg-gray-50/30" : "",
                                    ].join(" ")}
                                >
                                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{f.path}</td>
                                    <td className="px-6 py-4 text-sm font-medium">{f.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{f.size}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                className="border border-gray-200 text-gray-700 text-[10px] px-3 py-1 rounded-full uppercase font-bold hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                onClick={() => onDownload?.(f)}
                                                disabled={isDownloading}
                                            >
                                                <span className="material-symbols-outlined text-[18px] leading-none">download</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="bg-primary text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold hover:bg-opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                onClick={() => openDeleteModal(f)}
                                                disabled={isDeleting}
                                            >
                                                <span className="material-symbols-outlined text-[18px] leading-none">delete</span>
                                            </button>
                                        </div>
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 flex justify-center items-center gap-2">
                <button
                    type="button"
                    className="w-8 h-8 rounded-full hover:bg-white text-xs transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!canPrev}
                    aria-label="Anterior"
                >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>

                {pagesToShow.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={[
                            "w-8 h-8 rounded-full text-xs flex items-center justify-center transition-colors",
                            p === page ? "bg-primary text-white" : "hover:bg-white",
                        ].join(" ")}
                    >
                        {p}
                    </button>
                ))}

                {totalPages > 4 && pagesToShow[pagesToShow.length - 1] < totalPages && (
                    <>
                        <span className="flex items-center px-1">...</span>
                        <button
                            type="button"
                            onClick={() => setPage(totalPages)}
                            className={[
                                "w-8 h-8 rounded-full text-xs flex items-center justify-center transition-colors",
                                page === totalPages ? "bg-primary text-white" : "hover:bg-white",
                            ].join(" ")}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                <button
                    type="button"
                    className="w-8 h-8 rounded-full hover:bg-white text-xs transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!canNext}
                    aria-label="Siguiente"
                >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>

            <ConfirmDeleteModal
                open={isModalOpen}
                message={
                    targetFile
                        ? `¿Seguro que deseas eliminar "${targetFile.name}"? Esta acción no se puede deshacer.`
                        : undefined
                }
                isLoading={isDeleting}
                onCancel={closeDeleteModal}
                onConfirm={confirmDelete}
            />
        </section>
    );
}
