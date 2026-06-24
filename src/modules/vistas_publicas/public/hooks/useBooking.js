import { useCallback, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { TERAPIA_ENDPOINTS } from "../../../../config/TERAPIA_ENDPOINTS";
import { useSession } from "../../../../app/auth/SessionContext";

/**
 * Hook para gestión de reservas de citas terapéuticas
 */
export function useBooking({ overridePacienteId = null } = {}) {
    const { session } = useSession();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [bootstrapData, setBootstrapData] = useState(null);
    const [disponibilidad, setDisponibilidad] = useState([]);

    // Helper to get auth params from session
    const getAuthParams = useCallback(() => {
        if (!session?.user_id || !session?.id_sesion) {
            throw new Error("Usuario no autenticado");
        }
        return {
            p_actor_user_id: session.user_id,
            p_id_sesion: session.id_sesion,
        };
    }, [session]);

    // -------------------------
    // Helpers de fecha/hora
    // -------------------------
    const pad2 = useCallback((n) => String(n).padStart(2, "0"), []);

    /**
     * Construye un Date en HORA LOCAL a partir de:
     * - fechaStr: "YYYY-MM-DD"
     * - horaStr:  "HH:MM"
     */
    const buildLocalDate = useCallback((fechaStr, horaStr) => {
        const [y, m, d] = String(fechaStr).split("-").map((x) => parseInt(x, 10));
        const [hh, mm] = String(horaStr).split(":").map((x) => parseInt(x, 10));
        return new Date(y, m - 1, d, hh, mm, 0, 0); // local time
    }, []);

    /**
     * Formatea un Date a string timestamptz con offset local:
     * "YYYY-MM-DDTHH:mm:ss±HH:MM"
     *
     * Esto evita enviar "Z" (UTC) con toISOString(), que suele romper validaciones
     * si el backend trabaja en hora local para disponibilidad.
     */
    const formatLocalTimestamptz = useCallback(
        (d) => {
            const y = d.getFullYear();
            const m = pad2(d.getMonth() + 1);
            const day = pad2(d.getDate());
            const hh = pad2(d.getHours());
            const mm = pad2(d.getMinutes());
            const ss = pad2(d.getSeconds());

            // getTimezoneOffset(): minutos que se SUMAN a local para llegar a UTC
            // Bolivia suele ser 240 => offset "-04:00"
            const offMin = d.getTimezoneOffset();
            const sign = offMin <= 0 ? "+" : "-";
            const abs = Math.abs(offMin);
            const offHH = pad2(Math.floor(abs / 60));
            const offMM = pad2(abs % 60);

            return `${y}-${m}-${day}T${hh}:${mm}:${ss}${sign}${offHH}:${offMM}`;
        },
        [pad2]
    );

    /**
     * Obtiene datos iniciales para booking: enfoques, productos, terapeutas, horarios
     */
    const getBookingBootstrap = useCallback(
        async (incluirHorarios = true) => {
            setLoading(true);
            setError(null);
            try {
                const authParams = getAuthParams();

                const payload = {
                    args: {
                        ...authParams,
                        p_incluir_horarios: incluirHorarios,
                    },
                };

                const res = await createApiConn(
                    TERAPIA_ENDPOINTS.BOOKING_BOOTSTRAP,
                    payload,
                    "POST",
                    session
                );

                if (!res.ok) {
                    throw new Error(res.message || "Error obteniendo datos de booking");
                }

                const data = res.data || {};
                setBootstrapData(data);
                return data;
            } catch (err) {
                const msg = err?.message || "Error al cargar opciones de booking";
                setError(msg);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [getAuthParams, session]
    );

    /**
     * Obtiene disponibilidad de horarios de un terapeuta específico
     */
    const getDisponibilidad = useCallback(
        async (idTerapeuta) => {
            if (!idTerapeuta) {
                setDisponibilidad([]);
                return [];
            }

            setLoading(true);
            setError(null);
            try {
                const authParams = getAuthParams();

                const payload = {
                    args: {
                        ...authParams,
                        p_id_usuario_terapeuta: idTerapeuta,
                        p_id_usuario_paciente: (overridePacienteId != null ? overridePacienteId : authParams.p_actor_user_id),
                    },
                };

                const res = await createApiConn(
                    TERAPIA_ENDPOINTS.HORARIOS_OBTENER_DISPONIBILIDAD,
                    payload,
                    "POST",
                    session
                );

                // API returns rows directly
                // Each row: fecha, inicio, fin (ISO strings)
                const horarios = (res?.rows || []).map((h) => ({
                    ...h,
                    // Normalize fecha to YYYY-MM-DD
                    fecha: h.fecha ? h.fecha.split("T")[0] : null,
                    // Mostrar hora en local
                    hora_inicio: h.inicio
                        ? new Date(h.inicio).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        })
                        : null,
                    hora_fin: h.fin
                        ? new Date(h.fin).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                        })
                        : null,
                    disponible: true,
                }));

                setDisponibilidad(horarios);
                return horarios;
            } catch (err) {
                const msg = err?.message || "Error al obtener disponibilidad";
                setError(msg);
                setDisponibilidad([]);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [getAuthParams, session]
    );

    /**
     * Registra una nueva cita
     */
    const registrarCita = useCallback(
        async ({
            idTerapeuta,
            idProducto,
            idEnfoque,
            fecha,
            horaInicio,
            horaFin,
            inicioISO = "",
            finISO = "",
            notas = "",
        }) => {
            if (!idTerapeuta || !idProducto || !idEnfoque || (!inicioISO && (!fecha || !horaInicio || !horaFin)) || (inicioISO && !finISO)) {
                throw new Error("Faltan datos obligatorios para registrar la cita");
            }

            setLoading(true);
            setError(null);
            try {
                const authParams = getAuthParams();

                // Si el UI ya seleccionó un slot con instantes ISO (recomendado),
                // enviamos esos valores tal cual (timestamptz soporta "Z"/UTC).
                // Si no, caemos al modo legacy: construir fechas en hora local y enviar con offset local.
                const p_inicio = inicioISO ? String(inicioISO) : formatLocalTimestamptz(buildLocalDate(fecha, horaInicio));
                const p_fin = finISO ? String(finISO) : formatLocalTimestamptz(buildLocalDate(fecha, horaFin));

                const payload = {
                    args: {
                        ...authParams,
                        p_id_usuario_terapeuta: idTerapeuta,
                        p_id_usuario_paciente: (overridePacienteId != null ? overridePacienteId : authParams.p_actor_user_id),
                        p_id_producto: idProducto,
                        p_id_enfoque: idEnfoque,
                        p_fecha: fecha,
                        p_inicio,
                        p_fin,
                        // tu API usa p_notas_internas (mantengo compatibilidad si el back lo mappea)
                        p_notas_internas: notas,
                    },
                };

                const res = await createApiConn(
                    TERAPIA_ENDPOINTS.CITAS_REGISTRAR,
                    payload,
                    "POST",
                    session
                );

                const row = res?.rows?.[0];
                if (row?.status !== "ok") {
                    throw new Error(row?.message || "Error al registrar cita");
                }

                return row.data;
            } catch (err) {
                const msg = err?.message || "Error al registrar la cita";
                setError(msg);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [getAuthParams, session, buildLocalDate, formatLocalTimestamptz]
    );

    /**
     * Cancela (apaga) una cita existente
     */
    const cancelarCita = useCallback(
        async (idCita) => {
            if (!idCita) {
                throw new Error("ID de cita requerido");
            }

            setLoading(true);
            setError(null);
            try {
                const authParams = getAuthParams();

                const payload = {
                    args: {
                        ...authParams,
                        p_id_cita: idCita,
                    },
                };

                const res = await createApiConn(
                    TERAPIA_ENDPOINTS.CITAS_APAGAR,
                    payload,
                    "POST",
                    session
                );

                const row = res?.rows?.[0];
                if (row?.status !== "ok") {
                    throw new Error(row?.message || "Error al cancelar cita");
                }

                return true;
            } catch (err) {
                const msg = err?.message || "Error al cancelar la cita";
                setError(msg);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [getAuthParams, session]
    );

    /**
     * Actualiza el estado de una cita
     */
    const actualizarEstadoCita = useCallback(
        async (idCita, estado) => {
            if (!idCita || !estado) {
                throw new Error("ID de cita y estado requeridos");
            }

            setLoading(true);
            setError(null);
            try {
                const authParams = getAuthParams();

                const payload = {
                    args: {
                        ...authParams,
                        p_id_cita: idCita,
                        p_estado: estado,
                    },
                };

                const res = await createApiConn(
                    TERAPIA_ENDPOINTS.CITAS_ESTADO_ACTUALIZAR,
                    payload,
                    "POST",
                    session
                );

                const row = res?.rows?.[0];
                if (row?.status !== "ok") {
                    throw new Error(row?.message || "Error al actualizar estado");
                }

                return row.data;
            } catch (err) {
                const msg = err?.message || "Error al actualizar el estado de la cita";
                setError(msg);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [getAuthParams, session]
    );

    return {
        loading,
        error,
        bootstrapData,
        disponibilidad,

        getBookingBootstrap,
        getDisponibilidad,
        registrarCita,
        cancelarCita,
        actualizarEstadoCita,
    };
}
