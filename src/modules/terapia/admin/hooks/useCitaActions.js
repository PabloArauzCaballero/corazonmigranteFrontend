import { useState } from "react";
import { actualizarEstadoCita, reprogramarCita } from "../services/services.api";
import { badgeByEstado } from "../utils/estado";
import { formatDate, formatTime } from "../utils/datetime";
import { ESTADOS } from "../constants/estados";

export function useCitaActions({ session, selected, setSolicitudes }) {
    // modals
    const [reprogOpen, setReprogOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pagadoOpen, setPagadoOpen] = useState(false);
    const [realizarOpen, setRealizarOpen] = useState(false);

    // notes
    const [notes, setNotes] = useState("");

    // reprogram
    const [reprogDate, setReprogDate] = useState("");
    const [reprogStart, setReprogStart] = useState("");
    const [reprogEnd, setReprogEnd] = useState("");
    const [reprogLoading, setReprogLoading] = useState(false);
    const [reprogError, setReprogError] = useState("");

    // reject
    const [rejectLoading, setRejectLoading] = useState(false);
    const [rejectError, setRejectError] = useState("");

    // confirm
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmError, setConfirmError] = useState("");

    // pagado
    const [pagadoLoading, setPagadoLoading] = useState(false);
    const [pagadoError, setPagadoError] = useState("");

    // realizar
    const [realizarLoading, setRealizarLoading] = useState(false);
    const [realizarError, setRealizarError] = useState("");

    // success modal
    const [successOpen, setSuccessOpen] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    function openReprogWithPrefill() {
        setReprogError("");
        setReprogOpen(true);

        const ini = selected?.raw?.inicio;
        const fin = selected?.raw?.fin;
        if (!ini || !fin) return;

        const dIni = new Date(ini);
        const dFin = new Date(fin);

        const yyyy = dIni.getUTCFullYear();
        const mm = String(dIni.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(dIni.getUTCDate()).padStart(2, "0");
        setReprogDate(`${yyyy}-${mm}-${dd}`);

        const hh1 = String(dIni.getUTCHours()).padStart(2, "0");
        const mi1 = String(dIni.getUTCMinutes()).padStart(2, "0");
        setReprogStart(`${hh1}:${mi1}`);

        const hh2 = String(dFin.getUTCHours()).padStart(2, "0");
        const mi2 = String(dFin.getUTCMinutes()).padStart(2, "0");
        setReprogEnd(`${hh2}:${mi2}`);
    }

    async function handleReprogramarSubmit() {
        if (!selected?.id) return;

        setReprogLoading(true);
        setReprogError("");

        try {
            const inicioISO = `${reprogDate}T${reprogStart}:00.000Z`;
            const finISO = `${reprogDate}T${reprogEnd}:00.000Z`;

            const payload = {
                p_actor_user_id: session?.user_id,
                p_id_sesion: session?.id_sesion,
                p_id_cita: Number(selected.id),
                p_patch: { inicio: inicioISO, fin: finISO },
                p_motivo: `${notes || ""} (Reprogramado desde portal administrativo)`,
            };

            const resp = await reprogramarCita(payload);
            const row = resp?.rows?.[0];

            if (resp?.ok !== true) throw new Error(resp?.message || "No se pudo reprogramar");
            if (row?.status && row.status !== "ok") throw new Error(row?.message || "No se pudo reprogramar");

            setSolicitudes((prev) =>
                prev.map((s) => {
                    if (s.id !== selected.id) return s;
                    return {
                        ...s,
                        fecha: formatDate(inicioISO),
                        hora: `${formatTime(inicioISO)} - ${formatTime(finISO)}`,
                        estado: ESTADOS.PENDIENTE,
                        estadoBadgeClass: badgeByEstado(ESTADOS.PENDIENTE),
                        raw: { ...(s.raw || {}), inicio: inicioISO, fin: finISO, estado: ESTADOS.PENDIENTE },
                    };
                })
            );

            setReprogOpen(false);
            setSuccessMsg(row?.message || "Cita reprogramada correctamente");
            setSuccessOpen(true);
        } catch (e) {
            setReprogError(e?.message || "Error reprogramando");
        } finally {
            setReprogLoading(false);
        }
    }

    async function handleRejectSubmit() {
        if (!selected?.id) return;

        setRejectLoading(true);
        setRejectError("");

        try {
            const motivo = (notes || "").trim();
            if (!motivo) throw new Error("Debes escribir un motivo para rechazar/cancelar.");

            const payload = {
                p_actor_user_id: session?.user_id,
                p_id_sesion: session?.id_sesion,
                p_id_cita: Number(selected.id),
                p_nuevo_estado: ESTADOS.CANCELADO,
                p_motivo: `${motivo} (Rechazado desde portal administrativo)`,
            };



            const resp = await actualizarEstadoCita(payload);
            const row = resp?.rows?.[0];

            if (resp?.ok !== true) throw new Error(resp?.message || "No se pudo rechazar");
            if (row?.status && row.status !== "ok") throw new Error(row?.message || "No se pudo rechazar");

            setSolicitudes((prev) =>
                prev.map((s) => {
                    if (s.id !== selected.id) return s;
                    return {
                        ...s,
                        estado: ESTADOS.CANCELADO,
                        estadoBadgeClass: badgeByEstado(ESTADOS.CANCELADO),
                        raw: { ...(s.raw || {}), estado: ESTADOS.CANCELADO, motivo_cancelacion: payload.p_motivo },
                    };
                })
            );

            setRejectOpen(false);
            setSuccessMsg(row?.message || "Solicitud rechazada correctamente");
            setSuccessOpen(true);
        } catch (e) {
            setRejectError(e?.message || "Error rechazando");
        } finally {
            setRejectLoading(false);
        }
    }

    async function handleConfirmSubmit() {
        if (!selected?.id) return;

        setConfirmLoading(true);
        setConfirmError("");

        try {
            const motivo = (notes || "").trim();

            const payload = {
                p_actor_user_id: session?.user_id,
                p_id_sesion: session?.id_sesion,
                p_id_cita: Number(selected.id),
                p_nuevo_estado: ESTADOS.CONFIRMADO,
                p_motivo: motivo
                    ? `${motivo} (Confirmado desde portal administrativo)`
                    : "Confirmado desde portal administrativo",
            };

            const resp = await actualizarEstadoCita(payload);
            const row = resp?.rows?.[0];

            if (resp?.ok !== true) throw new Error(resp?.message || "No se pudo confirmar");
            if (row?.status && row.status !== "ok") throw new Error(row?.message || "No se pudo confirmar");

            setSolicitudes((prev) =>
                prev.map((s) => {
                    if (s.id !== selected.id) return s;
                    return {
                        ...s,
                        estado: ESTADOS.CONFIRMADO,
                        estadoBadgeClass: badgeByEstado(ESTADOS.CONFIRMADO),
                        raw: { ...(s.raw || {}), estado: ESTADOS.CONFIRMADO },
                    };
                })
            );

            setConfirmOpen(false);
            setSuccessMsg(row?.message || "Cita confirmada correctamente");
            setSuccessOpen(true);
        } catch (e) {
            setConfirmError(e?.message || "Error confirmando");
        } finally {
            setConfirmLoading(false);
        }
    }

    async function handlePagadoSubmit() {
        if (!selected?.id) return;

        setPagadoLoading(true);
        setPagadoError("");

        try {
            const motivo = (notes || "").trim();

            const payload = {
                p_actor_user_id: session?.user_id,
                p_id_sesion: session?.id_sesion,
                p_id_cita: Number(selected.id),
                p_nuevo_estado: ESTADOS.PAGADO,
                p_motivo: motivo
                    ? `${motivo} (Marcado como pagado desde portal administrativo)`
                    : "Marcado como pagado desde portal administrativo",
            };

            const resp = await actualizarEstadoCita(payload);
            const row = resp?.rows?.[0];

            if (resp?.ok !== true) throw new Error(resp?.message || "No se pudo marcar como pagado");
            if (row?.status && row.status !== "ok") throw new Error(row?.message || "No se pudo marcar como pagado");

            // NOTA: "Pagado" NO reemplaza el estado de la cita.
            // Se marca un flag independiente (idealmente viene de DB como is_pagado/pagado).
            setSolicitudes((prev) =>
                prev.map((s) => {
                    if (s.id !== selected.id) return s;
                    return {
                        ...s,
                        pagado: true,
                        raw: { ...(s.raw || {}), is_pagado: true, pagado: true },
                    };
                })
            );

            setPagadoOpen(false);
            setSuccessMsg(row?.message || "Cita marcada como pagada");
            setSuccessOpen(true);
        } catch (e) {
            setPagadoError(e?.message || "Error marcando como pagado");
        } finally {
            setPagadoLoading(false);
        }
    }

    async function handleRealizarSubmit() {
        if (!selected?.id) return;

        setRealizarLoading(true);
        setRealizarError("");

        try {
            const motivo = (notes || "").trim();

            const payload = {
                p_actor_user_id: session?.user_id,
                p_id_sesion: session?.id_sesion,
                p_id_cita: Number(selected.id),
                p_nuevo_estado: ESTADOS.REALIZADO,
                p_motivo: motivo
                    ? `${motivo} (Marcado como realizado desde portal administrativo)`
                    : "Marcado como realizado desde portal administrativo",
            };

            const resp = await actualizarEstadoCita(payload);
            const row = resp?.rows?.[0];

            if (resp?.ok !== true) throw new Error(resp?.message || "No se pudo marcar como realizado");
            if (row?.status && row.status !== "ok") throw new Error(row?.message || "No se pudo marcar como realizado");

            setSolicitudes((prev) =>
                prev.map((s) => {
                    if (s.id !== selected.id) return s;
                    return {
                        ...s,
                        estado: ESTADOS.REALIZADO,
                        estadoBadgeClass: badgeByEstado(ESTADOS.REALIZADO),
                        raw: { ...(s.raw || {}), estado: ESTADOS.REALIZADO },
                    };
                })
            );

            setRealizarOpen(false);
            setSuccessMsg(row?.message || "Cita marcada como realizada");
            setSuccessOpen(true);
        } catch (e) {
            setRealizarError(e?.message || "Error marcando como realizado");
        } finally {
            setRealizarLoading(false);
        }
    }

    return {
        // notes
        notes,
        setNotes,

        // modals open/close
        reprogOpen, setReprogOpen,
        rejectOpen, setRejectOpen,
        confirmOpen, setConfirmOpen,
        pagadoOpen, setPagadoOpen,
        realizarOpen, setRealizarOpen,

        // reprogram state
        reprogDate, setReprogDate,
        reprogStart, setReprogStart,
        reprogEnd, setReprogEnd,
        reprogLoading, reprogError,
        openReprogWithPrefill,
        handleReprogramarSubmit,

        // reject state
        rejectLoading, rejectError,
        handleRejectSubmit,

        // confirm state
        confirmLoading, confirmError,
        handleConfirmSubmit,

        // pagado state
        pagadoLoading, pagadoError,
        handlePagadoSubmit,

        // realizar state
        realizarLoading, realizarError,
        handleRealizarSubmit,

        // success modal
        successOpen, setSuccessOpen,
        successMsg, setSuccessMsg,
    };
}
