import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiConn } from "../../../../helpers/api_conn_factory";
import { API_URL } from "../../../../config/API_URL";
import { UI_ENDPOINTS } from "../../../../config/UI_ENDPOINTS";
import { FILE_SERVER_NAME } from "../../../../config/FILES_SERVER_NAMES";

function formatBytes(bytes) {
    const b = Number(bytes) || 0;
    if (b < 1024) return `${b} B`;
    const kb = b / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
}

/* =========================
   File index helpers
   (Backend returns a FLAT list of objectName/path)
   Goal: build folders/files client-side and minimize calls.
========================= */

function normalizePrefix(prefix) {
    const p = String(prefix || "").trim().replace(/^\/+/, "");
    if (!p) return "";
    return p.endsWith("/") ? p : `${p}/`;
}

function normalizeObjectPath(p) {
    // Conservative: normalize slashes and trim.
    // Backend already returns clean object names.
    return String(p || "").trim().replace(/^\/+/, "");
}

function deriveDirsAndFilesFromFlatItems(items, currentPrefix) {
    const prefixNorm = normalizePrefix(currentPrefix);
    const dirs = new Map();
    const files = [];

    for (const it of items) {
        const rawPath = it?.path || it?.objectName || "";
        const p = normalizeObjectPath(rawPath);
        if (!p) continue;

        // Only items under current prefix
        if (prefixNorm && !p.startsWith(prefixNorm)) continue;

        const rest = prefixNorm ? p.slice(prefixNorm.length) : p;
        if (!rest) continue;

        const hasSlash = rest.includes("/");

        if (hasSlash) {
            // Direct child folder is the first segment
            const seg = rest.split("/")[0];
            if (!seg) continue;
            const folderPath = `${prefixNorm}${seg}/`;
            if (!dirs.has(folderPath)) {
                dirs.set(folderPath, {
                    id: folderPath,
                    path: folderPath,
                    name: seg,
                });
            }
            continue;
        }

        // Direct file in current folder
        if (p.endsWith("/")) {
            // Edge-case: folder marker without nested segment (rare)
            const seg = rest.replace(/\/+$/, "");
            if (!seg) continue;
            const folderPath = `${prefixNorm}${seg}/`;
            if (!dirs.has(folderPath)) {
                dirs.set(folderPath, { id: folderPath, path: folderPath, name: seg });
            }
            continue;
        }

        const name = rest;
        files.push({
            id: p,
            path: p,
            name,
            size: formatBytes(it?.size),
            raw: it, // ✅ importante: aquí viene el path real del backend
        });
    }

    return {
        dirs: Array.from(dirs.values()).sort((a, b) => a.name.localeCompare(b.name)),
        files: files.sort((a, b) => a.name.localeCompare(b.name)),
    };
}

