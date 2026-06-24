import React, { useEffect, useState } from "react";
import { USUARIOS_ENDPOINTS } from "../../../../config/USUARIOS_ENDPOINTS";
import { createApiConn } from "../../../../helpers/api_conn_factory";

function getTerapeutaNombreFromApiResponse(apiData) {
  if (!apiData) return "";
  const usuario = apiData.usuario;
  if (!usuario) return "";

  return `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim();
}

const INPUT =
  "w-full px-4 py-3 bg-white border border-border-light rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 text-sm shadow-sm";

function normUserType(userType) {
  return (userType || "").toString().trim().toLowerCase();
}

function toIdStr(v) {
  return v === undefined || v === null ? "" : String(v).trim();
}

function pickTerapeutaId(t) {
  if (!t) return "";
  // cubrir variantes comunes de backends
  return toIdStr(
    t.id_usuario_terapeuta ??
    t.id_usuario ??
    t.usuario_id ??
    t.user_id ??
    t.id ??
    t.terapeuta_id
  );
}

function pickTerapeutaLabel(t, idFallback) {
  if (!t) return idFallback ? `#${idFallback}` : "";
  const label =
    toIdStr(t.terapeuta_nombre_completo) ||
    toIdStr(t.nombre_completo) ||
    `${t.p_nombre ?? t.nombre ?? ""} ${t.p_apellido ?? t.apellido ?? ""}`.trim();
  return label || (idFallback ? `#${idFallback}` : "");
}

