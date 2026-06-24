import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { CONTABILIDAD_ENDPOINT } from "../../../../config/CONTABILIDAD_ENDPOINT";

function assertDbOk(res) {
  if (res?.ok === false) throw new Error(res?.message || "Operación fallida");

  const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
  if (r0?.status && String(r0.status).toLowerCase() !== "ok") {
    const err = new Error(r0?.message || "Operación fallida");
    err.data = res;
    throw err;
  }
  return res;
}

// Normaliza:
// - "" / null -> null
// - undefined -> undefined (para poder omitir en EDITAR)
// - "0" / 0 / NaN / <=0 -> null
// - >0 -> Number
function normalizeParentId(v) {
  if (v === undefined) return undefined;
  if (v === "" || v === null) return null;

  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function mapGrupoRow(r) {
  return {
    id_grupo_cuenta: r.id_grupo_cuenta ?? r.id ?? null,
    codigo: r.codigo ?? "",
    nombre: r.nombre ?? "",
    tipo_grupo: r.tipo_grupo ?? "",
    id_grupo_padre: normalizeParentId(r.id_grupo_padre) ?? null,
    grupo_padre_nombre: r.grupo_padre_nombre ?? null,
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

const CACHE_NS = "cm_contabilidad_cache_v1";
const CACHE_ENTITY = "grupos_cuenta";

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
  } catch { }
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

export function useGruposCuentaAdmin(session, { autoFetch = true, limit = 200 } = {}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const cacheKey = useMemo(() => getCacheKey(session), [session?.id_sesion]);

  useEffect(() => {
    if (!cacheKey) return;
    ensureEntityCache(cacheKey);
  }, [cacheKey]);

  const fetchGrupos = useCallback(
    async ({ offset = 0 } = {}) => {
      const endpoint = CONTABILIDAD_ENDPOINT?.GRUPO_CUENTA_LISTAR;
      if (!endpoint) {
        setError("CONTABILIDAD_ENDPOINT.GRUPO_CUENTA_LISTAR no está definido");
        return [];
      }
      if (!session?.id_sesion) return [];

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
        const list = Array.isArray(res?.rows) ? res.rows.map(mapGrupoRow) : [];

        const cachedById = cacheKey ? getCachedById(cacheKey) : {};
        const seen = new Set();
        const merged = list.map((r) => {
          const id = String(r.id_grupo_cuenta);
          seen.add(id);
          const c = cachedById?.[id];
          return c ? { ...r, ...c } : r;
        });
        for (const [id, c] of Object.entries(cachedById || {})) {
          if (!seen.has(String(id))) merged.unshift(c);
        }

        setRows(merged);
        return merged;
      } catch (e) {
        setError(e?.message || "Error al listar grupos de cuenta");
        setRows([]);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [session, limit, cacheKey]
  );

  const crearGrupoCuenta = useCallback(
    async (grupo) => {
      const endpoint = CONTABILIDAD_ENDPOINT?.GRUPO_CUENTA_CREAR;
      if (!endpoint) throw new Error("Endpoint GRUPO_CUENTA_CREAR no definido");
      if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");

      const parentId = normalizeParentId(grupo.id_grupo_padre);

      const payload = {
        ...getActorPayload(session),
        p_nombre: grupo.nombre,
        p_codigo: grupo.codigo,
        p_tipo_grupo: grupo.tipo_grupo,
        p_metadata: grupo.metadata ?? {},
        // crear: si es raíz => null está bien
        p_id_grupo_padre: parentId ?? null,
      };

      const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
      const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
      const grupoResp = r0?.data?.grupo_cuenta;

      if (grupoResp?.id_grupo_cuenta) {
        const mapped = mapGrupoRow(grupoResp);
        if (cacheKey) upsertCacheRow(cacheKey, mapped.id_grupo_cuenta, mapped);
        setRows((prev) => {
          const idx = prev.findIndex((x) => x.id_grupo_cuenta === mapped.id_grupo_cuenta);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...mapped };
            return copy;
          }
          return [mapped, ...prev];
        });
      }

      return res;
    },
    [session, cacheKey]
  );

  const editarGrupoCuenta = useCallback(
    async (grupo) => {
      const endpoint = CONTABILIDAD_ENDPOINT?.GRUPO_CUENTA_EDITAR;
      if (!endpoint) throw new Error("Endpoint GRUPO_CUENTA_EDITAR no definido");
      if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");
      if (!grupo?.id_grupo_cuenta) throw new Error("Falta id_grupo_cuenta");

      const parentId = normalizeParentId(grupo.id_grupo_padre);

      const payload = {
        ...getActorPayload(session),
        p_id_grupo_cuenta: grupo.id_grupo_cuenta,
        p_nombre: grupo.nombre,
        p_codigo: grupo.codigo,
        p_tipo_grupo: grupo.tipo_grupo,
        p_register_status: grupo.register_status ?? "Activo",
        p_metadata: grupo.metadata, // puede ser undefined -> se omite en JSON
        // 👇 IMPORTANTE: si parentId es undefined, NO lo mandamos
        ...(parentId !== undefined ? { p_id_grupo_padre: parentId } : {}),
      };

      const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
      const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
      const grupoResp = r0?.data?.grupo_cuenta;

      if (grupoResp?.id_grupo_cuenta) {
        const mapped = mapGrupoRow(grupoResp);
        if (cacheKey) upsertCacheRow(cacheKey, mapped.id_grupo_cuenta, mapped);
        setRows((prev) => prev.map((x) => (x.id_grupo_cuenta === mapped.id_grupo_cuenta ? { ...x, ...mapped } : x)));
      }

      return res;
    },
    [session, cacheKey]
  );

  const apagarGrupoCuenta = useCallback(
    async (grupo, motivo = "") => {
      const endpoint = CONTABILIDAD_ENDPOINT?.GRUPO_CUENTA_ELIMINAR;
      if (!endpoint) throw new Error("Endpoint GRUPO_CUENTA_ELIMINAR no definido");
      if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");
      if (!grupo?.id_grupo_cuenta) throw new Error("Falta id_grupo_cuenta");

      const payload = {
        ...getActorPayload(session),
        p_id_grupo_cuenta: grupo.id_grupo_cuenta,
        ...(motivo ? { p_motivo: motivo } : {}),
      };

      const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
      const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
      const grupoResp = r0?.data?.grupo_cuenta;

      if (grupoResp?.id_grupo_cuenta) {
        const mapped = mapGrupoRow(grupoResp);
        if (cacheKey) upsertCacheRow(cacheKey, mapped.id_grupo_cuenta, mapped);
        setRows((prev) => prev.map((x) => (x.id_grupo_cuenta === mapped.id_grupo_cuenta ? { ...x, ...mapped } : x)));
      }

      return res;
    },
    [session, cacheKey]
  );

  useEffect(() => {
    if (!autoFetch) return;
    if (!session?.id_sesion) return;
    fetchGrupos({ offset: 0 });
  }, [autoFetch, session?.id_sesion, fetchGrupos]);

  const byId = useMemo(() => {
    const map = new Map();
    for (const r of rows) map.set(r.id_grupo_cuenta, r);
    return map;
  }, [rows]);

  return {
    rows,
    byId,
    isLoading,
    error,
    fetchGrupos,
    crearGrupoCuenta,
    editarGrupoCuenta,
    apagarGrupoCuenta,
    setRows,
    setError,
  };
}
