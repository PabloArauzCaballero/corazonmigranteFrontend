// src/modules/contabilidad/admin/hooks/useCuentasAdmin.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { CONTABILIDAD_ENDPOINT } from "../../../../config/CONTABILIDAD_ENDPOINT";

function assertDbOk(res) {
    if (res?.ok === false) {
        const msg = res?.message || res?.error || "Operación fallida";
        const err = new Error(msg);
        err.data = res;
        throw err;
    }

    const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
    if (r0?.status && String(r0.status).toLowerCase() !== "ok") {
        const msg = r0?.message || r0?.error || "Operación fallida";
        const err = new Error(msg);
        err.data = res;
        throw err;
    }

    return res;
}

function mapCuentaRow(r) {
    return {
        id_cuenta: r.id_cuenta,
        nombre: r.nombre ?? "",
        codigo: r.codigo ?? "",
        id_grupo_cuenta: r.id_grupo_cuenta ?? null,
        grupo_cuenta_nombre: r.grupo_cuenta_nombre ?? "",
        tipo_cuenta: r.tipo_cuenta ?? "",
        sub_tipo: r.sub_tipo ?? "",
        categoria: r.categoria ?? "",
        moneda: r.moneda ?? "",
        register_status: r.register_status ?? "Activo",
        metadata: r.metadata ?? null,
        created_at: r.created_at ?? null,
        updated_at: r.updated_at ?? null,
        id_version: r.id_version ?? null,
    };
}

function getActorPayload(session) {
    return {
        p_actor_user_id: session?.user_id ?? session?.usuario_id ?? session?.id_user ?? session?.id_usuario,
        p_id_sesion: session?.id_sesion,
    };
}

// ------------------------------
// Session cache (sessionStorage)
// ------------------------------
const CACHE_NS = "cm_contabilidad_cache_v1";
const CACHE_ENTITY = "cuentas";

function getCacheKey(session) {
    const idSesion = session?.id_sesion;
    return idSesion ? `${CACHE_NS}:${idSesion}` : null;
}

