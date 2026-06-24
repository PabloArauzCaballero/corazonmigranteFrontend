import React, { useMemo, useState } from "react";
import { chipByEstado, normalizeEstado } from "../utils/estado";

function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function ymdFromIso(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    // YYYY-MM-DD en hora local
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function monthLabel(d) {
    return d.toLocaleDateString("es-BO", { month: "long", year: "numeric" });
}

function weekdayLabels() {
    // Lun..Dom (ISO)
    return ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
}

function isoWeekdayIndex(jsDate) {
    // JS: 0=Dom..6=Sáb  -> ISO: 0=Lun..6=Dom
    const js = jsDate.getDay();
    return (js + 6) % 7;
}

export default function SolicitudesAgenda({ solicitudes = [], onSelect }) {
    // Helpers: evita "citas en blanco" cuando algunos campos vienen vacíos/espacios
    const safeStr = (v) => (v === null || v === undefined ? "" : String(v).trim());

    const resolveDisplayName = (s) => {
        const n1 = safeStr(s?.nombre);
        if (n1) return n1;
        const n2 = safeStr(s?.raw?.paciente_nombre_completo || s?.raw?.paciente_nombre || s?.raw?.nombre);
        if (n2) return n2;
        const id = safeStr(s?.id);
        return id ? `Cita #${id}` : "Cita";
    };

    const resolveDisplayTime = (s) => {
        // 1) Usa el campo UI si existe
        const h = safeStr(s?.hora);
        if (h && h !== "—" && h !== "— - —") return h;

        // 2) Intenta desde raw.inicio/raw.fin
        const ini = s?.raw?.inicio;
        const fin = s?.raw?.fin;
        if (ini) {
            try {
                const dIni = new Date(ini);
                const tIni = Number.isNaN(dIni.getTime()) ? null : dIni.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
                let tFin = null;
                if (fin) {
                    const dFin = new Date(fin);
                    tFin = Number.isNaN(dFin.getTime()) ? null : dFin.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
                }
                if (tIni && tFin) return `${tIni} - ${tFin}`;
                if (tIni) return tIni;
            } catch {
                // ignore
            }
        }

        // 3) Si el backend manda hora_inicio/hora_fin (strings tipo HH:mm o HH:mm:ss)
        const hIni = safeStr(s?.raw?.hora_inicio || s?.raw?.inicio_hora || s?.raw?.hora_ini);
        const hFin = safeStr(s?.raw?.hora_fin || s?.raw?.fin_hora || s?.raw?.hora_fin);
        const clean = (t) => (t ? t.slice(0, 5) : "");
        if (hIni && hFin) return `${clean(hIni)} - ${clean(hFin)}`;
        if (hIni) return clean(hIni);

        return "—";
    };
    const initialBase = useMemo(() => {
        const firstIso = solicitudes?.[0]?.raw?.fecha_programada || solicitudes?.[0]?.raw?.inicio || null;
        const d = firstIso ? new Date(firstIso) : new Date();
        return startOfMonth(Number.isNaN(d.getTime()) ? new Date() : d);
    }, [solicitudes]);

    const [baseMonth, setBaseMonth] = useState(initialBase);

    const citasByDay = useMemo(() => {
        const map = new Map();
        for (const s of solicitudes) {
            const iso = s?.raw?.fecha_programada || s?.raw?.inicio;
            const key = ymdFromIso(iso);
            if (!key) continue;
            const arr = map.get(key) || [];
            arr.push(s);
            map.set(key, arr);
        }

        // Ordena por hora inicio
        for (const [k, arr] of map.entries()) {
            arr.sort((a, b) => {
                const ai = new Date(a?.raw?.inicio || a?.raw?.fecha_programada || 0).getTime();
                const bi = new Date(b?.raw?.inicio || b?.raw?.fecha_programada || 0).getTime();
                return ai - bi;
            });
            map.set(k, arr);
        }
        return map;
    }, [solicitudes]);

    const days = useMemo(() => {
        const first = startOfMonth(baseMonth);
        const last = endOfMonth(baseMonth);

        const leading = isoWeekdayIndex(first); // 0..6
        const totalDays = last.getDate();

        const cells = [];

        // celdas vacías antes del día 1
        for (let i = 0; i < leading; i++) {
            cells.push({ type: "empty", key: `e-${i}` });
        }

        // días del mes
        for (let day = 1; day <= totalDays; day++) {
            const d = new Date(first.getFullYear(), first.getMonth(), day);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            cells.push({ type: "day", key, date: d, day });
        }

        // completa la grilla a semanas completas
        while (cells.length % 7 !== 0) {
            cells.push({ type: "empty", key: `t-${cells.length}` });
        }

        return cells;
    }, [baseMonth]);

    return (
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-display font-bold text-slate-900 capitalize">{monthLabel(baseMonth)}</h2>
                        <div className="flex gap-1">
                            <button
                                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setBaseMonth((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() - 1, 1)))}
                                title="Mes anterior"
                            >
                                <span className="material-symbols-outlined text-slate-400">chevron_left</span>
                            </button>
                            <button
                                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                                onClick={() => setBaseMonth((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() + 1, 1)))}
                                title="Mes siguiente"
                            >
                                <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Ver por:</span>
                        <select
                            className="text-xs font-bold bg-slate-50 border-slate-200 rounded-lg px-4 py-2 focus:ring-primary focus:border-primary"
                            disabled
                            value="Mes"
                            onChange={() => {}}
                            title="(Por ahora) fijo en Mes"
                        >
                            <option>Mes</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
                    {weekdayLabels().map((lbl, idx) => (
                        <div
                            key={lbl}
                            className={
                                idx === 5
                                    ? "py-3 text-center text-primary font-bold bg-primary/5 uppercase tracking-widest border-r border-slate-100"
                                    : idx === 6
                                        ? "py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                                        : "py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100"
                            }
                        >
                            {lbl}
                        </div>
                    ))}
                </div>

                <div className="calendar-grid flex-1 overflow-y-auto custom-scrollbar">
                    {days.map((cell) => {
                        if (cell.type === "empty") {
                            return <div key={cell.key} className="calendar-day bg-slate-50/30" />;
                        }

                        const key = cell.key;
                        const citas = citasByDay.get(key) || [];
                        const today = new Date();
                        const isToday =
                            cell.date.getFullYear() === today.getFullYear() &&
                            cell.date.getMonth() === today.getMonth() &&
                            cell.date.getDate() === today.getDate();

                        return (
                            <div
                                key={key}
                                className={
                                    isToday
                                        ? "calendar-day p-3 bg-brand-cream/40 ring-1 ring-inset ring-primary/10"
                                        : "calendar-day p-3"
                                }
                            >
                                <div className="flex justify-between items-center mb-2">
                                    {isToday ? (
                                        <span className="text-xs font-bold text-primary bg-primary/10 w-6 h-6 flex items-center justify-center rounded-full">
                                            {String(cell.day).padStart(2, "0")}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400">{String(cell.day).padStart(2, "0")}</span>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {citas.slice(0, 3).map((s) => {
                                        const displayName = resolveDisplayName(s);
                                        const displayHora = resolveDisplayTime(s);
                                        const displayHoraLeft = safeStr(displayHora).includes("-")
                                            ? safeStr(displayHora).split("-")[0].trim()
                                            : safeStr(displayHora);

                                        const estadoNorm = normalizeEstado(s?.estado || s?.raw?.estado);
                                        const chip = chipByEstado(estadoNorm);

                                        return (
                                            <button
                                                key={s.id}
                                                className={`w-full text-left px-3 py-2.5 rounded-xl ${chip.wrap} ${chip.deco} transition-all`}
                                                onClick={() => onSelect?.(s.id)}
                                                title={`${displayName} (${displayHora})`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className={`mt-1 h-2 w-2 rounded-full flex-none ${chip.dot}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-[10px] font-bold leading-none ${chip.time}`}>{displayHoraLeft}</p>
                                                        <p className={`text-[12px] font-bold truncate ${chip.text}`}>{displayName}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {citas.length > 3 && (
                                        <div className="text-[10px] font-bold text-slate-400">
                                            +{citas.length - 3} más
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
