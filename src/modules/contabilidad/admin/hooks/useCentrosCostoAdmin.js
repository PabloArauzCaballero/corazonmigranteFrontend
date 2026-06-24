import { useCallback, useEffect, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { CONTABILIDAD_ENDPOINT } from "../../../../config/CONTABILIDAD_ENDPOINT";

function getActorPayload(session) {
  return {
    // Unificamos la forma (igual que Cuentas/Grupos) para evitar enviar null a veces
    p_actor_user_id:
      session?.user_id ??
      session?.usuario_id ??
      session?.id_user ??
      session?.id_usuario ??
      null,
    p_id_sesion: session?.id_sesion ?? null,
  };
}

function assertDbOk(res) {
  // A veces el backend devuelve HTTP 200 con ok=true pero status="error" dentro de rows[0]
  if (res?.ok === false) {
    throw new Error(res?.message || "Operación fallida");
  }
  const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
  if (r0?.status && String(r0.status).toLowerCase() !== "ok") {
    const err = new Error(r0?.message || "Operación fallida");
    err.data = res;
    throw err;
  }
  return res;
}

function mapListResponse(resp) {
  const rows = resp?.rows;
  if (!Array.isArray(rows)) return [];
  // Algunos endpoints devuelven rows directos; otros {status, data}
  // Para listar_centros_costo: rows[] ya viene con los campos de tabla.
  return rows.map((r) => ({
    id_centro_costo: r.id_centro_costo,
    nombre: r.nombre ?? "",
    codigo: r.codigo ?? "",
    register_status: r.register_status ?? "Activo",
    // metadata NO viene en listar -> se maneja en UI como opcional/touched.
  }));
}

// ------------------------------
// Session cache (sessionStorage)
// ------------------------------
const CACHE_NS = "cm_contabilidad_cache_v1";
const CACHE_ENTITY = "centros_costo";

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

export function useCentrosCostoAdmin(session, { autoFetch = true, limit = 200 } = {}) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const cacheKey = getCacheKey(session);

  // crea la clave en sessionStorage apenas exista la sesión (para que se vea en DevTools)
  useEffect(() => {
    if (!cacheKey) return;
    ensureEntityCache(cacheKey);
  }, [cacheKey]);

  const fetchCentros = useCallback(async ({ offset = 0 } = {}) => {
    const endpoint = CONTABILIDAD_ENDPOINT?.CENTRO_COSTO_LISTAR;
    if (!endpoint) throw new Error("Endpoint CENTRO_COSTO_LISTAR no definido");
    if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");

    setIsLoading(true);
    setError("");
    try {
      const page = Math.floor((Number(offset) || 0) / (Number(limit) || 1)) + 1;
      const payload = {
        ...getActorPayload(session),

        // Paginación (compatibilidad)
        p_limit: limit,
        p_offset: offset,
        limit,
        offset,
        page,
        page_size: limit,
        p_page: page,
        p_page_size: limit,
      };
      const resp = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
      const list = mapListResponse(resp);

      // Overlay con cache de sesión
      const cachedById = cacheKey ? getCachedById(cacheKey) : {};
      const seen = new Set();
      const merged = list.map((r) => {
        const id = String(r.id_centro_costo);
        seen.add(id);
        const c = cachedById?.[id];
        return c ? { ...r, ...c } : r;
      });
      for (const [id, c] of Object.entries(cachedById || {})) {
        if (!seen.has(String(id))) merged.unshift(c);
      }
      setRows(merged);
      return resp;
    } catch (e) {
      setError(e?.message || "Error al listar centros de costo");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [session, cacheKey, limit]);

  useEffect(() => {
    if (!autoFetch) return;
    if (!session?.id_sesion) return;
    fetchCentros({ offset: 0 }).catch(() => void 0);
  }, [autoFetch, session?.id_sesion, fetchCentros]);

  const crearCentro = useCallback(async (centro) => {
    const endpoint = CONTABILIDAD_ENDPOINT?.CENTRO_COSTO_CREAR;
    if (!endpoint) throw new Error("Endpoint CENTRO_COSTO_CREAR no definido");
    if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");

    const payload = {
      ...getActorPayload(session),
      p_codigo: centro.codigo,
      p_nombre: centro.nombre,
      p_register_status: centro.register_status ?? "Activo",
      p_metadata: centro.metadata ?? {},
    };
    const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
    const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
    const centroResp = r0?.data?.centro_costo;
    if (centroResp?.id_centro_costo) {
      const mapped = {
        id_centro_costo: centroResp.id_centro_costo,
        nombre: centroResp.nombre ?? "",
        codigo: centroResp.codigo ?? "",
        register_status: centroResp.register_status ?? "Activo",
        metadata: centroResp.metadata ?? null,
        created_at: centroResp.created_at ?? null,
        updated_at: centroResp.updated_at ?? null,
        id_version: centroResp.id_version ?? null,
      };
      if (cacheKey) upsertCacheRow(cacheKey, mapped.id_centro_costo, mapped);
      setRows((prev) => {
        const idx = prev.findIndex((x) => x.id_centro_costo === mapped.id_centro_costo);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...mapped };
          return copy;
        }
        return [mapped, ...prev];
      });
    }
    return res;
  }, [session, cacheKey, limit]);

  const editarCentro = useCallback(async (centro) => {
    const endpoint = CONTABILIDAD_ENDPOINT?.CENTRO_COSTO_EDITAR;
    if (!endpoint) throw new Error("Endpoint CENTRO_COSTO_EDITAR no definido");
    if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");
    if (!centro?.id_centro_costo) throw new Error("Falta id_centro_costo");

    const payload = {
      ...getActorPayload(session),
      p_id_centro_costo: centro.id_centro_costo,
      p_codigo: centro.codigo,
      p_nombre: centro.nombre,
      p_register_status: centro.register_status ?? "Activo",
      // Importante: listar no trae metadata; no forzar {} (evita sobre-escritura).
      p_metadata: centro.metadata,
    };
    const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
    const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
    const centroResp = r0?.data?.centro_costo;
    if (centroResp?.id_centro_costo) {
      const mapped = {
        id_centro_costo: centroResp.id_centro_costo,
        nombre: centroResp.nombre ?? "",
        codigo: centroResp.codigo ?? "",
        register_status: centroResp.register_status ?? "Activo",
        metadata: centroResp.metadata ?? null,
        created_at: centroResp.created_at ?? null,
        updated_at: centroResp.updated_at ?? null,
        id_version: centroResp.id_version ?? null,
      };
      if (cacheKey) upsertCacheRow(cacheKey, mapped.id_centro_costo, mapped);
      setRows((prev) => prev.map((x) => (x.id_centro_costo === mapped.id_centro_costo ? { ...x, ...mapped } : x)));
    }
    return res;
  }, [session, cacheKey, limit]);

  const apagarCentro = useCallback(async (centro) => {
    const endpoint = CONTABILIDAD_ENDPOINT?.CENTRO_COSTO_ELIMINAR;
    if (!endpoint) throw new Error("Endpoint CENTRO_COSTO_ELIMINAR no definido");
    if (!session?.id_sesion) throw new Error("Sesión inválida (id_sesion faltante)");
    if (!centro?.id_centro_costo) throw new Error("Falta id_centro_costo");

    const payload = {
      ...getActorPayload(session),
      p_id_centro_costo: centro.id_centro_costo,
      p_register_status: "Inactivo",
    };
    const res = assertDbOk(await createApiConn(endpoint, payload, "POST", session));
    const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
    const centroResp = r0?.data?.centro_costo;
    if (centroResp?.id_centro_costo) {
      const mapped = {
        id_centro_costo: centroResp.id_centro_costo,
        nombre: centroResp.nombre ?? "",
        codigo: centroResp.codigo ?? "",
        register_status: centroResp.register_status ?? "Inactivo",
        metadata: centroResp.metadata ?? null,
        created_at: centroResp.created_at ?? null,
        updated_at: centroResp.updated_at ?? null,
        id_version: centroResp.id_version ?? null,
      };
      if (cacheKey) upsertCacheRow(cacheKey, mapped.id_centro_costo, mapped);
      setRows((prev) => prev.map((x) => (x.id_centro_costo === mapped.id_centro_costo ? { ...x, ...mapped } : x)));
    }
    return res;
  }, [session, cacheKey, limit]);

  return {
    rows,
    isLoading,
    error,
    fetchCentros,
    crearCentro,
    editarCentro,
    apagarCentro,
  };
}