function safeReadCache(key) {
    if (!key) return null;
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function safeWriteCache(key, cacheObj) {
    if (!key) return;
    try {
        sessionStorage.setItem(key, JSON.stringify(cacheObj));
    } catch {
        // ignore
    }
}

function ensureEntityCache(key) {
    const base = safeReadCache(key) || {};
    if (!base?.[CACHE_ENTITY]?.byId) {
        base[CACHE_ENTITY] = { byId: {} };
        safeWriteCache(key, base);
    }
    return base;
}

function upsertCacheRow(key, id, row) {
    if (!id) return;
    const base = ensureEntityCache(key);
    base[CACHE_ENTITY].byId[String(id)] = row;
    safeWriteCache(key, base);
}

function getCachedById(key) {
    const base = ensureEntityCache(key);
    return base?.[CACHE_ENTITY]?.byId || {};
}

// ✅ helper: solo devuelve número válido o undefined (para omitir)
function normalizeOptionalId(v) {
    if (v === undefined) return undefined;
    if (v === null) return undefined;
    if (v === "") return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return n;
}

export function useCuentasAdmin(session, { autoFetch = true, limit = 200 } = {}) {
    const [rows, setRows] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const cacheKey = useMemo(() => getCacheKey(session), [session?.id_sesion]);

    useEffect(() => {
        if (!cacheKey) return;
        ensureEntityCache(cacheKey);
    }, [cacheKey]);

    const fetchCuentas = useCallback(
        async ({ offset = 0 } = {}) => {
            const endpoint = CONTABILIDAD_ENDPOINT?.CUENTA_LISTAR;
            if (!endpoint) {
                setError("Endpoint CUENTA_LISTAR no está definido en CONTABILIDAD_ENDPOINT.");
                return;
            }
            if (!session?.id_sesion) {
                setError("No hay sesión activa (id_sesion faltante).");
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
                };

                const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));

                const list = Array.isArray(res?.rows) ? res.rows : [];
                const mapped = list.map(mapCuentaRow);

                const cachedById = cacheKey ? getCachedById(cacheKey) : {};
                const seen = new Set();

                let merged = mapped.map((r) => {
                    const id = String(r.id_cuenta ?? "");
                    if (id) seen.add(id);
                    const c = id ? cachedById?.[id] : null;
                    return c ? { ...r, ...c } : r;
                });

                for (const [id, c] of Object.entries(cachedById || {})) {
                    if (!seen.has(String(id))) merged.unshift(c);
                }

                // ✅ dedupe final
                const byId = new Map();
                for (const r of merged) {
                    const k = String(r?.id_cuenta ?? "");
                    if (!k) continue;
                    byId.set(k, r);
                }
                merged = Array.from(byId.values());

                setRows(merged);
            } catch (e) {
                console.error("fetchCuentas error:", e?.message, e?.data);
                setError(e?.message || "Error al listar cuentas");
            } finally {
                setIsLoading(false);
            }
        },
        [session, limit, cacheKey]
    );

    const crearCuenta = useCallback(
        async (cuenta) => {
            const endpoint = CONTABILIDAD_ENDPOINT?.CUENTA_CREAR;
            if (!endpoint) throw new Error("Endpoint CUENTA_CREAR no definido");
            if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");

            const payload = {
                ...getActorPayload(session),
                p_nombre: cuenta.nombre,
                p_codigo: cuenta.codigo,
                p_tipo_cuenta: cuenta.tipo_cuenta,
                p_sub_tipo: cuenta.sub_tipo,
                p_categoria: cuenta.categoria,
                p_moneda: cuenta.moneda,
                p_metadata: cuenta.metadata ?? {},
            };

            // ✅ SI ES NULL/"" => NO SE MANDA
            const grupoId = normalizeOptionalId(cuenta.id_grupo_cuenta);
            if (grupoId !== undefined) payload.p_id_grupo_cuenta = grupoId;

            const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
            const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
            const cuentaResp = r0?.data?.cuenta;

            if (cuentaResp?.id_cuenta) {
                const mapped = mapCuentaRow(cuentaResp);
                if (cacheKey) upsertCacheRow(cacheKey, mapped.id_cuenta, mapped);

                setRows((prev) => {
                    const byId = new Map();
                    for (const p of prev) byId.set(String(p.id_cuenta), p);
                    byId.set(String(mapped.id_cuenta), { ...(byId.get(String(mapped.id_cuenta)) || {}), ...mapped });
                    return Array.from(byId.values());
                });
            }

            return res;
        },
        [session, cacheKey]
    );

    const editarCuenta = useCallback(
        async (cuenta) => {
            const endpoint = CONTABILIDAD_ENDPOINT?.CUENTA_EDITAR;
            if (!endpoint) throw new Error("Endpoint CUENTA_EDITAR no definido");
            if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");

            const payload = {
                ...getActorPayload(session),
                p_id_cuenta: cuenta.id_cuenta,
                p_nombre: cuenta.nombre,
                p_codigo: cuenta.codigo,
                p_tipo_cuenta: cuenta.tipo_cuenta,
                p_sub_tipo: cuenta.sub_tipo,
                p_categoria: cuenta.categoria,
                p_moneda: cuenta.moneda,
                p_register_status: cuenta.register_status ?? "Activo",

                // metadata: undefined => se omite
                p_metadata: cuenta.metadata,
            };

            // ✅ SI ES NULL/""/undefined => NO SE MANDA (regla que pediste)
            const grupoId = normalizeOptionalId(cuenta.id_grupo_cuenta);
            if (grupoId !== undefined) payload.p_id_grupo_cuenta = grupoId;

            const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
            const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
            const cuentaResp = r0?.data?.cuenta;

            if (cuentaResp?.id_cuenta) {
                const mapped = mapCuentaRow(cuentaResp);
                if (cacheKey) upsertCacheRow(cacheKey, mapped.id_cuenta, mapped);

                setRows((prev) => {
                    const byId = new Map();
                    for (const p of prev) byId.set(String(p.id_cuenta), p);
                    byId.set(String(mapped.id_cuenta), { ...(byId.get(String(mapped.id_cuenta)) || {}), ...mapped });
                    return Array.from(byId.values());
                });
            }

            return res;
        },
        [session, cacheKey]
    );

    const apagarCuenta = useCallback(
        async (cuenta) => {
            const endpoint = CONTABILIDAD_ENDPOINT?.CUENTA_ELIMINAR;
            if (!endpoint) throw new Error("Endpoint CUENTA_ELIMINAR no definido");
            if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");

            const payload = {
                ...getActorPayload(session),
                p_id_cuenta: cuenta.id_cuenta,
                p_register_status: "Inactivo",
            };

            const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
            const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
            const cuentaResp = r0?.data?.cuenta;

            if (cuentaResp?.id_cuenta) {
                const mapped = mapCuentaRow(cuentaResp);
                if (cacheKey) upsertCacheRow(cacheKey, mapped.id_cuenta, mapped);

                setRows((prev) => {
                    const byId = new Map();
                    for (const p of prev) byId.set(String(p.id_cuenta), p);
                    byId.set(String(mapped.id_cuenta), { ...(byId.get(String(mapped.id_cuenta)) || {}), ...mapped });
                    return Array.from(byId.values());
                });
            }

            return res;
        },
        [session, cacheKey]
    );

    useEffect(() => {
        if (!autoFetch) return;
        if (!session?.id_sesion) return;
        fetchCuentas();
    }, [autoFetch, session?.id_sesion, fetchCuentas]);

    const byId = useMemo(() => {
        const m = new Map();
        for (const r of rows) m.set(r.id_cuenta, r);
        return m;
    }, [rows]);

    return {
        rows,
        byId,
        isLoading,
        error,
        fetchCuentas,
        crearCuenta,
        editarCuenta,
        apagarCuenta,
        setRows,
        setError,
    };
}
