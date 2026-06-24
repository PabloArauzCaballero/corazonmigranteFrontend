import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { CONTABILIDAD_ENDPOINT } from "../../../../config/CONTABILIDAD_ENDPOINT";

function unwrapFnRow(res) {
    const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
    if (!r0 || typeof r0 !== "object") return null;
    const keys = Object.keys(r0);
    if (keys.length !== 1) return null;
    const v = r0[keys[0]];
    return v && typeof v === "object" ? v : null;
}

function assertDbOk(res) {
    if (res?.ok === false) throw new Error(res?.message || "Operación fallida");

    const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
    if (r0?.status) {
        if (String(r0.status).toLowerCase() !== "ok") {
            const err = new Error(r0?.message || "Operación fallida");
            err.data = res;
            throw err;
        }
        return res;
    }

    const inner = unwrapFnRow(res);
    if (inner) {
        if (inner.ok === false) {
            const err = new Error(inner?.message || "Operación fallida");
            err.data = res;
            throw err;
        }
        return res;
    }

    return res;
}

function getActorPayload(session) {
    return {
        p_actor_user_id:
            session?.user_id ?? session?.usuario_id ?? session?.id_user ?? session?.id_usuario,
        p_id_sesion: session?.id_sesion,
    };
}

function toIsoDateInput(value) {
    if (!value) return "";
    const s = String(value);
    return s.includes("T") ? s.split("T")[0] : s;
}