export function useVistasPublicasAdmin(session) {
    // ---------------- FORM (panel editor)
    const [selectedView, setSelectedView] = useState("Vista externa");

    // Estos campos se llenan al editar (pluma)
    const [title, setTitle] = useState(""); // lo usamos como "Código"
    const [description, setDescription] = useState(""); // lo usamos como "Valor"
    const [isVisible, setIsVisible] = useState(true);
    const [file, setFile] = useState(null);

    // guardar (panel editor)
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState("");

    // ---------------- UI ELEMENTS (tabla dinámica)
    const [uiComponents, setUiComponents] = useState([]);
    const [uiLoading, setUiLoading] = useState(false);
    const [uiError, setUiError] = useState("");

    const [uiLimit, setUiLimit] = useState(10);
    const [uiOffset, setUiOffset] = useState(0);
    const [uiHasNext, setUiHasNext] = useState(false);

    // elemento seleccionado para editar
    const [editingUiElement, setEditingUiElement] = useState(null);

    // ---------------- FILES (explorador de carpetas)
    const [filesPrefix, setFilesPrefix] = useState("");
    const [filesIndexItems, setFilesIndexItems] = useState([]); // flat list from backend
    const [selectedUploadDir, setSelectedUploadDir] = useState("");
    const [filesLoading, setFilesLoading] = useState(false);
    const [filesError, setFilesError] = useState("");

    // ---------------- FILES (tabla de archivos: descargar / eliminar)
    const [isDeletingFile, setIsDeletingFile] = useState(false);
    const [isDownloadingFile, setIsDownloadingFile] = useState(false);

    // Último guardado exitoso (para modal/toast)
    const [lastSaveOk, setLastSaveOk] = useState(null);

    // ---------------- ENDPOINT: LIST UI ELEMENTS
    // ---------------- ENDPOINT: LIST UI ELEMENTS
    const listUiComponents = useCallback(
        async ({ limit = uiLimit, offset = uiOffset } = {}) => {
            if (!session) return;

            setUiLoading(true);
            setUiError("");

            try {
                const payload = {
                    p_actor_user_id: session?.user_id ?? session?.id_usuario ?? session?.id ?? null,
                    p_id_sesion: session?.id_sesion ?? session?.session_id ?? session?.sesion_id ?? null,
                    p_limit: limit,
                    p_offset: offset,
                };

                const res = await createApiConn(UI_ENDPOINTS.UI_ELEMENTO_LISTAR, payload, "POST", session);

                const rows = Array.isArray(res?.rows) ? res.rows : [];

                const mapped = rows.map((r) => ({
                    id: r?.id_elemento ?? r?.id ?? null,
                    page: r?.nombre_pagina ?? "",
                    type: r?.tipo ?? "",
                    code: r?.metadata?.cod ?? "",
                    value: r?.valor ?? "",
                    link: r?.link ?? null,
                    raw: r,
                }));

                // ✅ Dedup por id (como todas son idénticas, nos quedamos con la primera)
                const deduped = [];
                const seenIds = new Set();

                for (const it of mapped) {
                    const id = it?.id;

                    // si llega algo raro sin id, lo dejamos pasar
                    if (id == null) {
                        deduped.push(it);
                        continue;
                    }

                    if (seenIds.has(id)) continue;
                    seenIds.add(id);
                    deduped.push(it);
                }

                setUiComponents(deduped);

                // 👇 pagination basada en lo que devuelve el backend (antes de dedupe)
                setUiHasNext(rows.length === limit);
                setUiLimit(limit);
                setUiOffset(offset);
            } catch (err) {
                console.error("[UI_ELEMENTO_LISTAR] error:", err);
                setUiComponents([]);
                setUiHasNext(false);
                setUiError("No se pudo cargar la lista de elementos UI.");
            } finally {
                setUiLoading(false);
            }
        },
        [session, uiLimit, uiOffset]
    );

    // ---------------- CLICK EDIT (pluma) => carga al panel
    const startEditUiElement = useCallback((row) => {
        setEditingUiElement(row || null);

        setTitle(row?.code ?? "");
        setDescription(row?.value ?? "");

        setFile(null);
        setIsVisible(true);
    }, []);

    const stopEditUiElement = useCallback(() => {
        setEditingUiElement(null);
        setTitle("");
        setDescription("");
        setIsVisible(true);
        setFile(null);
    }, []);

    // ---------------- FILES: SINGLE CALL (flat index)
    const refreshFilesIndex = useCallback(async () => {
        if (!session) return;
        setFilesLoading(true);
        setFilesError("");
        try {
            // IMPORTANT: backend already returns a FLAT list of ALL objects.
            // We keep only ONE call and build hierarchy client-side.
            const payload = { storage: FILE_SERVER_NAME };
            const res = await createApiConn(UI_ENDPOINTS.FILES_LIST, payload, "GET", session);
            const items = Array.isArray(res?.items) ? res.items : [];
            setFilesIndexItems(items);
        } catch (err) {
            console.error("[FILES_LIST] error (index):", err);
            setFilesIndexItems([]);
            setFilesError("No se pudo cargar la estructura de archivos.");
        } finally {
            setFilesLoading(false);
        }
    }, [session]);

    // Derived folders/files for the current prefix
    const { dirs: serverDirs, files: serverFiles } = useMemo(() => {
        const items = Array.isArray(filesIndexItems) ? filesIndexItems : [];
        return deriveDirsAndFilesFromFlatItems(items, filesPrefix);
    }, [filesIndexItems, filesPrefix]);

    // Backwards-compatible aliases (some components call listDirs/listFiles)
    const listDirs = useCallback(async () => refreshFilesIndex(), [refreshFilesIndex]);
    const listFiles = useCallback(async () => refreshFilesIndex(), [refreshFilesIndex]);

    // ✅ HARDENED: resolve correct object path even if UI passes a "mutated" row
    const resolveTargetPath = useCallback(
        (fileRow) => {
            // 1) Ideal: exact raw from backend
            const raw = fileRow?.raw;
            const direct = raw?.path || raw?.objectName;
            if (direct) return String(direct);

            // 2) If UI passed a fabricated object (no raw), we resolve from the true index
            const name = String(fileRow?.name || "").trim();
            if (!name) return "";

            const cur = normalizePrefix(filesPrefix);

            const hit = (filesIndexItems || []).find((it) => {
                const p = normalizeObjectPath(it?.path || it?.objectName || "");
                if (!p) return false;
                if (p.endsWith("/")) return false; // skip folder markers
                if (cur && !p.startsWith(cur)) return false;
                const rest = cur ? p.slice(cur.length) : p;
                return rest === name;
            });

            if (hit?.path || hit?.objectName) return String(hit.path || hit.objectName);

            // 3) Last fallback: accept only if it already looks "absolute" inside bucket
            // (avoid joining with current prefix here, because that's the bug)
            const candidate = String(fileRow?.path || fileRow?.id || "").trim();
            if (candidate && !candidate.endsWith("/")) return candidate;

            return "";
        },
        [filesPrefix, filesIndexItems]
    );

    const downloadFile = useCallback(
        async (fileRow) => {
            if (!session) return;

            const targetPath = resolveTargetPath(fileRow);
            if (!targetPath) return;

            setIsDownloadingFile(true);
            try {
                // Encode safely
                const qs =
                    `storage=${encodeURIComponent(FILE_SERVER_NAME)}` +
                    `&path=${encodeURIComponent(targetPath)}`;

                const url = `${API_URL}/${UI_ENDPOINTS.FILES_DOWNLOAD}?${qs}`;

                const r = await fetch(url, {
                    method: "GET",
                    headers: {
                        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                    },
                });

                if (!r.ok) {
                    const msg = await r.text().catch(() => "");
                    throw new Error(msg || `Error ${r.status}`);
                }

                const blob = await r.blob();
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = objectUrl;

                const fallbackName =
                    fileRow?.name ||
                    String(targetPath).split("/").pop() ||
                    "download.bin";

                a.download = fallbackName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(objectUrl);
            } finally {
                setIsDownloadingFile(false);
            }
        },
        [session, resolveTargetPath]
    );

    const deleteFile = useCallback(
        async (targetPath) => {
            if (!session) return;
            const p = String(targetPath || "");
            if (!p) return;

            setIsDeletingFile(true);
            try {
                const payload = { storage: FILE_SERVER_NAME, targetPath: p };
                await createApiConn(UI_ENDPOINTS.FILES_DELETE, payload, "DELETE", session);
                await refreshFilesIndex();
            } finally {
                setIsDeletingFile(false);
            }
        },
        [session, refreshFilesIndex]
    );

    // Navegación
    const openDir = useCallback(async (dirPath) => {
        const next = normalizePrefix(dirPath);
        setFilesPrefix(next);
    }, []);

    const goUpDir = useCallback(async () => {
        const cur = normalizePrefix(filesPrefix);
        if (!cur) {
            setFilesPrefix("");
            return;
        }
        const trimmed = cur.endsWith("/") ? cur.slice(0, -1) : cur;
        const parts = trimmed.split("/").filter(Boolean);
        parts.pop();
        const parent = parts.length ? `${parts.join("/")}/` : "";
        setFilesPrefix(parent);
    }, [filesPrefix]);

    const selectUploadDir = useCallback((dirPath) => {
        setSelectedUploadDir(String(dirPath || ""));
    }, []);

    // ---------------- SAVE (Guardar vista pública)
    const saveEditingUiElement = useCallback(async () => {
        if (!session) return { ok: false, error: "NO_SESSION" };
        if (!editingUiElement) return { ok: false, error: "NO_ELEMENT" };

        setSaveLoading(true);
        setSaveError("");

        try {
            const actorId = session?.user_id ?? session?.id_usuario ?? session?.id ?? null;
            const sesionId = session?.id_sesion ?? session?.session_id ?? session?.sesion_id ?? null;

            const raw = editingUiElement?.raw || {};
            const idElemento = raw?.id_elemento ?? editingUiElement?.id ?? null;
            const idPagina = raw?.id_pagina ?? null;
            const tipo = String(raw?.tipo ?? editingUiElement?.type ?? "").trim();

            const cod = String(title || raw?.metadata?.cod || editingUiElement?.code || "").trim();
            const valor = description ?? null;

            if (!actorId || !sesionId) throw new Error("Sesión inválida: falta p_actor_user_id o p_id_sesion.");
            if (!idElemento) throw new Error("No se encontró id_elemento del registro seleccionado.");
            if (!idPagina) throw new Error("No se encontró id_pagina del registro seleccionado.");
            if (!cod) throw new Error("El código (Título) es obligatorio.");

            const args = {
                p_actor_user_id: actorId,
                p_id_sesion: sesionId,
                p_id_elemento: idElemento,
                p_id_pagina: idPagina,
                p_cod_elemento: cod,
                p_tipo: tipo,
                p_valor: valor,
                p_metadata: raw?.metadata ?? {},
            };

            let res;

            // Si hay archivo seleccionado => endpoint nuevo
            if (file) {
                if (!selectedUploadDir) {
                    throw new Error("Selecciona una carpeta destino en el explorador de carpetas (botón USAR).");
                }

                const fd = new FormData();
                fd.append("file", file);
                fd.append(
                    "args",
                    JSON.stringify({
                        ...args,
                        storageKey: FILE_SERVER_NAME,
                        storage: FILE_SERVER_NAME,
                        targetDir: selectedUploadDir,
                    })
                );

                res = await createApiConn(UI_ENDPOINTS.UI_ELEMENTO_EDITAR_CON_ARCHIVO, fd, "POST", session);
            } else {
                res = await createApiConn(UI_ENDPOINTS.UI_ELEMENTO_EDITAR, args, "POST", session);
            }

            if (!res?.ok) {
                throw new Error(res?.message || "No se pudo guardar el elemento.");
            }

            setLastSaveOk({
                message: res?.message || "Cambios registrados con éxito.",
                data: res?.data || null,
            });

            await listUiComponents({ limit: uiLimit, offset: uiOffset });
            await refreshFilesIndex();
            stopEditUiElement();

            return res;
        } catch (err) {
            console.error("[UI_ELEMENTO_GUARDAR] error:", err);
            setSaveError(err?.message || "No se pudo guardar.");
            return { ok: false, error: "SAVE_FAILED", message: err?.message || "No se pudo guardar." };
        } finally {
            setSaveLoading(false);
        }
    }, [
        session,
        editingUiElement,
        title,
        description,
        file,
        selectedUploadDir,
        uiLimit,
        uiOffset,
        listUiComponents,
        refreshFilesIndex,
        stopEditUiElement,
    ]);

    // ---------------- INIT
    useEffect(() => {
        if (!session) return;
        refreshFilesIndex();
        listUiComponents({ limit: uiLimit, offset: 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    // ---------------- PAGINATION HELPERS UI
    const uiPage = useMemo(() => Math.floor(uiOffset / uiLimit) + 1, [uiOffset, uiLimit]);

    const uiNext = useCallback(() => {
        if (!uiHasNext || uiLoading) return;
        const nextOffset = uiOffset + uiLimit;
        listUiComponents({ limit: uiLimit, offset: nextOffset });
    }, [uiHasNext, uiLoading, uiOffset, uiLimit, listUiComponents]);

    const uiPrev = useCallback(() => {
        if (uiLoading) return;
        const prevOffset = Math.max(0, uiOffset - uiLimit);
        listUiComponents({ limit: uiLimit, offset: prevOffset });
    }, [uiLoading, uiOffset, uiLimit, listUiComponents]);

    const uiChangeLimit = useCallback(
        (nextLimit) => {
            const lim = Number(nextLimit) || 10;
            listUiComponents({ limit: lim, offset: 0 });
        },
        [listUiComponents]
    );

    return {
        // panel editor
        selectedView,
        setSelectedView,
        title,
        setTitle,
        description,
        setDescription,
        isVisible,
        setIsVisible,
        file,
        setFile,

        saveLoading,
        saveError,
        saveEditingUiElement,

        // ui table
        uiComponents,
        uiLoading,
        uiError,
        listUiComponents,
        uiLimit,
        uiOffset,
        uiHasNext,
        uiPage,
        uiNext,
        uiPrev,
        uiChangeLimit,

        // edit selection
        editingUiElement,
        startEditUiElement,
        stopEditUiElement,

        // files (explorador de carpetas)
        filesPrefix,
        serverDirs,
        selectedUploadDir,
        filesLoading,
        filesError,
        listDirs,

        // files (tabla)
        serverFiles,
        listFiles,
        isDeletingFile,
        isDownloadingFile,
        deleteFile,
        downloadFile,
        openDir,
        goUpDir,
        selectUploadDir,

        // éxito
        lastSaveOk,
        setLastSaveOk,
    };
}
