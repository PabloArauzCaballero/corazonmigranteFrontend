import React, { useEffect, useMemo, useState } from "react";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

function toHms(v) {
  // 'HH:MM' -> 'HH:MM:00', 'HH:MM:SS' -> keep
  if (!v) return "";
  const s = String(v).trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return s;
}

export default function HorarioCreateModal({ open, onClose, onSubmit, isSaving = false, defaultTimeZone = null }) {
  const [dia, setDia] = useState(1);
  const [inicio, setInicio] = useState("09:00");
  const [fin, setFin] = useState("12:00");
  const [tipo, setTipo] = useState("INDIVIDUAL");
  const [canal, setCanal] = useState("ONLINE");
  const [ubicacion, setUbicacion] = useState("Google Meet");
  const [timeZone, setTimeZone] = useState(() => {
    if (defaultTimeZone && String(defaultTimeZone).trim()) return String(defaultTimeZone).trim();
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/La_Paz";
    } catch {
      return "America/La_Paz";
    }
  });

  const [nota, setNota] = useState("");
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLocalError(null);
    // ✅ Al abrir, respetar la TZ del terapeuta si viene desde el perfil
    if (defaultTimeZone && String(defaultTimeZone).trim()) {
      setTimeZone(String(defaultTimeZone).trim());
    }
  }, [open, defaultTimeZone]);

  const resumen = useMemo(() => {
    const label = DAYS.find((d) => d.value === Number(dia))?.label || "";
    return `${label} · ${inicio} - ${fin}`;
  }, [dia, inicio, fin]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_circle</span>
            Nuevo horario
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" disabled={isSaving}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-500">{resumen}</div>

          {localError ? (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {localError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Día
              </label>
              <select
                value={dia}
                onChange={(e) => setDia(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-[18px] py-3 px-4 text-slate-700 text-sm focus:ring-primary/20 focus:border-primary transition-all"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Tipo atención
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-[18px] py-3 px-4 text-slate-700 text-sm focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="INDIVIDUAL">INDIVIDUAL</option>
                <option value="GRUPAL">GRUPAL</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Hora inicio
              </label>
              <input
                type="time"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-[18px] py-3 px-4 text-slate-700 text-sm focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Hora fin
              </label>
              <input
                type="time"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-[18px] py-3 px-4 text-slate-700 text-sm focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Canal
              </label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-[18px] py-3 px-4 text-slate-700 text-sm focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="PRESENCIAL">PRESENCIAL</option>
                <option value="ONLINE/PRESENCIAL">ONLINE/PRESENCIAL</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Ubicación
              </label>
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Google Meet o enlace / dirección"
                className="w-full bg-white border border-slate-200 rounded-[18px] py-3 px-4 text-slate-700 text-sm placeholder:text-slate-300 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Zona horaria (IANA)
              </label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-[18px] py-3 px-4 text-slate-700 text-sm focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="America/La_Paz">America/La_Paz (Bolivia)</option>
                <option value="America/Lima">America/Lima (Perú)</option>
                <option value="America/Santiago">America/Santiago (Chile)</option>
                <option value="America/Bogota">America/Bogota (Colombia)</option>
                <option value="America/Mexico_City">America/Mexico_City (México)</option>
                <option value="America/New_York">America/New_York (USA Este)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (USA Pacífico)</option>
                <option value="Europe/Madrid">Europe/Madrid (España)</option>
                <option value="Europe/London">Europe/London (UK)</option>
                <option value="UTC">UTC</option>
              </select>
              <p className="mt-2 text-[11px] text-slate-500">
                Las horas que registres se interpretan en esta zona. (Luego se convierten a UTC para mostrar a pacientes en su hora local).
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Nota (opcional)
              </label>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: Horario laboral mañana"
                className="w-full bg-white border border-slate-200 rounded-[18px] p-4 text-slate-700 text-sm placeholder:text-slate-300 focus:ring-primary/20 focus:border-primary transition-all min-h-[90px]"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              setLocalError(null);
              if (!dia || !inicio || !fin || !tipo || !canal) {
                setLocalError("Completa los campos requeridos.");
                return;
              }
              const payload = {
                p_dia_semana: Number(dia),
                p_hora_inicio: toHms(inicio),
                p_hora_fin: toHms(fin),
                p_tipo_atencion: tipo,
                p_canal: canal,
                p_ubicacion: ubicacion || "",
                p_metadata: {
                  fuente: "ui",
                  time_zone: timeZone,
                  ...(nota ? { nota } : {}),
                },
              };
              onSubmit?.(payload);
            }}
            className="px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-60"
          >
            {isSaving ? "Creando..." : "Crear horario"}
          </button>
        </div>
      </div>
    </div>
  );
}
