import React, { useMemo, useRef, useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import TerapeutaPerfilSidebarCard from "../components/TerapeutaPerfilSidebarCard";
import TerapeutaHorariosCard from "../components/TerapeutaHorariosCard";
import TerapeutaPerfilForm from "../components/TerapeutaPerfilForm";

import HorarioCreateModal from "../components/modals/HorarioCreateModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import SuccessModal from "../components/modals/SuccessModal";

import { useTerapeutaPerfilAdmin } from "../hooks/useTerapeutaPerfilAdmin";
import { useTerapeutaHorariosAdmin } from "../hooks/useTerapeutaHorariosAdmin";

export default function TerapeutaPerfilDashboard({
  session,
  onLogout,
  activeTab,
  onNavigate,
  contaModule,
  setContaModule,
}) {
  const {
    loading,
    error,
    profile,
    setField,
    refresh,
    targetUserId,
    selectFoto,
    fotoDirty,
    save,
    saving,
  } = useTerapeutaPerfilAdmin(session);

  const {
    horarios,
    errorHorarios,
    loadingHorarios,
    creatingHorario,
    refreshHorarios,
    createHorarioFromModal,
    apagarHorario,
  } = useTerapeutaHorariosAdmin(session);

  const stats = useMemo(() => ({ sesiones: "—", pacientes: "—" }), []);

  // ----- Modals -----
  const [openHorarioModal, setOpenHorarioModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, horario: null });
  const [successModal, setSuccessModal] = useState({ open: false, message: "" });

  // ----- Upload foto -----
  const fileRef = useRef(null);
  const handleChangePhoto = () => {
    if (!targetUserId) {
      // si admin no tiene terapeuta asignado, no abrimos picker
      setSuccessModal({
        open: true,
        message: "No se pudo resolver el terapeuta objetivo (falta id_terapeuta).",
      });
      return;
    }
    fileRef.current?.click?.();
  };

  const onPickPhoto = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    // SOLO preview. Se sube al presionar Guardar Cambios.
    selectFoto(file);
    setSuccessModal({ open: true, message: "Foto seleccionada. Guarda cambios para aplicarla." });

    // permitir re-seleccionar el mismo archivo
    if (e?.target) e.target.value = "";
  };

  const handleReset = () => {
    refresh?.();
  };

  const handleSubmit = async () => {
    try {
      await save();
      setSuccessModal({
        open: true,
        message: fotoDirty
          ? "Terapeuta actualizado correctamente (incluye foto)."
          : "Terapeuta actualizado correctamente.",
      });
    } catch (e) {
      setSuccessModal({
        open: true,
        message: e?.message || "No se pudo guardar los cambios.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background-soft text-slate-800 antialiased">
      <HeaderAdmin
        session={session}
        onLogout={onLogout}
        activeTab={activeTab}
        onNavigate={onNavigate}
        contaModule={contaModule}
        setContaModule={setContaModule}
      />

      {/* Header */}
      <div className="bg-brand-cream border-b border-slate-200 px-10 py-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] mb-3 uppercase tracking-widest font-bold">
            <span>Inicio</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary/70">Gestión de Terapeutas</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">Perfil y Horarios</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display text-slate-900 mb-3 font-bold tracking-tight">
                Configuración del Terapeuta
              </h1>
              <p className="text-slate-500 text-lg max-w-2xl font-light">
                Gestión de información profesional y disponibilidad horaria.
              </p>
            </div>


          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto p-10">
        <div className="grid grid-cols-12 gap-10">
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <TerapeutaPerfilSidebarCard
              profile={profile}
              stats={stats}
              onChangePhoto={handleChangePhoto}
            />

            {/* input file escondido */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickPhoto}
              disabled={saving}
            />

            {errorHorarios ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorHorarios}
              </div>
            ) : null}

            <TerapeutaHorariosCard
              horarios={horarios}
              onAdd={() => setOpenHorarioModal(true)}
              onRemove={(h) => setDeleteModal({ open: true, horario: h })}
              onRefresh={refreshHorarios}
              loading={loadingHorarios}
            />
          </aside>

          <section className="col-span-12 lg:col-span-8">
            <TerapeutaPerfilForm
              profile={profile}
              onChange={setField}
              onSubmit={handleSubmit}
              onReset={handleReset}
              disabled={loading || saving}
              isSaving={saving}
            />
          </section>
        </div>
      </main>

      {/* Modal: crear horario */}
      <HorarioCreateModal
        open={openHorarioModal}
        onClose={() => setOpenHorarioModal(false)}
        isSaving={Boolean(creatingHorario)}
        defaultTimeZone={profile?.timezone || null}
        onSubmit={async (form) => {
          try {
            await createHorarioFromModal(form);
            setOpenHorarioModal(false);
            setSuccessModal({ open: true, message: "Horario creado correctamente." });
          } catch (e) {
            setSuccessModal({ open: true, message: e?.message || "No se pudo crear horario." });
          }
        }}
      />

      {/* Modal: confirmar eliminación */}
      <ConfirmDeleteModal
        open={deleteModal.open}
        title="Apagar horario"
        message={
          deleteModal?.horario
            ? `¿Seguro que deseas apagar el horario ${deleteModal.horario?.dia || ""} ${deleteModal.horario?.rango || ""}?`
            : "¿Seguro que deseas apagar este horario?"
        }
        confirmText="Apagar"
        isLoading={false}
        onCancel={() => setDeleteModal({ open: false, horario: null })}
        onConfirm={async () => {
          try {
            await apagarHorario(deleteModal?.horario);
            setDeleteModal({ open: false, horario: null });
            setSuccessModal({ open: true, message: "Horario apagado correctamente." });
          } catch (e) {
            setDeleteModal({ open: false, horario: null });
            setSuccessModal({ open: true, message: e?.message || "No se pudo apagar el horario." });
          }
        }}
      />

      {/* Modal: éxito */}
      <SuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, message: "" })}
        message={successModal.message}
      />
    </div>
  );
}
