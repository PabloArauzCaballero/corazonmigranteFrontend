import React, { useEffect, useMemo, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { USUARIOS_ENDPOINTS } from "../../../../config/USUARIOS_ENDPOINTS";
import HeaderAdmin from "../components/HeaderAdmin";
import BookingPage from "../../../vistas_publicas/public/pages/BookingPage";

/**
 * Nueva cita desde Portal Admin:
 * 1) Elegir paciente
 * 2) Reusar el flujo de Booking (vistas_publicas/public)
 *
 * Nota: Este selector SOLO se muestra en el portal admin (ruta /admin/...).
 * El booking público no lo incluye.
 */
export default function NuevaCitaAdminPage({ session, onLogout, activeTab, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [paciente, setPaciente] = useState(null);

  const adminReturnTo = useMemo(() => {
    const p = typeof window !== "undefined" ? String(window.location?.pathname || "") : "";
    const bp = p.startsWith("/portal-admin") ? "/portal-admin" : "/admin";
    return `${bp}/solicitudes`;
  }, []);

  useEffect(() => {
    let alive = true;
    if (!session?.user_id || !session?.id_sesion) return;

    async function run() {
      setLoading(true);
      setErr("");
      try {
        const payload = {
          p_actor_user_id: session.user_id,
          p_id_sesion: session.id_sesion,
          p_limit: 500,
          p_offset: 0,
        };

        const res = await createApiConn(USUARIOS_ENDPOINTS.USUARIOS_LISTAR, payload, "POST", session);
        const rows = Array.isArray(res?.rows) ? res.rows : Array.isArray(res?.items) ? res.items : [];
        if (!alive) return;
        setUsers(rows);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "No se pudo cargar la lista de usuarios");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [session]);

  const pacientes = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();

    const onlyPacientes = (users || []).filter((u) => {
      if (!u) return false;

      // Solo activos (si viene el campo)
      const status = String(u.register_status ?? u.estado_registro ?? u.status ?? u.estado ?? "").toLowerCase();
      if (status && status !== "activo" && status !== "activa") return false;

      // Identificación estricta de paciente (SIN fallback)
      if (u.is_paciente === true) return true;
      if (String(u.tipo_usuario || "").toLowerCase() === "paciente") return true;
      if (String(u.rol || "").toLowerCase() === "paciente") return true;
      if (Array.isArray(u.roles) && u.roles.some((r) => String(r).toLowerCase().includes("paciente"))) return true;

      return false;
    });

    if (!q) return onlyPacientes;

    const hay = (v) => String(v || "").toLowerCase().includes(q);
    return onlyPacientes.filter((u) =>
      hay(u.nombre_completo) ||
      hay(u.nombre) ||
      hay(u.apellido) ||
      hay(u.email) ||
      hay(u.ci) ||
      hay(u.telefono)
    );
  }, [users, query]);

  return (
    <div className="min-h-screen bg-background-light">
      <HeaderAdmin
        session={session}
        onLogout={onLogout}
        activeTab={activeTab || "solicitudes"}
        onNavigate={onNavigate}
      />

      <main className="max-w-[1600px] mx-auto p-8">
        {!paciente ? (
          <div className="bg-white rounded-2xl shadow-soft border border-black/5 p-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">Nueva cita</h1>
              <p className="text-sm text-slate-500">Primero elige el paciente al que se le creará la cita.</p>
            </div>

            <div className="mt-6 grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-6">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Buscar paciente
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nombre, email, CI, teléfono..."
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white outline-none focus:ring-2 focus:ring-primary/25"
                />
                {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}
                {loading ? <div className="mt-3 text-sm text-slate-500">Cargando pacientes...</div> : null}
              </div>

              <div className="col-span-12">
                <div className="mt-4 overflow-hidden rounded-2xl border border-black/5">
                  <div className="max-h-[420px] overflow-auto">
                    {(pacientes || []).length === 0 ? (
                      <div className="p-6 text-sm text-slate-500">No se encontraron pacientes.</div>
                    ) : (
                      <ul className="divide-y divide-black/5">
                        {pacientes.map((u) => {
                          const rawId = u?.user_id ?? u?.id_usuario ?? u?.id_user ?? u?.id ?? null;
                          const id = rawId == null ? null : Number(rawId);

                          const title =
                            u?.nombre_completo ||
                            [u?.nombre, u?.apellido].filter(Boolean).join(" ") ||
                            u?.email ||
                            "Paciente";

                          const sub = [u?.email, u?.ci, u?.telefono].filter(Boolean).join(" · ");

                          return (
                            <li key={String(id || title)} className="p-4 hover:bg-black/[0.02]">
                              <button
                                type="button"
                                disabled={!Number.isInteger(id)}
                                onClick={() => Number.isInteger(id) && setPaciente({ id, raw: u })}
                                className={`w-full text-left flex items-start justify-between gap-4 ${!Number.isInteger(id) ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                              >
                                <div>
                                  <div className="font-bold text-slate-900">{title}</div>
                                  {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                                  Seleccionar
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-soft border border-black/5 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Paciente</div>
                <div className="font-black text-slate-900">
                  {paciente?.raw?.nombre_completo || paciente?.raw?.email || `ID ${paciente?.id}`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaciente(null)}
                className="px-4 py-2 rounded-xl border border-black/10 text-xs font-bold uppercase tracking-widest text-slate-600 hover:bg-black/[0.03]"
              >
                Cambiar paciente
              </button>
            </div>

            <BookingPage overridePacienteId={paciente?.id} returnTo={adminReturnTo} />
          </div>
        )}
      </main>
    </div>
  );
}
