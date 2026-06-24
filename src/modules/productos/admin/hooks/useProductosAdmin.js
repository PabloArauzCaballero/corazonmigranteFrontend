import { useEffect, useMemo, useState } from "react";
import { TERAPIA_ENDPOINTS } from "../../../../config/TERAPIA_ENDPOINTS";
import { createApiConn } from "../../../../helpers/api_conn_factory";

/**
 * Admin hook: Productos
 * - Reemplaza data mock por consumo real del endpoint TERAPIA_ENDPOINTS.PRODUCTOS_LISTAR
 * - Incluye mapper basado en la respuesta real
 */
export function useProductosAdmin(session) {
    const [query, setQuery] = useState("");
    const [onlyActive, setOnlyActive] = useState(true);

    const [productos, setProductos] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Cache local para mitigar el delay de consistencia del backend (ej: Redis)
    // - Guarda creaciones/modificaciones confirmadas (status ok)
    // - En listar(), se hace merge y también se inyectan items que aún no aparecen
    const CACHE_KEY = "cm_terapia_productos_cache_v1";
    const readCache = () => {
        try {
            if (typeof window === "undefined") return {};
            const raw = window.sessionStorage.getItem(CACHE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };
    const writeCache = (obj) => {
        try {
            if (typeof window === "undefined") return;
            window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(obj || {}));
        } catch {
            // no-op
        }
    };
    const upsertCache = (producto) => {
        if (!producto?.id) return;
        const cache = readCache();
        cache[String(producto.id)] = { ...producto, _cached_at: Date.now() };
        writeCache(cache);
    };
    const removeFromCache = (id) => {
        if (!id) return;
        const cache = readCache();
        delete cache[String(id)];
        writeCache(cache);
    };
    const mergeListWithCache = (list) => {
        const cache = readCache();
        const byId = new Map((list || []).map((x) => [String(x.id), x]));

        // Merge sobre los que ya vinieron
        for (const [id, cached] of Object.entries(cache)) {
            if (byId.has(id)) {
                byId.set(id, { ...byId.get(id), ...cached });
            }
        }

        // Inyectar los que aún no aparecen en listar
        const injected = [];
        for (const [id, cached] of Object.entries(cache)) {
            if (!byId.has(id) && cached?.id) {
                injected.push(cached);
            }
        }

        return [...injected.sort((a, b) => (b?._cached_at || 0) - (a?._cached_at || 0)), ...Array.from(byId.values())];
    };

    const listar = async ({ limit = 50, offset = 0, onlyActivos = true } = {}) => {
        if (!session?.id_sesion) return;
        setIsLoading(true);
        setError("");
        try {
            const payload = {
                p_actor_user_id: session?.user_id,
                p_id_sesion: session?.id_sesion,
                p_limit: limit,
                p_offset: offset,
                p_only_activos: Boolean(onlyActivos),
            };

            const res = await createApiConn(TERAPIA_ENDPOINTS.PRODUCTOS_LISTAR, payload, "POST", session);
            const rows = Array.isArray(res?.rows) ? res.rows : [];

            // Mapper: backend -> UI
            const mapped = rows.map((r) => {
                const precio = r.precio_base === null || r.precio_base === undefined ? 0 : Number(r.precio_base);
                return {
                    id: r.id_producto,
                    nombre: r.nombre ?? "",
                    categoria: r.categoria ?? "—",
                    duracion_minutos: r.duracion_minutos ?? null,
                    precio_base: r.precio_base ?? null,
                    precio, // number
                    moneda: "BOB",
                    estado: onlyActivos ? "Activo" : "",
                    id_enfoque_default: r.id_enfoque_default ?? null,
                    enfoque_default_nombre: r.enfoque_default_nombre ?? null,
                    // En el listado el backend ya incluye descripcion (cuando exista)
                    descripcion: r.descripcion ?? "",
                    _raw: r,
                };
            });

            const merged = mergeListWithCache(mapped);
            setProductos(merged);

            // Mantener selección actual si sigue existiendo. Si no existe, no autoseleccionar.
            setSelectedId((prev) => {
                if (prev && merged.some((x) => x.id === prev)) return prev;
                return null;
            });
        } catch (e) {
            const msg = e?.data?.error || e?.message || "Error al listar productos";
            setError(msg);
            setProductos([]);
            setSelectedId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const mapProductoFromDb = (p) => {
        if (!p) return null;
        const precio = p.precio_base === null || p.precio_base === undefined ? 0 : Number(p.precio_base);
        return {
            id: p.id_producto,
            nombre: p.nombre ?? "",
            descripcion: p.descripcion ?? "",
            categoria: p.categoria ?? "—",
            duracion_minutos: p.duracion_minutos ?? null,
            precio_base: p.precio_base ?? null,
            precio,
            moneda: "BOB",
            id_enfoque_default: p.id_enfoque_default ?? null,
            enfoque_default_nombre: p.enfoque_default_nombre ?? null,
            metadata: p.metadata ?? null,
            created_at: p.created_at ?? null,
            updated_at: p.updated_at ?? null,
            id_version: p.id_version ?? null,
            register_status: p.register_status ?? null,
            _raw: p,
        };
    };

    const crear = async (draft) => {
        if (!session?.id_sesion) throw new Error("Sesión inválida");
        const payload = {
            p_actor_user_id: session?.user_id,
            p_id_sesion: session?.id_sesion,
            p_nombre: (draft?.nombre || "").trim(),
            p_descripcion: (draft?.descripcion || "").trim() || null,
            p_id_enfoque_default: draft?.id_enfoque_default ?? null,
            p_duracion_minutos: draft?.duracion_minutos ?? 50,
            p_precio_base: draft?.precio ?? null,
            p_costo_base: draft?.costo_base ?? null,
            p_categoria: draft?.categoria && draft.categoria !== "—" ? draft.categoria : null,
            p_metadata: draft?.metadata ?? null,
        };

        const res = await createApiConn(TERAPIA_ENDPOINTS.PRODUCTOS_CREAR, payload, "POST", session);
        const productoDb = res?.rows?.[0]?.data?.producto;
        const mapped = mapProductoFromDb(productoDb);
        if (mapped?.id) {
            // Cache inmediato (para que se vea aun si listar() viene viejo)
            upsertCache(mapped);
            setProductos((prev) => [mapped, ...prev.filter((x) => x.id !== mapped.id)]);
            setSelectedId(mapped.id);
        }
        return { res, producto: mapped };
    };

    const modificar = async (draft) => {
        if (!session?.id_sesion) throw new Error("Sesión inválida");
        if (!draft?.id) throw new Error("No hay producto seleccionado");

        // PATCH por diferencias para evitar sobreescrituras accidentales.
        const allowed = [
            "nombre",
            "descripcion",
            "id_enfoque_default",
            "duracion_minutos",
            "precio_base",
            "costo_base",
            "categoria",
            "metadata",
        ];

        const original = draft?._original || {};
        const patch = {};

        const currentPrecioBase = draft?.precio;
        const originalPrecioBase = original?.precio;

        // Normalización
        const current = {
            nombre: (draft?.nombre || "").trim(),
            descripcion: (draft?.descripcion || "").trim(),
            id_enfoque_default: draft?.id_enfoque_default ?? null,
            duracion_minutos: draft?.duracion_minutos ?? null,
            precio_base: currentPrecioBase ?? null,
            costo_base: draft?.costo_base ?? null,
            categoria: draft?.categoria && draft.categoria !== "—" ? draft.categoria : null,
            metadata: draft?.metadata ?? null,
        };

        const base = {
            nombre: (original?.nombre || "").trim(),
            descripcion: (original?.descripcion || "").trim(),
            id_enfoque_default: original?.id_enfoque_default ?? null,
            duracion_minutos: original?.duracion_minutos ?? null,
            precio_base: originalPrecioBase ?? null,
            costo_base: original?.costo_base ?? null,
            categoria: original?.categoria && original.categoria !== "—" ? original.categoria : null,
            metadata: original?.metadata ?? null,
        };

        for (const k of allowed) {
            if (JSON.stringify(current[k]) !== JSON.stringify(base[k])) {
                patch[k] = current[k];
            }
        }

        const payload = {
            p_actor_user_id: session?.user_id,
            p_id_sesion: session?.id_sesion,
            p_id_producto: draft.id,
            p_patch: patch,
        };

        const res = await createApiConn(TERAPIA_ENDPOINTS.PRODUCTOS_MODIFICAR, payload, "POST", session);
        const productoDb = res?.rows?.[0]?.data?.producto;
        const mapped = mapProductoFromDb(productoDb);
        if (mapped?.id) {
            upsertCache(mapped);
            setProductos((prev) => prev.map((x) => (x.id === mapped.id ? { ...x, ...mapped } : x)));
        }
        return { res, producto: mapped };
    };

    useEffect(() => {
        if (session?.id_sesion) {
            listar({ onlyActivos: onlyActive });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.id_sesion, onlyActive]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return productos;
        return productos.filter((p) =>
            [p.categoria, p.nombre, p.enfoque_default_nombre || ""].join(" ").toLowerCase().includes(q)
        );
    }, [productos, query]);

    const selected = useMemo(() => {
        if (!selectedId) return null;
        return filtered.find((p) => p.id === selectedId) || null;
    }, [filtered, selectedId]);

    // UI-only state (form) en panel derecho
    const [draft, setDraft] = useState(null);
    useEffect(() => {
        setDraft(selected ? { ...selected, _original: { ...selected } } : null);
    }, [selectedId, selected]);

    const nuevoProductoDraft = () => ({
        id: null,
        nombre: "",
        descripcion: "",
        categoria: "—",
        duracion_minutos: 50,
        precio: 0,
        moneda: "BOB",
        id_enfoque_default: null,
        enfoque_default_nombre: null,
        metadata: null,
        updated_at: null,
        id_version: null,
        _original: null,
        _isNew: true,
    });

    return {
        query,
        setQuery,
        onlyActive,
        setOnlyActive,

        productos,
        filtered,
        selectedId,
        setSelectedId,
        selected,

        draft,
        setDraft,

        isLoading,
        error,
        actions: { listar, crear, modificar, nuevoProductoDraft, mapProductoFromDb, setProductos },
    };
}