function safeParseJson(raw, fallback) {
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function getCacheKey(session) {
    if (!session?.id_sesion) return "";
    return `cm_contabilidad_cache_v1:${session.id_sesion}`;
}

function readCache(session) {
    const key = getCacheKey(session);
    if (!key) return null;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return safeParseJson(raw, null);
}

function writeCache(session, next) {
    const key = getCacheKey(session);
    if (!key) return;
    sessionStorage.setItem(key, JSON.stringify(next));
}

function ensureCacheShape(session) {
    const key = getCacheKey(session);
    if (!key) return;

    if (!sessionStorage.getItem(key)) {
        writeCache(session, {
            cuentas: { byId: {} },
            grupos_cuenta: { byId: {} },
            centros_costo: { byId: {} },
            transacciones: { byId: {} },
        });
    } else {
        const cur = readCache(session) || {};
        const next = {
            cuentas: cur.cuentas || { byId: {} },
            grupos_cuenta: cur.grupos_cuenta || { byId: {} },
            centros_costo: cur.centros_costo || { byId: {} },
            transacciones: cur.transacciones || { byId: {} },
        };
        writeCache(session, next);
    }
}

function cacheUpsertTransaccion(session, transaccion) {
    const cur = readCache(session);
    if (!cur) return;
    const byId = { ...(cur.transacciones?.byId || {}) };
    byId[String(transaccion.id_transaccion)] = transaccion;
    writeCache(session, {
        ...cur,
        transacciones: { ...(cur.transacciones || {}), byId },
    });
}

function overlayTransacciones(list, session) {
    const cur = readCache(session);
    const byId = cur?.transacciones?.byId || {};

    const out = [];
    const seen = new Set();
    for (const t of list) {
        const k = String(t.id_transaccion);
        out.push(byId[k] ? { ...t, ...byId[k] } : t);
        seen.add(k);
    }
    for (const k of Object.keys(byId)) {
        if (!seen.has(k)) out.unshift(byId[k]);
    }
    return out;
}

function mapTransaccionRow(r) {
    const movimientos = Array.isArray(r.movimientos) ? r.movimientos : [];
    const total_debe = movimientos.reduce((a, m) => a + (Number(m?.debe) || 0), 0);
    const total_haber = movimientos.reduce((a, m) => a + (Number(m?.haber) || 0), 0);

    // ✅ IMPORTANTE: conservar "venta" porque tu API lo manda
    const venta = r?.venta && typeof r.venta === "object" ? r.venta : null;

    return {
        id_transaccion: r.id_transaccion,
        fecha: toIsoDateInput(r.fecha),
        tipo_transaccion: r.tipo_transaccion ?? "",
        glosa: r.glosa ?? "",
        referencia_externa: r.referencia_externa ?? "",
        created_at: r.created_at ?? null,
        register_status: r.register_status ?? "Activo",
        movimientos: movimientos.map((m) => ({
            id_movimiento: m.id_movimiento ?? null,
            id_cuenta: m.id_cuenta ?? null,
            cuenta_codigo: m.cuenta_codigo ?? "",
            cuenta_nombre: m.cuenta_nombre ?? "",
            descripcion: m.descripcion ?? "",
            debe: Number(m.debe) || 0,
            haber: Number(m.haber) || 0,
        })),
        total_debe,
        total_haber,

        // ✅ NUEVO
        venta,
    };
}

export function useTransaccionesAdmin(session, { autoFetch = true, limit = 200 } = {}) {
    const [transacciones, setTransacciones] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchTransacciones = useCallback(
        async ({ offset = 0, fechaDesde = null, fechaHasta = null, tipoTransaccion = null } = {}) => {
            const endpoint = CONTABILIDAD_ENDPOINT?.CONTABILIDAD_TRANSACCIONES_LISTAR;
            if (!endpoint) {
                setError("Endpoint CONTABILIDAD_TRANSACCIONES_LISTAR no está definido.");
                return;
            }
            if (!session?.id_sesion) {
                setError("No hay sesión activa (id_sesion faltante). ");
                return;
            }

            setIsLoading(true);
            setError("");
            try {
                const page = Math.floor((Number(offset) || 0) / (Number(limit) || 1)) + 1;
                const payload = {
                    ...getActorPayload(session),

                    p_limit: limit,
                    p_offset: offset,
                    limit,
                    offset,
                    page,
                    page_size: limit,
                    p_page: page,
                    p_page_size: limit,
                    ...(fechaDesde ? { p_fecha_desde: fechaDesde } : {}),
                    ...(fechaHasta ? { p_fecha_hasta: fechaHasta } : {}),
                    ...(tipoTransaccion ? { p_tipo_transaccion: tipoTransaccion } : {}),
                };

                const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
                const list = Array.isArray(res?.rows) ? res.rows : [];
                const mapped = list.map(mapTransaccionRow);
                setTransacciones(overlayTransacciones(mapped, session));
            } catch (e) {
                setError(e?.message || "Error al listar transacciones");
            } finally {
                setIsLoading(false);
            }
        },
        [session, limit]
    );

    const registrarBatch = useCallback(
        async ({ transacciones: batch, stopOnError = false }) => {
            const endpoint = CONTABILIDAD_ENDPOINT?.CONTABILIDAD_TRANSACCIONES_BATCH;
            if (!endpoint) throw new Error("Endpoint CONTABILIDAD_TRANSACCIONES_BATCH no definido");
            if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");

            const payload = {
                ...getActorPayload(session),
                p_stop_on_error: !!stopOnError,
                p_transacciones: batch,
            };

            const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
            return res;
        },
        [session]
    );

    const registrarVenta = useCallback(
        async ({ fecha, glosa, referencia_externa, metadata, movimientos, cantidad, id_producto, id_cita = null }) => {
            const endpoint = CONTABILIDAD_ENDPOINT?.CONTABILIDAD_TRANSACCION_VENTA_CREAR;
            if (!endpoint) throw new Error("Endpoint CONTABILIDAD_TRANSACCION_VENTA_CREAR no definido");
            if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");

            const payload = {
                ...getActorPayload(session),
                p_fecha: fecha,
                p_glosa: glosa,
                p_referencia_externa: referencia_externa,
                p_metadata: metadata || {},
                p_movimientos: movimientos || [],
                p_cantidad: Number(cantidad) || 0,
                p_id_producto: Number(id_producto) || null,
                ...(id_cita ? { p_id_cita: Number(id_cita) } : {}),
            };

            const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));

            const inner = unwrapFnRow(res);
            if (inner) {
                if (inner.ok === false) throw new Error(inner?.message || "No se pudo registrar la transacción de venta");
                return { ok: true, data: inner.data ?? null, raw: res };
            }

            if (res?.ok === false) throw new Error(res?.message || "No se pudo registrar la transacción de venta");
            return { ok: true, data: res?.data ?? null, raw: res };
        },
        [session]
    );

    useEffect(() => {
        if (!session?.id_sesion) return;
        ensureCacheShape(session);
    }, [session?.id_sesion]);

    useEffect(() => {
        if (!autoFetch) return;
        if (!session?.id_sesion) return;
        fetchTransacciones();
    }, [autoFetch, session?.id_sesion, fetchTransacciones]);

    const byId = useMemo(() => {
        const m = new Map();
        for (const t of transacciones) m.set(t.id_transaccion, t);
        return m;
    }, [transacciones]);

    const applyOptimisticCreatedTransaccion = useCallback(
        (transaccion) => {
            cacheUpsertTransaccion(session, transaccion);
            setTransacciones((prev) => overlayTransacciones(prev, session));
        },
        [session]
    );

    return {
        transacciones,
        byId,
        isLoading,
        error,
        fetchTransacciones,
        registrarBatch,
        registrarVenta,
        setTransacciones,
        setError,
        applyOptimisticCreatedTransaccion,
    };
}
