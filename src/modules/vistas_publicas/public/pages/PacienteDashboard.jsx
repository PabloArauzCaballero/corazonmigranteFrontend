import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../../../app/auth/SessionContext";
import { useBooking } from "../hooks/useBooking";
import { useSolicitudesCitaPaciente } from "../hooks/useSolicitudesCitaPaciente";

import { createApiConn } from "../../../../helpers/api_conn_factory";
import { TERAPIA_ENDPOINTS } from "../../../../config/TERAPIA_ENDPOINTS";
import { UI_ENDPOINTS } from "../../../../config/UI_ENDPOINTS";

import ConfirmActionModal from "../../../../app/components/modals/ConfirmActionModal";
import ActionResultModal from "../../../../app/components/modals/ActionResultModal";

/**
 * Dashboard del paciente autenticado
 * - Lista de solicitudes/citas (tabla)
 * - Acceso rápido a agendar nueva cita
 * - Botón para cancelar cita/solicitud
 * - Botón "Mostrar QR" que pinta el QR en la página
 * - Logo dinámico en header (span heart -> UI_ELEMENTO_OBTENER)
 * - Reprogramar cita (modal + WhatsApp)
 * - NUEVO: Botón "Contactar con nosotros" (WhatsApp)
 *
 * FIX:
 * - Si VITE_WHATSAPP_NUMBER no llega al build, usamos fallback hardcodeado.
 * - iPhone: usa deep-link whatsapp:// y cae a web si falla.
 */
