import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import HeaderAdmin from "../components/HeaderAdmin";
import SolicitudesList from "../components/SolicitudesList";
import SolicitudesAgenda from "../components/SolicitudesAgenda";
import SolicitudDetail from "../components/SolicitudDetail";

import RejectModal from "../components/modals/RejectModal";
import ConfirmModal from "../components/modals/ConfirmModal";
import PagadoModal from "../components/modals/PagadoModal";
import ReprogramarModal from "../components/modals/ReprogramarModal";
import SuccessModal from "../components/modals/SuccessModal";
import RealizarModal from "../components/modals/RealizarModal";

import { useSolicitudes } from "../hooks/useSolicitudes";
import { useCitaActions } from "../hooks/useCitaActions";

export default function RequestDashboard({ session, onLogout, activeTab, onNavigate }) {
    const [guideStep, setGuideStep] = useState(0);
    const [viewMode, setViewMode] = useState("list"); // "list" | "agenda"
    const navigate = useNavigate();

    const {
        query,
        setQuery,
        solicitudes,
        setSolicitudes,
        selectedId,
        setSelectedId,
        selected,
        filtered,
        loading,
        loadError,
    } = useSolicitudes(session);

    const actions = useCitaActions({ session, selected, setSolicitudes });
    // ========= Reglas de habilitación de botones =========
    const estadoUpper = String(selected?.estado || "").toUpperCase();

    return (
        <div className="min-h-screen bg-background-soft text-slate-800 antialiased">
            <HeaderAdmin
                session={session}
                onLogout={onLogout}
                activeTab={activeTab}
                onNavigate={onNavigate}
            />

            {/* Page header */}
            <div className="bg-brand-cream border-b border-slate-200 px-10 py-10">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] mb-3 uppercase tracking-widest font-bold">
                        <span>Inicio</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-primary">Panel de Control de Solicitudes</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-display text-slate-900 mb-3 font-bold tracking-tight">
                                Panel de Control de Solicitudes
                            </h1>
                            <p className="text-slate-500 text-lg max-w-2xl font-light">
                                Gestión centralizada de citas
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pb-1">
                            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={
                                        viewMode === "list"
                                            ? "px-6 py-2 text-xs font-bold uppercase tracking-wider text-primary bg-brand-cream rounded-lg shadow-sm"
                                            : "px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                                    }
                                >
                                    Lista
                                </button>
                                <button
                                    onClick={() => setViewMode("agenda")}
                                    className={
                                        viewMode === "agenda"
                                            ? "px-6 py-2 text-xs font-bold uppercase tracking-wider text-primary bg-brand-cream rounded-lg shadow-sm"
                                            : "px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                                    }
                                >
                                    Agenda
                                </button>
                            </div>
                            <button onClick={() => navigate("nueva-cita")} className="flex items-center gap-2 px-5 py-3 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-black transition-all">
                                <span className="material-symbols-outlined text-sm">add_circle</span> Nueva Cita
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto p-8">
                <div className="grid grid-cols-12 gap-8 master-detail-container">
                    {viewMode === "list" ? (
                        <SolicitudesList
                            query={query}
                            setQuery={setQuery}
                            filtered={filtered}
                            selectedId={selectedId}
                            setSelectedId={setSelectedId}
                            loading={loading}
                            loadError={loadError}
                        />
                    ) : (
                        <SolicitudesAgenda
                            solicitudes={filtered}
                            onSelect={(id) => setSelectedId(id)}
                        />
                    )}

                    <SolicitudDetail
                        variant={viewMode}
                        selected={selected}
                        className={viewMode === "agenda" ? "col-span-12 lg:col-span-4" : "col-span-12 lg:col-span-8"}
                        guideStep={guideStep}
                        setGuideStep={setGuideStep}
                        notes={actions.notes}
                        setNotes={actions.setNotes}
                        onOpenReject={() => {
                            actions.setSuccessOpen(false);
                            actions.setRejectOpen(true);
                        }}
                        onOpenReprog={() => actions.openReprogWithPrefill()}
                        onOpenConfirm={() => {
                            actions.setSuccessOpen(false);
                            actions.setConfirmOpen(true);
                        }}
                        onOpenPagado={() => {
                            actions.setSuccessOpen(false);
                            actions.setPagadoOpen(true);
                        }}
                        onOpenRealizar={() => {
                            actions.setSuccessOpen(false);
                            actions.setRealizarOpen(true);
                        }}
                    />
                </div>

                <div className="mt-8 flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        Mostrando <span className="text-slate-900">1 - {filtered.length}</span> de{" "}
                        <span className="text-slate-900">{filtered.length}</span> solicitudes
                    </p>
                </div>
            </main>

            {/* Modals */}
            <RejectModal
                open={actions.rejectOpen}
                onClose={() => actions.setRejectOpen(false)}
                selected={selected}
                error={actions.rejectError}
                loading={actions.rejectLoading}
                onSubmit={actions.handleRejectSubmit}
            />

            <ConfirmModal
                open={actions.confirmOpen}
                onClose={() => actions.setConfirmOpen(false)}
                selected={selected}
                error={actions.confirmError}
                loading={actions.confirmLoading}
                onSubmit={actions.handleConfirmSubmit}
            />

            <PagadoModal
                open={actions.pagadoOpen}
                onClose={() => actions.setPagadoOpen(false)}
                selected={selected}
                error={actions.pagadoError}
                loading={actions.pagadoLoading}
                onSubmit={actions.handlePagadoSubmit}
            />

            <RealizarModal
                open={actions.realizarOpen}
                onClose={() => actions.setRealizarOpen(false)}
                selected={selected}
                error={actions.realizarError}
                loading={actions.realizarLoading}
                onSubmit={actions.handleRealizarSubmit}
            />

            <ReprogramarModal
                open={actions.reprogOpen}
                onClose={() => actions.setReprogOpen(false)}
                selected={selected}
                reprogDate={actions.reprogDate}
                setReprogDate={actions.setReprogDate}
                reprogStart={actions.reprogStart}
                setReprogStart={actions.setReprogStart}
                reprogEnd={actions.reprogEnd}
                setReprogEnd={actions.setReprogEnd}
                error={actions.reprogError}
                loading={actions.reprogLoading}
                onSubmit={actions.handleReprogramarSubmit}
            />

            <SuccessModal
                open={actions.successOpen}
                onClose={() => actions.setSuccessOpen(false)}
                message={actions.successMsg}
            />
        </div>
    );
}