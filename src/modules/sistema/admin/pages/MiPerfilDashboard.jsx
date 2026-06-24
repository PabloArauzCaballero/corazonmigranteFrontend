import React from "react";
import HeaderAdmin from "../../../terapia/admin/components/HeaderAdmin";
import PageHeader from "../components/PageHeader";
import PerfilSidebar from "../components/PerfilSidebar";
import PerfilForm from "../components/PerfilForm";
import { useMiPerfil } from "../hooks/useMiPerfil";
import PasswordRecoveryModal from "../../../auth/admin/components/PasswordRecoveryModal";
import ActionResultModal from "../../../../app/components/modals/ActionResultModal";
import { useState } from "react";

export default function MiPerfilDashboard({
  session,
  onLogout,
  activeTab,
  onNavigate,
  contaModule,
  setContaModule,
}) {
  const [pwdModalOpen, setPwdModalOpen] = useState(false);

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


  const {
    userType,
    reason,
    profile,
    setField,
    isDirty,
    loading,
    saving,
    error,
    reset,
    save,
    uploadingAvatar,
    selectAvatar,
    terapeutasDisponibles,
  } = useMiPerfil(session);

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

      <PageHeader
        title="Mi Perfil"
        subtitle="Gestiona tu información personal y configuración de cuenta."
      />

      <main className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8">
        {!userType ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm">
            <p className="font-bold text-slate-800">No se puede cargar tu perfil.</p>
            <p className="text-slate-600 mt-1">
              Sesión detectada, pero no se encontró un rol compatible (admin/accounter/super_admin o terapeuta).
            </p>
            <p className="text-slate-500 mt-2 text-xs">Motivo: {reason}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <PerfilSidebar
                profile={profile}
                loading={loading}
                uploadingAvatar={uploadingAvatar}
                onSelectAvatar={selectAvatar}
              />
            </div>

            <div className="lg:col-span-2">
              <PerfilForm
                session={session}
                userType={userType}
                profile={profile}
                setField={setField}
                isDirty={isDirty}
                loading={loading}
                saving={saving}
                error={error}
                onChangePassword={() => setPwdModalOpen(true)}
                onReset={reset}
                onSave={async () => {
                  try {
                    await save();
                    showResult("success", "Perfil actualizado.", "Listo");
                  } catch {
                    // error ya manejado en el hook
                  }
                }}
                terapeutasDisponibles={terapeutasDisponibles}
              />
            </div>
          </div>
        )}
      </main>


      <ActionResultModal
        open={resultOpen}
        kind={resultKind}
        title={resultTitle}
        message={resultMessage}
        onClose={() => setResultOpen(false)}
      />

      <PasswordRecoveryModal
        open={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        initialEmail={profile?.email || session?.email || ""}
        lockEmail
        secureMode
      />
    </div>
  );
}