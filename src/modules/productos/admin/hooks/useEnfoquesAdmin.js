import { useEffect, useMemo, useState } from "react";
import { TERAPIA_ENDPOINTS } from "../../../../config/TERAPIA_ENDPOINTS";
import { createApiConn } from "../../../../helpers/api_conn_factory";

/**
 * Admin hook: Enfoques
 * - Lista enfoques (ENFOQUES_LISTAR)
 * - Obtiene detalle por id (ENFOQUE_OBTENER) para traer metadata/id_version/updated_at
 * - Crea (ENFOQUES_CREAR), modifica (ENFOQUES_MODIFICAR) y apaga (ENFOQUES_APAGAR)
 */
export function useEnfoquesAdmin(session) {
    const [query, setQuery] = useState("");
    const [onlyActive, setOnlyActive] = useState(true);

    const [enfoques, setEnfoques] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Cache local para mitigar el delay de consistencia del backend (ej: Redis)
    // - Guarda creaciones/modificaciones confirmadas (status ok)
    // - En listar(), se hace merge y también se inyectan items que aún no aparecen
    const CACHE_KEY = "cm_terapia_enfoques_cache_v1";
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
    const upsertCache = (enfoque) => {
        if (!enfoque?.id) return;
        const cache = readCache();
        cache[String(enfoque.id)] = { ...enfoque, _cached_at: Date.now() };
        writeCache(cache);
    };
    const mergeListWithCache = (list, { onlyActivos = true } = {}) => {
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
                // si estamos listando solo activos, no inyectar inactivos
                if (onlyActivos && String(cached?.register_status || "").toLowerCase() === "inactivo") continue;
                injected.push(cached);
            }
        }

        return [...injected.sort((a, b) => (b?._cached_at || 0) - (a?._cached_at || 0)), ...Array.from(byId.values())];
    };

    const mapEnfoqueListRow = (r, { onlyActivos = true } = {}) => ({
        id: r.id_enfoque,
        nombre: r.nombre ?? "",
        descripcion: r.descripcion ?? "",
        estado: onlyActivos ? "Activo" : "",
        url: r.url ?? null,
        _raw: r,
    });

    const mapEnfoqueFromDb = (e) => {
        if (!e) return null;
        return {
            id: e.id_enfoque,
            nombre: e.nombre ?? "",
            descripcion: e.descripcion ?? "",
            metadata: e.metadata ?? null,
            created_at: e.created_at ?? null,
            updated_at: e.updated_at ?? null,
            id_version: e.id_version ?? null,
            id_archivo: e.id_archivo ?? null,
            // algunos endpoints (crear/modificar con archivo) devuelven url pública
            archivo_url: e.archivo_url ?? e.url ?? null,
            register_status: e.register_status ?? null,
            estado: e.register_status ?? "",
            _raw: e,
        };
    };

    const extractEnfoqueFromUploadFlow = (res) => {
        // Prioridad: link (ya asignado id_archivo) > create/update
        const enfoqueDb =
            res?.link?.rows?.[0]?.data?.enfoque ||
            res?.update?.rows?.[0]?.data?.enfoque ||
            res?.create?.rows?.[0]?.data?.enfoque ||
            res?.rows?.[0]?.data?.enfoque ||
            res?.rows?.[0]?.data ||
            null;

        const mapped = mapEnfoqueFromDb(enfoqueDb);
        const archivoUrl = res?.upload?.archivo_url || res?.upload?.uploadResult?.url || null;
        if (mapped && archivoUrl) mapped.archivo_url = archivoUrl;
        return mapped;
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

            const res = await createApiConn(TERAPIA_ENDPOINTS.ENFOQUES_LISTAR, payload, "POST", session);
            const rows = Array.isArray(res?.rows) ? res.rows : [];

            const mapped = rows.map((r) => mapEnfoqueListRow(r, { onlyActivos }));
            const merged = mergeListWithCache(mapped, { onlyActivos });
            setEnfoques(merged);

            // Mantener selección actual si sigue existiendo. Si no existe, no autoseleccionar.
            setSelectedId((prev) => {
                if (prev && merged.some((x) => x.id === prev)) return prev;
                return null;
            });
        } catch (e) {
            const msg = e?.data?.error || e?.message || "Error al listar enfoques";
            setError(msg);
            setEnfoques([]);
            setSelectedId(null);
        } finally {
            setIsLoading(false);
        }
    };

    const obtener = async (id_enfoque) => {
        if (!session?.id_sesion) throw new Error("Sesión inválida");
        if (!id_enfoque) throw new Error("ID de enfoque inválido");
        const payload = {
            p_id_sesion: session?.id_sesion,
            p_id_enfoque: id_enfoque,
            p_incluir_inactivos: 1,
        };
        // backend: PATCH /api/terapia/enfoque/obtener
        const res = await createApiConn(TERAPIA_ENDPOINTS.ENFOQUE_OBTENER, payload, "PATCH", session);
        const enfoqueDb = res?.rows?.[0]?.data?.enfoque || res?.rows?.[0]?.data || res?.enfoque;
        return { res, enfoque: mapEnfoqueFromDb(enfoqueDb) };
    };

    const crear = async (draft) => {
        if (!session?.id_sesion) throw new Error("Sesión inválida");
        const args = {
            p_actor_user_id: session?.user_id,
            p_id_sesion: session?.id_sesion,
            p_nombre: (draft?.nombre || "").trim(),
            p_descripcion: (draft?.descripcion || "").trim() || null,
            p_metadata: draft?.metadata ?? null,
        };

        const hasFile = Boolean(draft?._image_file);

        const res = hasFile
            ? await createApiConn(
                TERAPIA_ENDPOINTS.ENFOQUES_CREAR_CON_ARCHIVO,
                (() => {
                    const fd = new FormData();
                    fd.append("file", draft._image_file);
                    fd.append("args", JSON.stringify(args));
                    return fd;
                })(),
                "POST",
                session
            )
            : await createApiConn(TERAPIA_ENDPOINTS.ENFOQUES_CREAR, args, "POST", session);

        const mapped = hasFile ? extractEnfoqueFromUploadFlow(res) : mapEnfoqueFromDb(res?.rows?.[0]?.data?.enfoque);
        if (mapped?.id) {
            upsertCache(mapped);
            setEnfoques((prev) => [mapped, ...prev.filter((x) => x.id !== mapped.id)]);
            setSelectedId(mapped.id);
        }
        return { res, enfoque: mapped };
    };

    const modificar = async (draft) => {
        if (!session?.id_sesion) throw new Error("Sesión inválida");
        if (!draft?.id) throw new Error("No hay enfoque seleccionado");

        const original = draft?._original || {};
        const current = {
            nombre: (draft?.nombre || "").trim(),
            descripcion: (draft?.descripcion || "").trim(),
            metadata: draft?.metadata ?? null,
            register_status: draft?.register_status ?? null,
        };
        const base = {
            nombre: (original?.nombre || "").trim(),
            descripcion: (original?.descripcion || "").trim(),
            metadata: original?.metadata ?? null,
            register_status: original?.register_status ?? null,
        };

        const patch = {};
        for (const k of ["nombre", "descripcion", "metadata", "register_status"]) {
            if (JSON.stringify(current[k]) !== JSON.stringify(base[k])) patch[k] = current[k];
        }

        const payload = {
            p_actor_user_id: session?.user_id,
            p_id_sesion: session?.id_sesion,
            p_id_enfoque: draft.id,
            p_patch: patch,
        };

        const hasFile = Boolean(draft?._image_file);

        const res = hasFile
            ? await createApiConn(
                TERAPIA_ENDPOINTS.ENFOQUES_MODIFICAR_CON_ARCHIVO,
                (() => {
                    const fd = new FormData();
                    fd.append("file", draft._image_file);
                    fd.append("args", JSON.stringify(payload));
                    return fd;
                })(),
                "POST",
                session
            )
            : await createApiConn(TERAPIA_ENDPOINTS.ENFOQUES_MODIFICAR, payload, "POST", session);

        const mapped = hasFile ? extractEnfoqueFromUploadFlow(res) : mapEnfoqueFromDb(res?.rows?.[0]?.data?.enfoque);
        if (mapped?.id) {
            upsertCache(mapped);
            setEnfoques((prev) => prev.map((x) => (x.id === mapped.id ? { ...x, ...mapped } : x)));
        }
        return { res, enfoque: mapped };
    };

    const apagar = async (id_enfoque) => {
        if (!session?.id_sesion) throw new Error("Sesión inválida");
        if (!id_enfoque) throw new Error("ID de enfoque inválido");
        const payload = {
            p_actor_user_id: session?.user_id,
            p_id_sesion: session?.id_sesion,
            p_id_enfoque: id_enfoque,
        };
        const res = await createApiConn(TERAPIA_ENDPOINTS.ENFOQUES_APAGAR, payload, "POST", session);
        const enfoqueDb = res?.rows?.[0]?.data?.enfoque;
        const mapped = mapEnfoqueFromDb(enfoqueDb);
        if (mapped?.id) {
            upsertCache(mapped);
            // quitarlo del listado activo
            setEnfoques((prev) => prev.filter((x) => x.id !== mapped.id));
            setSelectedId((prev) => (prev === mapped.id ? null : prev));
        }
        return { res, enfoque: mapped };
    };

    useEffect(() => {
        if (session?.id_sesion) {
            listar({ onlyActivos: onlyActive });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.id_sesion, onlyActive]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return enfoques;
        return enfoques.filter((e) => [e.nombre, e.descripcion].join(" ").toLowerCase().includes(q));
    }, [enfoques, query]);

    const selected = useMemo(() => {
        if (!selectedId) return null;
        return filtered.find((e) => e.id === selectedId) || null;
    }, [filtered, selectedId]);

    // UI form state (panel derecho)
    const [draft, setDraft] = useState(null);

    // Cuando cambia selección, traer detalle (metadata/id_version/updated_at)
    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (!selectedId) {
                setDraft(null);
                return;
            }
            try {
                const { enfoque } = await obtener(selectedId);
                if (cancelled) return;
                const next = enfoque ? { ...enfoque, _original: { ...enfoque } } : null;
                setDraft(next);
            } catch (e) {
                // fallback: usar lo que vino del listado
                const fallback = selected ? { ...selected, _original: { ...selected } } : null;
                if (!cancelled) setDraft(fallback);
            }
        };
        run();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    const nuevoEnfoqueDraft = () => ({
        id: null,
        nombre: "",
        descripcion: "",
        metadata: { tags: [] },
        created_at: null,
        updated_at: null,
        id_version: null,
        register_status: "Activo",
        _original: null,
        _isNew: true,
    });

    return {
        query,
        setQuery,
        onlyActive,
        setOnlyActive,

        enfoques,
        filtered,
        selectedId,
        setSelectedId,
        selected,

        draft,
        setDraft,

        isLoading,
        error,
        actions: { listar, obtener, crear, modificar, apagar, nuevoEnfoqueDraft, mapEnfoqueFromDb, setEnfoques },
    };
}
