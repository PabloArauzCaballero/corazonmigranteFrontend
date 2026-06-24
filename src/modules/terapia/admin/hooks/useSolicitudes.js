import { useEffect, useMemo, useState } from "react";
import { listarSolicitudes } from "../services/services.api";
import { mapSolicitudToUI } from "../mappers/solicitud.mapper";

export function useSolicitudes(session) {
    const [query, setQuery] = useState("");
    const [solicitudes, setSolicitudes] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let alive = true;

        const isSuperAdmin = Boolean(session?.is_super_admin);
        const isAdminLike = Boolean(
            session?.is_admin || session?.is_super_admin || session?.is_accounter
        );
        const isTerapeuta = Boolean(session?.is_terapeuta);

        // Regla de filtro:
        // - Si es super admin => NO enviar filtro (ver todo)
        // - Si NO es super admin => filtrar por terapeuta objetivo
        //   - Admin-like => usar session.id_terapeuta
        //   - Terapeuta => usar session.user_id
        const targetTerapeutaId = (() => {
            if (!session) return null;
            if (isSuperAdmin) return null;
            if (isAdminLike) return session?.id_terapeuta || null;
            if (isTerapeuta) return session?.user_id || null;
            return null;
        })();

        async function load() {
            setLoading(true);
            setLoadError("");

            try {
                const payload = {
                    p_id_sesion: session?.id_sesion,
                    p_actor_user_id: session?.user_id,
                    p_limit: 50,
                    p_offset: 0,
                };

                // Filtro condicional por terapeuta (solo si NO es super admin)
                if (targetTerapeutaId) {
                    payload.p_id_usuario_terapeuta = targetTerapeutaId;
                }

                const resp = await listarSolicitudes(payload);

                if (resp?.ok !== true) {
                    throw new Error(resp?.message || "No se pudo cargar solicitudes");
                }

                const arr = Array.isArray(resp?.rows) ? resp.rows : [];
                const mapped = arr.map(mapSolicitudToUI);

                if (!alive) return;

                setSolicitudes(mapped);
                setSelectedId(mapped[0]?.id ?? null);
            } catch (e) {
                if (!alive) return;
                setLoadError(e?.message || "Error cargando solicitudes");
            } finally {
                if (alive) setLoading(false);
            }
        }

        if (session?.id_sesion) load();
        return () => (alive = false);
    }, [
        session?.id_sesion,
        session?.user_id,
        session?.is_super_admin,
        session?.is_admin,
        session?.is_accounter,
        session?.is_terapeuta,
        session?.id_terapeuta,
    ]);

    const selected = useMemo(
        () => solicitudes.find((s) => s.id === selectedId) || solicitudes[0] || null,
        [selectedId, solicitudes]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return solicitudes;
        return solicitudes.filter((s) =>
            [s.nombre, s.id, s.ref].some((x) => String(x).toLowerCase().includes(q))
        );
    }, [query, solicitudes]);

    return {
        query,
        setQuery,
        solicitudes,
        setSolicitudes,
        selectedId,
        setSelectedId,
        selected,
        filtered,
        loading,
        loadError,
    };
}
