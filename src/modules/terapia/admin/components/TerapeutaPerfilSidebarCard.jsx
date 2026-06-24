import React, { useMemo } from "react";

function safeStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function initialsFromName(nombreCompleto) {
  const s = safeStr(nombreCompleto).trim();
  if (!s) return "—";
  const parts = s.split(" ").filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

export default function TerapeutaPerfilSidebarCard({
  profile,
  stats,
  onChangePhoto,
}) {

  const nombreCompleto = useMemo(() => {
    const n = safeStr(profile?.nombres).trim();
    const a = safeStr(profile?.apellidos).trim();
    return [n, a].filter(Boolean).join(" ") || "—";
  }, [profile?.nombres, profile?.apellidos]);

  const location = useMemo(() => {
    const p = safeStr(profile?.pais).trim();
    const c = safeStr(profile?.ciudad).trim();
    return [p, c].filter(Boolean).join(", ") || "";
  }, [profile?.pais, profile?.ciudad]);

  // IMPORTANTE:
  // - Cuando el usuario selecciona una nueva foto, el hook setea `profile.foto_url`
  //   con un ObjectURL (preview inmediato) antes de guardar.
  // - `profile.raw.usuario.foto_perfil_link` suele quedarse con el valor anterior
  //   hasta que se vuelva a fetchear el perfil.
  // Por eso priorizamos `profile.foto_url` para que el preview se pinte al instante.
  const foto = safeStr(
    profile?.foto_url ||
    profile?.raw?.usuario?.foto_perfil_link ||
    profile?.raw?.usuario?.avatar_url ||
    profile?.avatar_url ||
    profile?.link ||
    profile?.foto
  ).trim();
  const initials = initialsFromName(nombreCompleto);

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="relative h-32 bg-primary/5">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            {foto ? (
              <img
                alt="Terapeuta"
                className="h-32 w-32 rounded-3xl object-cover border-4 border-white shadow-xl"
                src={foto}
              />
            ) : (
              <div className="h-32 w-32 rounded-3xl border-4 border-white shadow-xl bg-primary/10 flex items-center justify-center">
                <span className="font-display text-3xl text-primary font-bold">
                  {initials}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={onChangePhoto}
              className="absolute bottom-1 right-1 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-primary hover:bg-primary hover:text-white transition-all"
              title="Cambiar foto"
            >
              <span className="material-symbols-outlined text-sm">
                photo_camera
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16 pb-8 px-8 text-center">
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">
          {nombreCompleto}
        </h2>

        <p className="text-brand-gold font-semibold text-sm mb-2">
          {safeStr(profile?.titulo_profesional) || "—"}
        </p>

        {location ? (
          <p className="text-slate-400 text-xs mb-5">{location}</p>
        ) : (
          <div className="h-5" />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-brand-cream border border-primary/5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Sesiones
            </p>
            <p className="text-xl font-display font-bold text-primary">
              {stats?.sesiones ?? "—"}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-brand-cream border border-primary/5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Pacientes
            </p>
            <p className="text-xl font-display font-bold text-primary">
              {stats?.pacientes ?? "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