export default function PacienteDashboard() {
    const navigate = useNavigate();
    const { session, logout } = useSession();

    const { loading: loadingBootstrap, error: errorBootstrap, getBookingBootstrap } = useBooking();

    // Tabla de solicitudes/citas
    const [pageSize, setPageSize] = useState(10);
    const [offset, setOffset] = useState(0);

    // Filtro de estado
    const [estadoFilter, setEstadoFilter] = useState("TODOS");

    // Cancelación
    const [cancelingId, setCancelingId] = useState(null);

    // Modals
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmRow, setConfirmRow] = useState(null);

    const [resultOpen, setResultOpen] = useState(false);
    const [resultKind, setResultKind] = useState("success");
    const [resultTitle, setResultTitle] = useState("");
    const [resultMessage, setResultMessage] = useState("");

    const showResult = (kind, message, title = "") => {
        setResultKind(kind || "info");
        setResultTitle(title || "");
        setResultMessage(message || "");
        setResultOpen(true);
    };

    const safeStr = (v) => (v === undefined || v === null ? "" : String(v));

    // =========================
    // WhatsApp (general) - FIX iPhone + FALLBACK si env no llega
    // =========================
    const whatsappNumber = useMemo(() => {
        const raw = safeStr(import.meta.env.VITE_WHATSAPP_NUMBER || "");
        const cleaned = raw.replace(/[^\d]/g, "");
        // Fallback DEFINITIVO (tu número)
        return cleaned || "59177026706";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openWhatsApp = (message) => {
        const phone = whatsappNumber;

        if (!phone) {
            showResult("error", "No se pudo resolver el número de WhatsApp.", "WhatsApp");
            return;
        }

        const text = encodeURIComponent(message || "");
        const ua = navigator.userAgent || "";
        const isIOS = /iPad|iPhone|iPod/.test(ua);

        // URLs
        const deepLink = `whatsapp://send?phone=${phone}&text=${text}`; // App
        const webPrimary = `https://api.whatsapp.com/send?phone=${phone}&text=${text}`; // Mobile web
        const webFallback = `https://wa.me/${phone}?text=${text}`; // Fallback

        // iOS: intenta abrir app; si no, cae a web (misma pestaña)
        if (isIOS) {
            let opened = false;

            const onVis = () => {
                if (document.visibilityState === "hidden") opened = true;
            };

            document.addEventListener("visibilitychange", onVis, { once: true });

            window.location.href = deepLink;

            setTimeout(() => {
                if (opened) return;
                window.location.href = webPrimary;

                setTimeout(() => {
                    if (!opened) window.location.href = webFallback;
                }, 700);
            }, 900);

            return;
        }

        // Desktop/Android browsers: intenta popup; si bloqueado, navega
        const win = window.open(webPrimary, "_blank");
        if (!win) window.location.href = webFallback;
    };

    const handleContactar = () => {
        openWhatsApp("Hola necesito ayuda para usar el portal");
    };

    // =========================
    // QR (Mostrar QR en página)
    // =========================
    const QR_ELEMENT_ID = Number(import.meta.env.VITE_QR_ELEMENT_UI_ID || 16);
    const [qrOpen, setQrOpen] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrUrl, setQrUrl] = useState("");
    const [qrErr, setQrErr] = useState("");

    const loadQrIfNeeded = async () => {
        if (qrLoading) return;
        if (qrUrl) return;
        if (!session?.user_id || !session?.id_sesion) return;

        setQrLoading(true);
        setQrErr("");
        try {
            const payload = {
                p_actor_user_id: session.user_id,
                p_id_sesion: session.id_sesion,
                p_id_elemento: QR_ELEMENT_ID,
            };

            const res = await createApiConn(UI_ENDPOINTS.UI_ELEMENTO_OBTENER, payload, "POST", session);

            const row = res?.rows?.[0] || {};
            const url = safeStr(row?.link || row?.metadata?.url || "");
            if (!url) throw new Error("No se encontró el QR.");
            setQrUrl(url);
        } catch (e) {
            setQrErr(e?.message || "No se pudo cargar el QR.");
        } finally {
            setQrLoading(false);
        }
    };

    const handleToggleQr = async () => {
        const next = !qrOpen;
        setQrOpen(next);
        if (next) await loadQrIfNeeded();
    };

    // =========================
    // Logo dinámico (span heart -> UI_ELEMENTO_OBTENER)
    // =========================
    const LANDING_PAGE_ID = Number(import.meta.env.VITE_ID_UI_LANDING_PAGE || 1);
    const LOGO_ELEMENT_ID = 1;
    const [logoUrl, setLogoUrl] = useState("");

    useEffect(() => {
        const run = async () => {
            if (!session?.user_id || !session?.id_sesion) return;
            if (logoUrl) return;

            try {
                const payload = {
                    p_actor_user_id: session.user_id,
                    p_id_sesion: session.id_sesion,
                    p_id_elemento: LOGO_ELEMENT_ID,
                    // p_id_pagina: LANDING_PAGE_ID,
                };

                const res = await createApiConn(UI_ENDPOINTS.UI_ELEMENTO_OBTENER, payload, "POST", session);

                const row = res?.rows?.[0] || {};
                const url = safeStr(row?.link || row?.metadata?.url || "");
                if (url) setLogoUrl(url);
            } catch (e) {
                // fallback silencioso
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user_id, session?.id_sesion]);

    // =========================
    // Reprogramar (modal + WhatsApp)
    // =========================
    const [reprogOpen, setReprogOpen] = useState(false);
    const [reprogRow, setReprogRow] = useState(null);
    const [reprogDate, setReprogDate] = useState("");
    const [reprogStart, setReprogStart] = useState("");
    const [reprogEnd, setReprogEnd] = useState("");

    const parseISODate = (iso) => {
        const s = (iso ?? "").toString();
        const ymd = s.slice(0, 10);
        return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : "";
    };

    const parseISOTime = (iso) => {
        const s = (iso ?? "").toString();
        const hhmm = s.slice(11, 16);
        return /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : "";
    };

    const openReprogramar = (row) => {
        if (!row?.id_cita) return;

        setReprogRow(row);
        setReprogDate(parseISODate(row?.inicio || row?.fecha_programada));
        setReprogStart(parseISOTime(row?.inicio));
        setReprogEnd(parseISOTime(row?.fin));
        setReprogOpen(true);
    };

    const closeReprogramar = () => {
        setReprogOpen(false);
        setReprogRow(null);
        setReprogDate("");
        setReprogStart("");
        setReprogEnd("");
    };

    const sendReprogramarWhatsApp = () => {
        const row = reprogRow;
        if (!row?.id_cita) return;

        const uId = session?.user_id ? Number(session.user_id) : null;
        const citaId = Number(row.id_cita);

        const fechaTxt = reprogDate ? reprogDate : "(sin fecha)";
        const iniTxt = reprogStart ? reprogStart : "(sin hora inicio)";
        const finTxt = reprogEnd ? reprogEnd : "(sin hora fin)";

        const msg =
            `Quiero solicitar cambiar el horario de mi cita con el id ${citaId} ` +
            `y el id del usuario ${uId || "N/A"}. ` +
            `Nueva fecha tentativa: ${fechaTxt}. Inicio: ${iniTxt}. Fin: ${finTxt}.`;

        openWhatsApp(msg);

        closeReprogramar();
        showResult("success", "Solicitud enviada correctamente. Te responderemos en breve.", "Listo");
    };

    // =========================
    // Data (solicitudes)
    // =========================
    const {
        rows: solicitudes,
        isLoading: loadingSolicitudes,
        error: errorSolicitudes,
        fetchSolicitudes,
    } = useSolicitudesCitaPaciente({ autoFetch: false, limit: pageSize, offset });

    useEffect(() => {
        getBookingBootstrap(false).catch(() => { });
    }, [getBookingBootstrap]);

    useEffect(() => {
        if (!session?.user_id || !session?.id_sesion) return;

        fetchSolicitudes({
            p_limit: pageSize,
            p_offset: offset,
            p_id_usuario_paciente: session.user_id,
        }).catch(() => { });
    }, [session?.user_id, session?.id_sesion, pageSize, offset, fetchSolicitudes]);

    const handleLogout = () => {
        logout();
        navigate("/paciente/login");
    };

    const canPrev = offset > 0;
    const canNext = (solicitudes?.length || 0) >= pageSize;

    const fmtFecha = (iso) => {
        const s = (iso ?? "").toString();
        const ymd = s.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "-";
        const [y, m, d] = ymd.split("-");
        return `${d}/${m}/${y}`;
    };

    const fmtHora = (iso) => {
        const s = (iso ?? "").toString();
        const hhmm = s.slice(11, 16);
        return /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : "-";
    };

    const normalizeEstado = (v) =>
        (v ?? "")
            .toString()
            .trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") || "PENDIENTE";

    const isPagadoRow = (r) => Boolean(r?.pagado || r?.is_pagado || r?.raw?.pagado || r?.raw?.is_pagado);

    const estadoBadge = (estado) => {
        const e = normalizeEstado(estado);
        if (e === "CONFIRMADA") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
        if (e === "PAGADO") return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
        if (e === "REALIZADA") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
        if (e === "CANCELADA") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
        if (e === "REPROGRAMADA") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
        return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200";
    };

    // Reglas EXACTAS de acciones
    const getAcciones = (row) => {
        const e = normalizeEstado(row?.estado);
        const pagado = isPagadoRow(row);

        if (e === "CANCELADA" || e === "REALIZADA") return { show: false, canCancelar: false, canReprogramar: false };
        if (e === "PENDIENTE") return { show: true, canCancelar: true, canReprogramar: true };
        if (e === "CONFIRMADA") {
            if (pagado) return { show: true, canCancelar: false, canReprogramar: true };
            return { show: true, canCancelar: true, canReprogramar: true };
        }
        if (e === "REPROGRAMADA") {
            if (pagado) return { show: true, canCancelar: false, canReprogramar: true };
            return { show: true, canCancelar: true, canReprogramar: true };
        }
        return { show: false, canCancelar: false, canReprogramar: false };
    };

    const cancelarCita = (row) => {
        if (!row?.id_cita) return;
        if (!session?.user_id || !session?.id_sesion) return;
        setConfirmRow(row);
        setConfirmOpen(true);
    };

    const cancelarCitaConfirmada = async () => {
        const row = confirmRow;
        if (!row?.id_cita) {
            setConfirmOpen(false);
            setConfirmRow(null);
            return;
        }

        try {
            setCancelingId(row.id_cita);

            const payload = {
                p_actor_user_id: session.user_id,
                p_id_sesion: session.id_sesion,
                p_id_cita: row.id_cita,
                p_nuevo_estado: "CANCELADA",
                p_motivo: "Cancelada por el paciente",
            };

            const res = await createApiConn(TERAPIA_ENDPOINTS.CITAS_ESTADO_ACTUALIZAR, payload, "POST", session);

            await fetchSolicitudes({
                p_limit: pageSize,
                p_offset: offset,
                p_id_usuario_paciente: session.user_id,
            });

            showResult("success", res?.message || "Cita/solicitud cancelada.", "Listo");
        } catch (err) {
            showResult("error", err?.message || "No se pudo cancelar la cita/solicitud.", "Ocurrió un problema");
        } finally {
            setCancelingId(null);
            setConfirmOpen(false);
            setConfirmRow(null);
        }
    };

    const solicitudesOrdenadasFiltradas = useMemo(() => {
        const list = Array.isArray(solicitudes) ? [...solicitudes] : [];

        list.sort((a, b) => {
            const ta = new Date(a?.inicio || a?.created_at || a?.fecha_programada || 0).getTime() || 0;
            const tb = new Date(b?.inicio || b?.created_at || b?.fecha_programada || 0).getTime() || 0;
            return tb - ta;
        });

        const f = normalizeEstado(estadoFilter);
        if (f !== "TODOS") {
            if (f === "PAGADO") return list.filter((r) => isPagadoRow(r));
            return list.filter((r) => normalizeEstado(r?.estado) === f);
        }
        return list;
    }, [solicitudes, estadoFilter]);

    const totalCitas = useMemo(() => {
        return Array.isArray(solicitudesOrdenadasFiltradas) ? solicitudesOrdenadasFiltradas.length : 0;
    }, [solicitudesOrdenadasFiltradas]);

    const error = errorSolicitudes || errorBootstrap;

    return (
        <>
            <ConfirmActionModal
                open={confirmOpen}
                title="Cancelar solicitud/cita"
                message="¿Seguro que deseas cancelar esta solicitud/cita?"
                confirmText="Sí, cancelar"
                cancelText="No"
                loading={!!cancelingId}
                onClose={() => {
                    if (cancelingId) return;
                    setConfirmOpen(false);
                    setConfirmRow(null);
                }}
                onConfirm={cancelarCitaConfirmada}
            />

            <ActionResultModal
                open={resultOpen}
                kind={resultKind}
                title={resultTitle}
                message={resultMessage}
                onClose={() => setResultOpen(false)}
            />

            {/* Modal Reprogramar */}
            {reprogOpen ? (
                <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50" onClick={closeReprogramar} aria-hidden="true" />
                    <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-950 border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Reprogramar cita</h3>
                            <button
                                type="button"
                                onClick={closeReprogramar}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                                aria-label="Cerrar"
                            >
                                <span className="material-symbols-outlined text-slate-500">close</span>
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <div className="text-slate-600 dark:text-slate-300 mb-4">
                                Cita:{" "}
                                <strong>{safeStr(reprogRow?.paciente_nombre_completo || reprogRow?.paciente_nombre || "Paciente")}</strong>{" "}
                                (ID {safeStr(reprogRow?.id_cita)})
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-3">
                                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">FECHA</div>
                                    <input
                                        type="date"
                                        value={reprogDate}
                                        onChange={(e) => setReprogDate(e.target.value)}
                                        className="w-full rounded-2xl px-4 py-3 border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">INICIO</div>
                                    <input
                                        type="time"
                                        value={reprogStart}
                                        onChange={(e) => setReprogStart(e.target.value)}
                                        className="w-full rounded-2xl px-4 py-3 border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">FIN</div>
                                    <input
                                        type="time"
                                        value={reprogEnd}
                                        onChange={(e) => setReprogEnd(e.target.value)}
                                        className="w-full rounded-2xl px-4 py-3 border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-800 dark:text-white"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReprogDate("");
                                            setReprogStart("");
                                            setReprogEnd("");
                                        }}
                                        className="w-full rounded-2xl px-4 py-3 border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 font-semibold"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeReprogramar}
                                    className="px-6 py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 font-semibold"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={sendReprogramarWhatsApp}
                                    className="px-6 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 shadow-lg"
                                >
                                    Guardar cambios
                                </button>
                            </div>

                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                Esto abrirá WhatsApp para solicitar el cambio de horario (no actualiza la cita automáticamente).
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-950 dark:to-black font-display">
                {/* Header */}
                <header className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-black/50 border-b border-black/5 dark:border-white/10">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-3">
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Corazón de Migrante" className="w-8 h-8 object-contain" draggable={false} />
                                ) : (
                                    <span className="material-symbols-outlined text-primary text-2xl">favorite</span>
                                )}

                                <span className="font-bold text-lg text-slate-800 dark:text-white">Corazón de Migrante</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    Hola,{" "}
                                    <strong>
                                        {session?.user_id
                                            ? `${session.nombre} ${session.apellido} (ID: ${session.user_id})`
                                            : "Paciente"}
                                    </strong>
                                </span>

                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                    Salir
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main */}
                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome */}
                    <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 p-8 mb-8 border border-primary/10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-2">
                                    ¡Bienvenido a tu espacio!
                                </h1>
                                <p className="text-slate-600 dark:text-slate-300 max-w-xl">
                                    Aquí podrás ver tus citas y cancelar cuando lo necesites.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/paciente/booking"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span className="material-symbols-outlined">calendar_add_on</span>
                                    Agendar Cita
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleToggleQr}
                                    disabled={!session?.user_id || !session?.id_sesion}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/80 hover:bg-white text-primary font-semibold shadow-lg border border-primary/15 transition-all hover:scale-[1.02] active:scale-[0.98]
                  dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                                    title="Mostrar QR"
                                >
                                    <span className="material-symbols-outlined">qr_code_2</span>
                                    {qrOpen ? "Ocultar QR" : "Mostrar QR"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleContactar}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold shadow-md hover:bg-green-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                    title="Contactar por WhatsApp"
                                >
                                    <span className="material-symbols-outlined">support_agent</span>
                                    Contactar con nosotros
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* QR */}
                    {qrOpen ? (
                        <div className="mb-8 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">QR</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Escanea este código desde tu celular.</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleToggleQr}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                    Cerrar
                                </button>
                            </div>

                            <div className="p-6">
                                {qrLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : qrErr ? (
                                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                                        {qrErr}
                                    </div>
                                ) : qrUrl ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-[260px] max-w-full rounded-2xl bg-white p-4 shadow-sm border border-black/5 dark:bg-white dark:border-black/10">
                                            <img src={qrUrl} alt="QR" className="w-full h-auto object-contain" loading="eager" draggable={false} />
                                        </div>

                                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center max-w-md">
                                            Si no puedes escanearlo, abre el enlace desde tu teléfono.
                                        </p>

                                        <a href={qrUrl} rel="noreferrer" className="mt-2 text-xs text-primary hover:underline">
                                            Abrir QR
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-slate-500 dark:text-slate-400">No hay QR disponible.</div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* Próximas Citas */}
                    <div className="rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-4">
                            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Próximas Citas</h2>

                            <div className="flex items-center gap-2">
                                <select
                                    value={estadoFilter}
                                    onChange={(e) => {
                                        setOffset(0);
                                        setEstadoFilter(e.target.value);
                                    }}
                                    className="text-sm rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-700 dark:text-slate-200 px-2 py-1.5"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="CONFIRMADA">Confirmada</option>
                                    <option value="PAGADO">Pagado</option>
                                    <option value="REALIZADA">Realizada</option>
                                    <option value="CANCELADA">Cancelada</option>
                                    <option value="REPROGRAMADA">Reprogramada</option>
                                </select>

                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        const n = parseInt(e.target.value, 10);
                                        setOffset(0);
                                        setPageSize(Number.isFinite(n) ? n : 10);
                                    }}
                                    className="text-sm rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-700 dark:text-slate-200 px-2 py-1.5"
                                >
                                    {[5, 10, 20, 50].map((n) => (
                                        <option key={n} value={n}>
                                            {n}/pág
                                        </option>
                                    ))}
                                </select>

                                <button
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50"
                                    onClick={() => setOffset((v) => Math.max(0, v - pageSize))}
                                    disabled={!canPrev || loadingSolicitudes}
                                    title="Anterior"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    Ant.
                                </button>

                                <button
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-black/10 dark:border-white/10 bg-white dark:bg-black/20 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50"
                                    onClick={() => setOffset((v) => v + pageSize)}
                                    disabled={!canNext || loadingSolicitudes}
                                    title="Siguiente"
                                >
                                    Sig.
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {loadingSolicitudes || loadingBootstrap ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : totalCitas > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-slate-500 dark:text-slate-400">
                                                <th className="py-3 pr-4 font-semibold">Fecha</th>
                                                <th className="py-3 pr-4 font-semibold">Horario</th>
                                                <th className="py-3 pr-4 font-semibold">Estado</th>
                                                <th className="py-3 pr-4 font-semibold">Terapeuta</th>
                                                <th className="py-3 pr-4 font-semibold">Enfoque</th>
                                                <th className="py-3 pr-4 font-semibold">Producto</th>
                                                <th className="py-3 pr-2 font-semibold">Acción</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-black/5 dark:divide-white/10">
                                            {solicitudesOrdenadasFiltradas.map((r) => {
                                                const acciones = getAcciones(r);
                                                const pagado = isPagadoRow(r);

                                                return (
                                                    <tr key={r.id_cita} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors">
                                                        <td className="py-3 pr-4 whitespace-nowrap text-slate-800 dark:text-white">
                                                            {fmtFecha(r.fecha_programada)}
                                                        </td>

                                                        <td className="py-3 pr-4 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                                            {fmtHora(r.inicio)} - {fmtHora(r.fin)}
                                                        </td>

                                                        <td className="py-3 pr-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoBadge(r.estado)}`}>
                                                                    {normalizeEstado(r.estado)}
                                                                </span>

                                                                {pagado ? (
                                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-700 text-white">
                                                                        Pagado
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </td>

                                                        <td className="py-3 pr-4 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                                            {r.terapeuta_nombre_completo || "—"}
                                                        </td>

                                                        <td className="py-3 pr-4 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                                            {r.enfoque_nombre || "—"}
                                                        </td>

                                                        <td className="py-3 pr-4 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                                            {r.producto_nombre || "—"}
                                                        </td>

                                                        <td className="py-3 pr-2 whitespace-nowrap">
                                                            {acciones.show ? (
                                                                <div className="flex items-center gap-2">
                                                                    {acciones.canReprogramar ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openReprogramar(r)}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                      border border-slate-200 bg-white text-slate-700 hover:bg-slate-50
                                      dark:border-white/10 dark:bg-black/20 dark:text-slate-200 dark:hover:bg-white/10"
                                                                            title="Reprogramar cita"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                                                                            Reprogramar
                                                                        </button>
                                                                    ) : null}

                                                                    {acciones.canCancelar ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => cancelarCita(r)}
                                                                            disabled={cancelingId === r.id_cita}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                      border border-red-200 bg-red-50 text-red-700 hover:bg-red-100
                                      dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30
                                      disabled:opacity-60 disabled:cursor-not-allowed"
                                                                            title="Cancelar solicitud"
                                                                        >
                                                                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                                                                            {cancelingId === r.id_cita ? "Cancelando..." : "Cancelar"}
                                                                        </button>
                                                                    ) : null}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-slate-400 text-3xl">event_busy</span>
                                    </div>
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">No hay citas para mostrar</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Agenda una cita para comenzar.</p>
                                    <Link
                                        to="/paciente/booking"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Agendar Cita
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {error ? (
                        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                            {error}
                        </div>
                    ) : null}
                </main>

                <footer className="border-t border-black/5 dark:border-white/10 mt-12">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <p className="text-center text-xs text-slate-400 dark:text-slate-600">
                            © 2026 Corazón de Migrante. Todos los derechos reservados.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
