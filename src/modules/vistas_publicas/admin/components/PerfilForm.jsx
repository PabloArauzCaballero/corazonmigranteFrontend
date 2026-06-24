import React from "react";

const INPUT =
  "w-full px-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 text-sm shadow-sm";

export default function PerfilForm({
  userType,
  profile,
  setField,
  isDirty,
  loading,
  saving,
  error,
  onReset,
  onChangePassword,
  onSave,
}) {
  const lastUpdatedLabel = profile?.lastUpdatedLabel || "";

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-white p-8 lg:p-10">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl text-primary font-bold">Información del Perfil</h3>
          <p className="text-slate-500 text-sm">Los cambios realizados se aplicarán al instante.</p>
        </div>
        <span className="material-symbols-outlined text-border-light text-4xl">contact_page</span>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      ) : null}

      <form
        className="space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          onSave?.();
        }}
      >
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">person</span>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Datos Personales</h4>
            <div className="h-[1px] flex-grow bg-gradient-to-r from-border-light to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Nombre</label>
              <input
                className={INPUT}
                type="text"
                value={profile?.nombre || ""}
                onChange={(e) => setField("nombre", e.target.value)}
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Apellido</label>
              <input
                className={INPUT}
                type="text"
                value={profile?.apellido || ""}
                onChange={(e) => setField("apellido", e.target.value)}
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Correo electrónico</label>
              <input
                className={INPUT}
                type="email"
                value={profile?.email || ""}
                onChange={(e) => setField("email", e.target.value)}
                disabled={loading || saving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Teléfono</label>
              <input
                className={INPUT}
                type="tel"
                value={profile?.telefono || ""}
                onChange={(e) => setField("telefono", e.target.value)}
                disabled={loading || saving}
              />
            </div>

            {userType === "terapeuta" ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 ml-1">Ubicación (Pais, Ciudad)</label>
                <input
                  className={INPUT}
                  type="text"
                  value={profile?.ubicacion || ""}
                  onChange={(e) => setField("ubicacion", e.target.value)}
                  disabled={loading || saving}
                  placeholder="Ej: Bolivia, Santa Cruz"
                />
                <p className="text-[11px] text-slate-500">
                  Para terapeuta se guarda como <span className="font-semibold">pais</span> y <span className="font-semibold">ciudad</span>.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">settings</span>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Configuración de Cuenta</h4>
            <div className="h-[1px] flex-grow bg-gradient-to-r from-border-light to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Idioma del panel</label>
              <select
                className={INPUT + " appearance-none"}
                value={profile?.idioma || "es-ES"}
                onChange={(e) => setField("idioma", e.target.value)}
                disabled={loading || saving}
              >
                <option value="es-ES">Español (ES)</option>
                <option value="en-US">English (EN)</option>
                <option value="fr-FR">Français (FR)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Zona horaria</label>
              <select
                className={INPUT + " appearance-none"}
                value={profile?.timezone || "America/La_Paz"}
                onChange={(e) => setField("timezone", e.target.value)}
                disabled={loading || saving}
              >
                <option value="America/La_Paz">(GMT-04:00) La Paz</option>
                <option value="Europe/Madrid">(GMT+01:00) Madrid</option>
                <option value="America/New_York">(GMT-05:00) New York</option>
              </select>
            </div>
          </div>

          <div className="bg-brand-cream/60 border border-border-light rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h5 className="text-sm font-bold text-slate-800">Contraseña de acceso</h5>
              <p className="text-xs text-slate-500">Actualiza tu contraseña regularmente para mayor seguridad.</p>
            </div>
            <button
              className="px-6 py-2.5 bg-white border border-border-light rounded-xl text-sm font-bold text-primary hover:bg-primary/5 transition-all shadow-sm"
              type="button"
              onClick={onChangePassword}
              disabled={loading || saving}
            >
              Cambiar contraseña
            </button>
          </div>
        </section>

        <div className="pt-8 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 italic flex items-center gap-2">
            <span className="material-symbols-outlined text-base">info</span>
            {lastUpdatedLabel || (loading ? "Cargando..." : "")}
          </p>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              className="flex-1 sm:flex-none px-8 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              disabled={!isDirty || loading || saving}
              onClick={onReset}
              title={!isDirty ? "No hay cambios para descartar" : "Descartar cambios"}
            >
              Descartar
            </button>

            <button
              className="flex-1 sm:flex-none px-10 py-3.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              type="submit"
              disabled={!isDirty || loading || saving}
              title={!isDirty ? "No hay cambios para guardar" : "Guardar cambios"}
            >
              {saving ? "Guardando..." : "Actualizar perfil"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
