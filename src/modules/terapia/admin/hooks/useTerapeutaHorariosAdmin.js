import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { TERAPIA_ENDPOINTS } from "../../../../config/TERAPIA_ENDPOINTS";

function resolveUserType(session) {
    if (!session) return { type: null, reason: "NO_SESSION" };

    const isTerapeuta = Boolean(session?.is_terapeuta);
    const isAdminLike = Boolean(
        session?.is_admin || session?.is_super_admin || session?.is_accounter
    );

    if (isTerapeuta) return { type: "terapeuta", reason: null };
    if (isAdminLike) return { type: "admin", reason: null };
    return { type: null, reason: "NO_ROLE" };
}

const DIA_LABEL = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo",
};

function toUiHorario(h) {
    const id = h?.id_horario_terapeuta ?? h?.id ?? h?.id_horario ?? null;
    const diaNum = Number(h?.dia_semana ?? h?.dia ?? 0);
    const dia = DIA_LABEL[diaNum] || String(h?.dia || "—");
    const hi = String(h?.hora_inicio || "").slice(0, 5);
    const hf = String(h?.hora_fin || "").slice(0, 5);
    const rango = hi && hf ? `${hi} - ${hf}` : String(h?.rango || "—");
    return {
        id,
        dia,
        rango,
        raw: h,
    };
}

function assertDbOk(resp) {
    if (resp?.ok === false) {
        throw new Error(resp?.message || "Operación fallida");
    }
    const r0 = Array.isArray(resp?.rows) ? resp.rows[0] : null;
    if (r0?.status && String(r0.status).toLowerCase() !== "ok") {
        throw new Error(r0?.message || "Operación fallida");
    }
    return resp;
}

export function useTerapeutaHorariosAdmin(session) {
    const { type: userType } = useMemo(() => resolveUserType(session), [session]);

    const targetTerapeutaId = useMemo(() => {
        if (!session) return null;
        if (userType === "admin") return session?.id_terapeuta || null;
        if (userType === "terapeuta") return session?.user_id || null;
        return null;
    }, [session, userType]);

    const [horarios, setHorarios] = useState([]);
    const [loadingHorarios, setLoadingHorarios] = useState(false);
    const [creatingHorario, setCreatingHorario] = useState(false);
    const [errorHorarios, setErrorHorarios] = useState(null);

    const refreshHorarios = useCallback(async () => {
        if (!session?.user_id || !session?.id_sesion) return;
        if (!targetTerapeutaId) return;

        setLoadingHorarios(true);
        setErrorHorarios(null);
        try {
            const payload = {
                p_actor_user_id: session.user_id,
                p_id_sesion: session.id_sesion,
                p_id_usuario_terapeuta: targetTerapeutaId,
            };

            const resp = await createApiConn(
                TERAPIA_ENDPOINTS.HORARIOS_OBTENER,
                payload,
                "POST",
                session
            );

            // Soportar múltiples formas de respuesta
            const rows = Array.isArray(resp?.rows) ? resp.rows : [];
            // Si backend devuelve {rows:[{status:'ok', data:{horarios:[...]}}]}
            const r0 = rows[0];
            const list =
                Array.isArray(r0?.data?.horarios) ? r0.data.horarios :
                    Array.isArray(r0?.horarios) ? r0.horarios :
                        Array.isArray(rows) && rows.length && rows[0]?.id_horario_terapeuta ? rows :
                            [];

            setHorarios((list || []).map(toUiHorario).filter((h) => h.id !== null));
        } catch (e) {
            console.error("[useTerapeutaHorariosAdmin.refreshHorarios]", e);
            setErrorHorarios(e?.message || "No se pudo cargar horarios");
        } finally {
            setLoadingHorarios(false);
        }
    }, [session, targetTerapeutaId]);

    const createHorarioFromModal = useCallback(
        async (form) => {
            if (!session?.user_id || !session?.id_sesion) {
                throw new Error("Sesión inválida.");
            }
            if (!targetTerapeutaId) {
                throw new Error("No se pudo resolver el terapeuta objetivo.");
            }

            setCreatingHorario(true);
            setErrorHorarios(null);
            try {
                const payload = {
                    p_actor_user_id: session.user_id,
                    p_id_sesion: session.id_sesion,
                    p_id_usuario_terapeuta: targetTerapeutaId,
                    p_dia_semana: form.p_dia_semana,
                    p_hora_inicio: form.p_hora_inicio,
                    p_hora_fin: form.p_hora_fin,
                    p_tipo_atencion: form.p_tipo_atencion,
                    p_canal: form.p_canal,
                    p_ubicacion: form.p_ubicacion,
                    p_metadata: form.p_metadata,
                };

                const resp = await createApiConn(
                    TERAPIA_ENDPOINTS.HORARIOS_CREAR,
                    payload,
                    "POST",
                    session
                );

                assertDbOk(resp);
                await refreshHorarios();
                return resp;
            } finally {
                setCreatingHorario(false);
            }
        },
        [session, targetTerapeutaId, refreshHorarios]
    );

    const apagarHorario = useCallback(
        async (horario) => {
            if (!session?.user_id || !session?.id_sesion) {
                throw new Error("Sesión inválida.");
            }
            const idHorario = horario?.raw?.id_horario_terapeuta ?? horario?.id;
            if (!idHorario) throw new Error("Horario inválido.");

            setErrorHorarios(null);
            const payload = {
                p_actor_user_id: session.user_id,
                p_id_sesion: session.id_sesion,
                p_id_horario_terapeuta: Number(idHorario),
            };

            const resp = await createApiConn(
                TERAPIA_ENDPOINTS.HORARIOS_APAGAR,
                payload,
                "POST",
                session
            );
            assertDbOk(resp);
            await refreshHorarios();
            return resp;
        },
        [session, refreshHorarios]
    );

    useEffect(() => {
        refreshHorarios();
    }, [refreshHorarios]);

    return {
        userType,
        targetTerapeutaId,
        horarios,
        loadingHorarios,
        creatingHorario,
        errorHorarios,
        refreshHorarios,
        createHorarioFromModal,
        apagarHorario,
    };
}
