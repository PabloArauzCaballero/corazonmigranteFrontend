import React from "react";
import { normalizeEstado } from "../utils/estado";

export default function SolicitudDetail({
    selected,
    guideStep,
    setGuideStep,
    notes,
    setNotes,
    onOpenReject,
    onOpenReprog,
    onOpenConfirm,
    onOpenPagado,
    onOpenRealizar,
    className = "col-span-12 lg:col-span-8",
    variant = "list", // "list" | "agenda"
}) {
    const estadoNorm = normalizeEstado(selected?.estado);

    // pagado es boolean (puede venir en distintas rutas)
    const isPagado = Boolean(
        selected?.raw?.is_pagado ??
        selected?.is_pagado ??
        selected?.pagado ??
        selected?.raw?.pagado
    );

    const isCancelado = estadoNorm === "CANCELADO";
    const isConfirmado = estadoNorm === "CONFIRMADO";
    const isPendiente = estadoNorm === "PENDIENTE";
    const isRealizado = estadoNorm === "REALIZADO";

    // Regla base: si está CANCELADO no puede ser nada
    const disableAll = isCancelado;

    /**
     * REGLAS (corregidas)
     * - CANCELADO: nada
     * - PENDIENTE: cancelar(rechazar), confirmar, reprogramar (NO pagado, NO realizar)
     * - CONFIRMADO: cancelar(rechazar), realizar, reprogramar, pagado
     * - REALIZADO: solo pagado
     * - Si is_pagado=true: SOLO inhabilita "Rechazar" (lo demás se rige por status)
     */

    // RECHAZAR (Cancelar)
    // permitido si no está cancelado, no está realizado, y es pendiente o confirmado
    // pero si está pagado: SIEMPRE se inhabilita
    const canReject = !disableAll && !isPagado && !isRealizado && (isPendiente || isConfirmado);
    const disableReject = !canReject;

    // REPROGRAMAR
    // permitido en pendiente o confirmado; en realizado NO; en cancelado NO
    // (si está pagado, no cambia nada aquí)
    const canReprogram = !disableAll && !isRealizado && (isPendiente || isConfirmado);
    const disableReprogram = !canReprogram;

    // CONFIRMAR
    // permitido solo si está pendiente (en realizado/cancelado no; en confirmado no)
    // (si está pagado, no cambia nada aquí)
    const canConfirm = !disableAll && isPendiente;
    const disableConfirm = !canConfirm;

    // PAGADO
    // permitido si está CONFIRMADO o REALIZADO, pero NO si ya está pagado, NO si cancelado
    // y OJO: en PENDIENTE NO se permite
    const canPagado = !disableAll && !isPagado && (isConfirmado || isRealizado);
    const disablePagado = !canPagado;

    // REALIZAR
    // permitido solo si está confirmado (no cancelado, no realizado)
    // (si está pagado, NO cambia nada aquí: sigue permitido si está confirmado)
    const canRealizar = !disableAll && isConfirmado && !isRealizado;
    const disableRealizar = !canRealizar;

    const isAgenda = variant === "agenda";

    return (
        <section
            className={`${className} bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden flex flex-col`}
        >
            <div className="px-5 py-5 sm:px-8 sm:py-8 border-b border-slate-100 flex items-start sm:items-center justify-between bg-white gap-4">
                <div className="flex items-center gap-6">
                    {selected?.avatar ? (
                        <img
                            alt={selected.nombre}
                            className="h-20 w-20 rounded-2xl object-cover shadow-xl ring-4 ring-brand-cream"
                            src={selected.avatar}
                        />
                    ) : (
                        <div className="h-20 w-20 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-2xl ring-4 ring-brand-cream">
                            {selected?.iniciales || "??"}
                        </div>
                    )}

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 truncate max-w-[18rem] sm:max-w-none">
                                {selected?.nombre}
                            </h2>

                            <span
                                className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${selected?.estadoBadgeClass || "bg-slate-100 text-slate-500"}`}
                            >
                                {selected?.estado || ""}
                            </span>

                            {isPagado ? (
                                <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest bg-violet-700 text-white">
                                    Pagado
                                </span>
                            ) : null}
                        </div>

                        {/* AGENDA vs LISTA (tu cambio principal) */}
                        {isAgenda ? (
                            <p className="text-sm text-slate-500 flex items-center gap-4 grid grid-cols-1">
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                                    ID: {selected?.id}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                                    Registrada: {selected?.registrada}
                                </span>
                            </p>
                        ) : (
                            <p className="text-sm text-slate-500 flex items-center gap-4">
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                                    ID: {selected?.id}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                                    Registrada: {selected?.registrada}
                                </span>
                            </p>
                        )}
                    </div>
                </div>


            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 lg:p-10">
                {/* AGENDA = 1 columna / LISTA = 2 columnas */}
                <div className={`grid grid-cols-1 ${isAgenda ? "lg:grid-cols-1" : "lg:grid-cols-2"} gap-x-12 gap-y-10`}>
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">
                                Información de Contacto
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-lg bg-brand-cream flex items-center justify-center text-primary border border-primary/10">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Correo</p>
                                        <p className="text-slate-900 font-semibold break-all sm:break-words leading-snug">
                                            {selected?.correo}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-lg bg-brand-cream flex items-center justify-center text-primary border border-primary/10">
                                        <span className="material-symbols-outlined text-[20px]">call</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Teléfono</p>
                                        <p className="text-slate-900 font-semibold break-words">{selected?.telefono}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">
                                Detalles de la Cita
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-brand-cream border border-primary/5">
                                    <span className="material-symbols-outlined text-primary mb-2">calendar_month</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha</p>
                                    <p className="text-sm font-bold text-slate-900">{selected?.fecha}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-brand-cream border border-primary/5">
                                    <span className="material-symbols-outlined text-primary mb-2">alarm</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Horario</p>
                                    <p className="text-sm font-bold text-slate-900">{selected?.hora}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-brand-cream border border-primary/5">
                                    <span className="material-symbols-outlined text-primary mb-2">diversity_3</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tipo</p>
                                    <p className="text-sm font-bold text-slate-900">{selected?.tipo}</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-brand-cream border border-primary/5">
                                    <span className="material-symbols-outlined text-primary mb-2">public</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Origen</p>
                                    <p className="text-sm font-bold text-slate-900">{selected?.origen}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">
                                Notas Internas
                            </h3>

                            <textarea
                                className="w-full bg-slate-50 border-slate-200 rounded-2xl text-sm p-5 focus:ring-primary focus:border-primary transition-all min-h-[160px] placeholder:italic shadow-inner resize-none"
                                placeholder="Describa el motivo de la reprogramación / cancelación"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-primary/5 p-6 transition-all hover:shadow-md">
                            <div className="mb-2 flex items-center justify-between">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-primary">
                                    <span className="material-symbols-outlined text-sm">info</span>
                                    Guía de uso ({guideStep + 1}/3)
                                </h4>

                                <div className="flex gap-1">
                                    {[0, 1, 2].map((step) => (
                                        <button
                                            key={step}
                                            onClick={() => setGuideStep(step)}
                                            className={`h-1.5 w-1.5 rounded-full transition-all ${guideStep === step ? "bg-primary w-3" : "bg-primary/20 hover:bg-primary/40"
                                                }`}
                                            aria-label={`Ir al paso ${step + 1}`}
                                            type="button"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="relative min-h-[100px]">
                                {guideStep === 0 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <p className="text-justify text-xs font-medium leading-relaxed text-slate-600">
                                            En la lista vertical se resumen las citas solicitadas. Al presionar{" "}
                                            <strong>Confirmar</strong>, se envía un correo notificando al usuario.
                                        </p>
                                    </div>
                                )}
                                {guideStep === 1 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <p className="text-justify text-xs font-medium leading-relaxed text-slate-600">
                                            Para reprogramar, usa <strong>Reprogramar</strong>. Selecciona nueva fecha/hora y guarda cambios.
                                        </p>
                                    </div>
                                )}
                                {guideStep === 2 && (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <p className="text-justify text-xs font-medium leading-relaxed text-slate-600">
                                            Para rechazar/cancelar, usa <strong>Rechazar</strong> e ingresa un motivo. Las notas internas
                                            quedan para el equipo.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-2 flex justify-end">
                                <button
                                    onClick={() => setGuideStep((p) => (p + 1) % 3)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/70 transition-colors flex items-center gap-1"
                                    type="button"
                                >
                                    Siguiente <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-5 sm:px-8 sm:py-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <button
                    type="button"
                    disabled={disableReject}
                    onClick={() => {
                        if (disableReject) return;
                        onOpenReject?.();
                    }}
                    className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all
            ${disableReject
                            ? "opacity-50 cursor-not-allowed text-slate-400 bg-transparent"
                            : "text-slate-500 hover:text-red-700 hover:bg-red-50"
                        }`}
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                    Rechazar
                </button>

                <div className="flex flex-wrap gap-3 sm:gap-4 justify-end">
                    <button
                        type="button"
                        disabled={disableReprogram}
                        onClick={() => {
                            if (disableReprogram) return;
                            onOpenReprog?.();
                        }}
                        className={`px-8 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all
              ${disableReprogram
                                ? "opacity-50 cursor-not-allowed bg-white border-slate-200 text-slate-400"
                                : "bg-white border-slate-300 text-brand-gray hover:border-primary hover:text-primary"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">event_repeat</span>
                        Reprogramar
                    </button>

                    <button
                        type="button"
                        disabled={disableConfirm}
                        onClick={() => {
                            if (disableConfirm) return;
                            onOpenConfirm?.();
                        }}
                        className={`px-12 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-xl
              ${disableConfirm
                                ? "opacity-50 cursor-not-allowed bg-slate-300 text-white shadow-none"
                                : "bg-primary text-white hover:bg-black shadow-primary/30"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                        Confirmar Cita
                    </button>

                    <button
                        type="button"
                        disabled={disablePagado}
                        onClick={() => {
                            if (disablePagado) return;
                            onOpenPagado?.();
                        }}
                        className={`px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-xl
              ${disablePagado
                                ? "opacity-50 cursor-not-allowed bg-slate-300 text-white shadow-none"
                                : "bg-violet-700 text-white hover:bg-violet-900 shadow-violet-700/20"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">paid</span>
                        Pagado
                    </button>

                    <button
                        type="button"
                        disabled={disableRealizar}
                        onClick={() => {
                            if (disableRealizar) return;
                            onOpenRealizar?.();
                        }}
                        className={`px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-xl
              ${disableRealizar
                                ? "opacity-50 cursor-not-allowed bg-slate-300 text-white shadow-none"
                                : "bg-sky-700 text-white hover:bg-sky-900 shadow-sky-700/20"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">done_all</span>
                        Realizar
                    </button>
                </div>
            </div>
        </section>
    );
}