export default function PerfilForm({
  session,
  userType,
  profile,
  setField,
  isDirty,
  loading,
  saving,
  error,
  onReset,
  onSave,
  onChangePassword,

  // ✅ opcional: lista de terapeutas para el select Admin
  terapeutasDisponibles = [],
}) {
  const lastUpdatedLabel = profile?.lastUpdatedLabel || "";
  const ut = normUserType(userType);

  // Para habilitar el cambio de contraseña necesitamos un email.
  const hasEmail = !!String(profile?.email || "").trim();

  const isTerapeuta = ut === "terapeuta";
  const isAdmin =
    ut === "admin" ||
    ut === "administrador" ||
    ut === "administrator" ||
    ut === "administrador(a)";

  // Fields (planos)
  const sexo = profile?.sexo || ""; // "Masculino"/"Femenino" o "M"/"F"
  const fechaNacimiento = profile?.fecha_nacimiento || ""; // "YYYY-MM-DD"
  // ⚠️ select trabaja con strings (DOM). Normalizamos para que matchee options.
  const idUsuarioTerapeuta = toIdStr(profile?.id_usuario_terapeuta);
  const [assignedTerapeutaLabel, setAssignedTerapeutaLabel] = useState("");

  useEffect(() => {
    const id = idUsuarioTerapeuta;
    if (!id) {
      setAssignedTerapeutaLabel("");
      return;
    }

    // ✅ necesitamos sesión real
    if (!session?.id_sesion || !session?.user_id) {
      // sin sesión no podemos consultar el nombre
      return;
    }

    const cacheKey = `terapeuta_${id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setAssignedTerapeutaLabel(cached);
      return;
    }

    // Si ya viene en la lista del endpoint sin-admin, no consultamos
    const existsInList = (Array.isArray(terapeutasDisponibles) ? terapeutasDisponibles : [])
      .some((t) => pickTerapeutaId(t) === id);

    if (existsInList) return;

    // ✅ Llamada consistente con tu front: createApiConn + session
    (async () => {
      try {
        const payload = {
          p_user_id: Number(id),
          p_id_sesion: session.id_sesion,
          p_actor_user_id: session.user_id,
        };

        // En tu hook de perfil, este endpoint se llama con PATCH.
        const res = await createApiConn(
          USUARIOS_ENDPOINTS.OBTENER_TERAPEUTA,
          payload,
          "PATCH",
          session
        );

        const data = res?.rows?.[0]?.api_usuario_terapeuta_obtener?.data;
        const nombre = getTerapeutaNombreFromApiResponse(data);

        if (nombre) {
          sessionStorage.setItem(cacheKey, nombre);
          setAssignedTerapeutaLabel(nombre);
        }
      } catch {
        console.error("Error al obtener el terapeuta");
      }
    })();
  }, [idUsuarioTerapeuta, terapeutasDisponibles, session]);

  const terapeutasOptions = (() => {
    const base = Array.isArray(terapeutasDisponibles) ? terapeutasDisponibles : [];
    const normalized = base
      .map((t) => {
        const id = pickTerapeutaId(t);
        return {
          id,
          label: pickTerapeutaLabel(t, id),
        };
      })
      .filter((x) => !!x.id);

    const hasSelected = !!idUsuarioTerapeuta;
    const selectedExists = hasSelected && normalized.some((x) => x.id === idUsuarioTerapeuta);

    if (hasSelected && !selectedExists) {
      const id = idUsuarioTerapeuta;
      const label =
        assignedTerapeutaLabel ||
        `Terapeuta actual (#${id})`;

      normalized.unshift({ id, label });
    }
    return normalized;
  })();

  const isSuperAdmin = !!profile?.is_super_admin;
  const canManageFiles = !!profile?.can_manage_files;
  const isAccounter = !!profile?.is_accounter;

  const setBool = (key) => (e) => setField?.(key, !!e.target.checked);

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-white p-8 lg:p-10">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl text-primary font-bold">
            Información del Perfil
          </h3>
          <p className="text-slate-500 text-sm">
            Los cambios realizados se aplicarán al instante.
          </p>
        </div>
        <span className="material-symbols-outlined text-border-light text-4xl">
          contact_page
        </span>
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
        {/* ===================== DATOS PERSONALES ===================== */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">person</span>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Datos Personales
            </h4>
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

            <div className="space-y-2 relative group">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 ml-1">Correo electrónico</label>

                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-slate-300 text-slate-600 text-[12px] cursor-help">
                  i
                </span>
              </div>

              <div
                className="pointer-events-none absolute left-1 top-0 -translate-y-3 opacity-0 group-hover:opacity-100 transition
               bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg"
              >
                Este campo no es modificable
              </div>

              <input
                className={INPUT}
                type="email"
                value={profile?.email || ""}
                onChange={(e) => setField("email", e.target.value)}
                disabled={true}
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Sexo</label>
              <select
                className={INPUT + " appearance-none cursor-pointer"}
                value={sexo}
                onChange={(e) => setField("sexo", e.target.value)}
                disabled={loading || saving}
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Fecha de nacimiento</label>
              <input
                className={INPUT}
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setField("fecha_nacimiento", e.target.value)}
                disabled={loading || saving}
              />
            </div>
            {/* Terapeuta: ubicación */}
            {isTerapeuta ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Ubicación (Pais, Ciudad)
                </label>
                <input
                  className={INPUT}
                  type="text"
                  value={profile?.ubicacion || ""}
                  onChange={(e) => setField("ubicacion", e.target.value)}
                  disabled={loading || saving}
                  placeholder="Ej: Bolivia, Santa Cruz"
                />
                <p className="text-[11px] text-slate-500">
                  Para terapeuta se guarda como{" "}
                  <span className="font-semibold">pais</span> y{" "}
                  <span className="font-semibold">ciudad</span>.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {/* ===================== ADMIN (si aplica) ===================== */}
        {isAdmin ? (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">security</span>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Configuración Administrador
              </h4>
              <div className="h-[1px] flex-grow bg-gradient-to-r from-border-light to-transparent" />
            </div>

            {/* Asignación opcional a terapeuta */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">
                Asignar a Terapeuta (Opcional)
              </label>
              <select
                className={INPUT + " appearance-none cursor-pointer"}
                value={idUsuarioTerapeuta}
                onChange={(e) => setField("id_usuario_terapeuta", e.target.value)}
                disabled={loading || saving}
              >
                <option value="">Sin terapeuta asignado</option>
                {terapeutasOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Selecciona un terapeuta si este administrador gestionará su cuenta.
              </p>
            </div>

          </section>
        ) : null}

        {/* ===================== CUENTA ===================== */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">settings</span>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Configuración de Cuenta
            </h4>
            <div className="h-[1px] flex-grow bg-gradient-to-r from-border-light to-transparent" />
          </div>

          <div className="bg-brand-cream/60 border border-border-light rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h5 className="text-sm font-bold text-slate-800">Contraseña de acceso</h5>
              <p className="text-xs text-slate-500">
                Actualiza tu contraseña regularmente para mayor seguridad.
              </p>
              {!hasEmail ? (
                <p className="text-[11px] text-slate-500 mt-2">
                  No se encontró un correo asociado a tu cuenta.
                </p>
              ) : null}
            </div>

            <button
              className="px-6 py-2.5 bg-white border border-border-light rounded-xl text-sm font-bold text-primary hover:bg-primary/5 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              onClick={() => onChangePassword?.()}
              disabled={loading || saving || !hasEmail || !onChangePassword}
              title={!hasEmail ? "Define tu correo para poder cambiar la contraseña" : ""}
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
