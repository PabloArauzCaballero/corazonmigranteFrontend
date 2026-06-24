import React, { useEffect, useMemo, useState } from "react";
import ActionResultModal from "../components/modals/ActionResultModal";
import { useCuentasAdmin } from "../hooks/useCuentasAdmin";
import { useTransaccionesAdmin } from "../hooks/useTransaccionesAdmin";
import { useProductosAdmin } from "../../../productos/admin/hooks/useProductosAdmin";
import PaginationControls from "../components/PaginationControls";

import { TERAPIA_ENDPOINTS } from "../../../../config/TERAPIA_ENDPOINTS";
import { createApiConn } from "../../../../helpers/api_conn_factory";

function normalizeEstado(v) {
    const s = (v ?? "")
        .toString()
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    if (s === "REALIZADO") return "REALIZADA";
    return s;
}

function money(n) {
    const v = Number(n) || 0;
    return v.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function computeTotals(movs) {
    let debe = 0;
    let haber = 0;
    for (const m of movs) {
        debe += Number(m.debe) || 0;
        haber += Number(m.haber) || 0;
    }
    return { debe, haber };
}

function buildEmptyDraft() {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);
    return {
        fecha: iso,
        tipo_transaccion: "",
        glosa: "",
        referencia_externa: "",
        metadata: {},
        cantidad: 1,
        id_producto: null,
        id_cita: null,
        movimientos: [
            { id_cuenta: null, debe: 0, haber: 0, descripcion: "" },
            { id_cuenta: null, debe: 0, haber: 0, descripcion: "" },
        ],
    };
}

function isVentaTipo(t) {
    return String(t || "").toUpperCase() === "VENTA";
}

function pickVentaCitaIdFromTransaccion(t) {
    const v = t?.venta;
    const id = v?.id_cita ?? v?.cita?.id_cita ?? null;
    if (id) return Number(id);

    const mid = t?.metadata?.id_cita ?? t?.metadata?.cita_id ?? null;
    if (mid) return Number(mid);

    return null;
}

function toTsFromCitaRaw(raw) {
    const fecha = raw?.fecha_programada ?? raw?.fecha ?? raw?.fecha_cita ?? "";
    const inicio = raw?.hora_inicio ?? raw?.inicio ?? raw?.hora_desde ?? "";
    if (!fecha) return 0;

    const iso = inicio
        ? `${String(fecha).slice(0, 10)}T${String(inicio).slice(0, 5)}`
        : `${String(fecha).slice(0, 10)}T00:00`;

    const ts = Date.parse(iso);
    return Number.isFinite(ts) ? ts : 0;
}

// ✅ label corto para cita en modo lectura (desde selected.venta.cita)
function shortVentaCitaLabel(venta) {
    const c = venta?.cita;
    const id = venta?.id_cita ?? c?.id_cita ?? null;

    if (!id) return "- Sin cita -";

    const fecha = c?.fecha_programada || "";
    const ini = c?.inicio ? String(c.inicio).slice(11, 16) : "";
    const fin = c?.fin ? String(c.fin).slice(11, 16) : "";
    const paciente = c?.paciente?.nombre_completo || c?.paciente?.nombre || "";
    const estado = c?.estado || "";

    const tramo = ini || fin ? `${ini}${ini && fin ? "-" : ""}${fin}` : "";
    const parts = [];
    if (fecha) parts.push(fecha);
    if (tramo) parts.push(tramo);
    if (paciente) parts.push(paciente);
    if (estado) parts.push(estado);

    return `#${id}${parts.length ? " — " + parts.join(" · ") : ""}`;
}

export default function TransaccionPage({ session }) {
    const [pageSize, setPageSize] = useState(50);
    const [offset, setOffset] = useState(0);

    const { rows: cuentas } = useCuentasAdmin(session, { autoFetch: true, limit: 200 });
    const cuentasById = useMemo(() => {
        const m = new Map();
        for (const c of cuentas) m.set(c.id_cuenta, c);
        return m;
    }, [cuentas]);

    const { productos, isLoading: isLoadingProductos, error: errorProductos } = useProductosAdmin(session);
    const productosActivos = useMemo(
        () => (productos || []).filter((p) => (p?.register_status || "Activo") === "Activo"),
        [productos]
    );

    const {
        transacciones,
        isLoading,
        error,
        fetchTransacciones,
        registrarBatch,
        registrarVenta,
        applyOptimisticCreatedTransaccion,
    } = useTransaccionesAdmin(session, { autoFetch: false, limit: pageSize });

    useEffect(() => {
        if (!session?.id_sesion) return;
        fetchTransacciones({ offset });
    }, [session?.id_sesion, offset, pageSize, fetchTransacciones]);

    const [query, setQuery] = useState("");
    const [activeId, setActiveId] = useState(null);
    const [draft, setDraft] = useState(buildEmptyDraft);
    const [isSaving, setIsSaving] = useState(false);

    // Modal resultado (reemplazo de alert)
    const [resultOpen, setResultOpen] = useState(false);
    const [resultKind, setResultKind] = useState("info");
    const [resultTitle, setResultTitle] = useState("");
    const [resultMessage, setResultMessage] = useState("");

    const showResult = (kind, message, title = "") => {
        setResultKind(kind || "info");
        setResultTitle(title || "");
        setResultMessage(message || "");
        setResultOpen(true);
    };

    const isReadOnly = !!activeId; // ✅ si estás viendo transacción existente → inmutable

    // ✅ Citas realizadas (se cargan 1 vez)
    const [citasRealizadas, setCitasRealizadas] = useState([]);
    const [isLoadingCitas, setIsLoadingCitas] = useState(false);
    const [errorCitas, setErrorCitas] = useState("");

    useEffect(() => {
        let alive = true;

        async function loadCitasRealizadas() {
            if (!session?.id_sesion) return;

            setIsLoadingCitas(true);
            setErrorCitas("");

            try {
                const payload = {
                    p_actor_user_id: session?.user_id,
                    p_id_sesion: session?.id_sesion,
                    p_limit: 500,
                    p_offset: 0,
                };

                const res = await createApiConn(
                    TERAPIA_ENDPOINTS.CITAS_SOLICITUDES_LISTAR,
                    payload,
                    "POST",
                    session
                );

                const rows =
                    (Array.isArray(res?.rows) ? res.rows : null) ??
                    (Array.isArray(res?.items) ? res.items : null) ??
                    (Array.isArray(res?.data?.rows) ? res.data.rows : null) ??
                    (Array.isArray(res?.data?.items) ? res.data.items : null) ??
                    [];

                const realizadas = (rows || [])
                    .filter((r) => normalizeEstado(r?.estado || r?.estado_cita || r?.register_status) === "REALIZADA")
                    .map((r) => {
                        const id = r?.id_cita ?? r?.cita_id ?? r?.id ?? null;

                        const fecha = r?.fecha_programada ?? r?.fecha ?? r?.fecha_cita ?? "";
                        const inicio = r?.hora_inicio ?? r?.inicio ?? r?.hora_desde ?? "";
                        const fin = r?.hora_fin ?? r?.fin ?? r?.hora_hasta ?? "";
                        const paciente = r?.paciente_nombre ?? r?.nombre_paciente ?? r?.paciente ?? r?.nombre ?? "";
                        const producto = r?.producto_nombre ?? r?.nombre_producto ?? r?.producto ?? "";

                        const parts = [];
                        if (fecha) parts.push(fecha);
                        if (inicio || fin) parts.push(`${inicio || ""}${inicio && fin ? "-" : ""}${fin || ""}`.trim());
                        if (paciente) parts.push(paciente);
                        if (producto) parts.push(producto);

                        return {
                            id: id ? Number(id) : null,
                            label: `#${id ?? "?"}${parts.length ? " — " + parts.join(" · ") : ""}`,
                            raw: r,
                        };
                    })
                    .filter((x) => x.id);

                if (!alive) return;
                const sorted = [...realizadas].sort((a, b) => toTsFromCitaRaw(b.raw) - toTsFromCitaRaw(a.raw));
                setCitasRealizadas(sorted);
            } catch (e) {
                if (!alive) return;
                setErrorCitas(e?.data?.error || e?.message || "Error al listar citas");
                setCitasRealizadas([]);
            } finally {
                if (!alive) return;
                setIsLoadingCitas(false);
            }
        }

        loadCitasRealizadas();
        return () => {
            alive = false;
        };
    }, [session?.id_sesion, session?.user_id]);

    // ✅ citas usadas = transacciones VENTA
    const usedCitaIds = useMemo(() => {
        const s = new Set();
        for (const t of transacciones || []) {
            if (!isVentaTipo(t?.tipo_transaccion)) continue;
            const idCita = pickVentaCitaIdFromTransaccion(t);
            if (idCita) s.add(idCita);
        }
        return s;
    }, [transacciones]);

    // ✅ citas realizadas NO usadas
    const citasRealizadasNoUsadas = useMemo(() => {
        return (citasRealizadas || [])
            .filter((c) => c?.id && !usedCitaIds.has(Number(c.id)))
            .sort((a, b) => toTsFromCitaRaw(b.raw) - toTsFromCitaRaw(a.raw));
    }, [citasRealizadas, usedCitaIds]);

    const flatLines = useMemo(() => {
        const q = query.trim().toLowerCase();
        const out = [];
        for (const t of transacciones) {
            for (const m of t.movimientos || []) {
                const line = {
                    id_transaccion: t.id_transaccion,
                    fecha: t.fecha,
                    glosa: t.glosa,
                    referencia_externa: t.referencia_externa,
                    cuenta_nombre: m.cuenta_nombre,
                    cuenta_codigo: m.cuenta_codigo,
                    debe: m.debe,
                    haber: m.haber,
                };
                if (!q) {
                    out.push(line);
                    continue;
                }
                const hay =
                    String(t.id_transaccion).includes(q) ||
                    (t.glosa || "").toLowerCase().includes(q) ||
                    (t.referencia_externa || "").toLowerCase().includes(q) ||
                    (m.cuenta_nombre || "").toLowerCase().includes(q) ||
                    (m.cuenta_codigo || "").toLowerCase().includes(q);
                if (hay) out.push(line);
            }
        }
        return out;
    }, [transacciones, query]);

    const selected = useMemo(() => {
        if (!activeId) return null;
        return transacciones.find((t) => t.id_transaccion === activeId) || null;
    }, [transacciones, activeId]);

    // ✅ AL SELECCIONAR, llenar también datos de venta (inmutable)
    useEffect(() => {
        if (!selected) return;

        const isVenta = isVentaTipo(selected.tipo_transaccion);
        const venta = selected?.venta;

        const selectedCantidad = isVenta ? Number(venta?.cantidad ?? 1) || 1 : 1;
        const selectedProdId = isVenta
            ? Number(venta?.id_producto ?? venta?.producto?.id_producto ?? null) || null
            : null;
        const selectedCitaId = isVenta
            ? Number(venta?.id_cita ?? venta?.cita?.id_cita ?? null) || null
            : null;

        setDraft({
            fecha: selected.fecha,
            tipo_transaccion: selected.tipo_transaccion,
            glosa: selected.glosa,
            referencia_externa: selected.referencia_externa,
            metadata: selected.metadata || {},
            cantidad: selectedCantidad,
            id_producto: selectedProdId,
            id_cita: selectedCitaId,
            movimientos: (selected.movimientos || []).map((m) => ({
                id_movimiento: m.id_movimiento ?? null,
                id_cuenta: m.id_cuenta,
                debe: m.debe,
                haber: m.haber,
                descripcion: m.descripcion || "",
            })),
        });
    }, [selected]);

    const totals = useMemo(() => computeTotals(draft.movimientos || []), [draft.movimientos]);
    const isBalanced = totals.debe > 0 && totals.debe === totals.haber;

    const onNew = () => {
        setActiveId(null);
        setDraft(buildEmptyDraft());
    };

    const onAddLine = () => {
        if (isReadOnly) return;
        setDraft((d) => ({
            ...d,
            movimientos: [...(d.movimientos || []), { id_cuenta: null, debe: 0, haber: 0, descripcion: "" }],
        }));
    };

    const onRemoveLine = (idx) => {
        if (isReadOnly) return;
        setDraft((d) => ({
            ...d,
            movimientos: (d.movimientos || []).filter((_, i) => i !== idx),
        }));
    };

    // ✅ MOD: bloquear selección de cuenta duplicada
    const onChangeMov = (idx, patch) => {
        if (isReadOnly) return;

        setDraft((d) => {
            // si se intenta setear id_cuenta => validar duplicado en otras filas
            if (Object.prototype.hasOwnProperty.call(patch || {}, "id_cuenta")) {
                const nextId = patch?.id_cuenta ? Number(patch.id_cuenta) : null;

                if (nextId) {
                    const duplicated = (d.movimientos || []).some(
                        (mm, i) => i !== idx && Number(mm?.id_cuenta) === nextId
                    );

                    if (duplicated) {
                        showResult(
                            "error",
                            "Esa cuenta ya está seleccionada en otra línea. Elige otra.",
                            "Cuenta duplicada"
                        );
                        return d; // no aplicar cambio
                    }
                }
            }

            const next = [...(d.movimientos || [])];
            next[idx] = { ...next[idx], ...patch };
            return { ...d, movimientos: next };
        });
    };

    const onSave = async () => {
        if (isReadOnly) return; // ✅ no permitir modificar transacciones existentes

        if (isSaving) return;
        if (!session?.id_sesion) {
            showResult("error", "Sesión inválida (id_sesion faltante)", "Ocurrió un problema");
            return;
        }
        if (!draft?.fecha) {
            showResult("error", "Fecha es requerida", "Ocurrió un problema");
            return;
        }
        if (!draft?.tipo_transaccion) {
            showResult("error", "Tipo de documento / tipo_transaccion es requerido", "Ocurrió un problema");
            return;
        }

        const isVenta = isVentaTipo(draft.tipo_transaccion);
        if (isVenta) {
            if (!draft?.id_producto) {
                showResult("error", "Para una VENTA debes seleccionar un producto (id_producto)", "Ocurrió un problema");
                return;
            }
            const cant = Number(draft?.cantidad);
            if (!Number.isFinite(cant) || cant <= 0) {
                showResult("error", "Para una VENTA la cantidad debe ser mayor a 0", "Ocurrió un problema");
                return;
            }
            if (draft.id_cita && usedCitaIds.has(Number(draft.id_cita))) {
                showResult("error", "Esa cita ya está usada en una transacción de venta. Selecciona otra.", "Ocurrió un problema");
                return;
            }
        }

        const movsRaw = (draft.movimientos || [])
            .filter((m) => m.id_cuenta)
            .map((m) => ({
                id_cuenta: Number(m.id_cuenta) || null,
                debe: Number(m.debe) || 0,
                haber: Number(m.haber) || 0,
                descripcion: (m.descripcion || "").trim() || null,
            }))
            .filter((m) => m.id_cuenta);

        const seen = new Set();
        const movs = [];
        for (const m of movsRaw) {
            const key = `${m.id_cuenta}|${m.debe}|${m.haber}|${m.descripcion || ""}`;
            if (seen.has(key)) continue;
            seen.add(key);
            movs.push(m);
        }

        if (movs.length < 2) {
            showResult("error", "Debes registrar al menos 2 movimientos (con cuenta)", "Ocurrió un problema");
            return;
        }

        const { debe, haber } = computeTotals(movs);

        if (debe !== haber) {
            showResult("error", "El asiento no está balanceado (Debe debe ser igual a Haber)", "Ocurrió un problema");
            return;
        }
        if (debe <= 0) {
            showResult("error", "El total debe/haber debe ser mayor a 0", "Ocurrió un problema");
            return;
        }

        setIsSaving(true);
        try {
            const payloadTransaccion = {
                fecha: draft.fecha,
                tipo_transaccion: draft.tipo_transaccion,
                glosa: draft.glosa,
                referencia_externa: draft.referencia_externa,
                metadata: draft.metadata || {},
                movimientos: movs,
            };

            let id_transaccion = null;
            let created_at = new Date().toISOString();
            let register_status = "Activo";
            let movimientos_ids = [];

            if (isVenta) {
                const res = await registrarVenta({
                    fecha: payloadTransaccion.fecha,
                    glosa: payloadTransaccion.glosa,
                    referencia_externa: payloadTransaccion.referencia_externa,
                    metadata: payloadTransaccion.metadata,
                    movimientos: payloadTransaccion.movimientos,
                    cantidad: Number(draft.cantidad) || 0,
                    id_producto: Number(draft.id_producto) || null,
                    id_cita: draft.id_cita ? Number(draft.id_cita) : null,
                });
                id_transaccion = res?.data?.id_transaccion || null;
                if (!id_transaccion) throw new Error(res?.message || "No se pudo registrar la transacción de venta");
            } else {
                const res = await registrarBatch({ transacciones: [payloadTransaccion], stopOnError: false });
                const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
                const first = Array.isArray(r0?.data?.results) ? r0.data.results[0] : null;
                if (!first || String(first.status).toLowerCase() !== "ok") {
                    throw new Error(first?.message || r0?.message || "No se pudo registrar la transacción");
                }
                const t = first.data?.transaccion || {};
                id_transaccion = first.data?.id_transaccion || t.id_transaccion;
                created_at = t.created_at || created_at;
                register_status = t.register_status || register_status;
                movimientos_ids = first.data?.movimientos_ids || [];
            }

            const movimientosOptimistas = payloadTransaccion.movimientos.map((m, idx) => {
                const c = cuentasById.get(m.id_cuenta) || {};
                return {
                    id_movimiento: movimientos_ids[idx] || null,
                    id_cuenta: m.id_cuenta,
                    cuenta_codigo: c.codigo || "",
                    cuenta_nombre: c.nombre || "",
                    descripcion: m.descripcion || "",
                    debe: Number(m.debe) || 0,
                    haber: Number(m.haber) || 0,
                };
            });

            const newTrans = {
                id_transaccion,
                fecha: payloadTransaccion.fecha,
                tipo_transaccion: payloadTransaccion.tipo_transaccion,
                glosa: payloadTransaccion.glosa,
                referencia_externa: payloadTransaccion.referencia_externa,
                created_at,
                register_status,
                metadata: payloadTransaccion.metadata || {},
                movimientos: movimientosOptimistas,
                total_debe: debe,
                total_haber: haber,
            };

            applyOptimisticCreatedTransaccion(newTrans);

            setOffset(0);
            fetchTransacciones({ offset: 0 });
            onNew();
        } catch (e) {
            showResult("error", e?.message || "Error al guardar asiento", "Ocurrió un problema");
        } finally {
            setIsSaving(false);
        }
    };

    // ✅ para modo lectura: tomar la venta del seleccionado
    const selectedVenta = selected?.venta || null;

    // ✅ para modo lectura: construir label de cita desde el JSON que ya traes
    const selectedVentaCitaLabel = useMemo(() => {
        if (!selectedVenta) return "";
        return shortVentaCitaLabel(selectedVenta);
    }, [selectedVenta]);

    return (
        <main className="flex-grow p-0 max-w-screen-2xl mx-auto w-full">
            {/* ✅ Modal resultado */}
            <ActionResultModal
                open={resultOpen}
                kind={resultKind}
                title={resultTitle}
                message={resultMessage}
                onClose={() => setResultOpen(false)}
            />

            <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span>Inicio</span>
                    <span className="material-icons text-xs">chevron_right</span>
                    <span>Contabilidad</span>
                    <span className="material-icons text-xs">chevron_right</span>
                    <span className="text-primary font-medium">Transacciones</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Transacciones</h2>
                {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-full">
                {/* LISTADO IZQUIERDA */}
                <section className="lg:col-span-4 flex flex-col gap-4 h-full">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-8rem)] sticky top-24">
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-rose-50/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">menu_book</span>
                                <h2 className="text-xl font-semibold text-slate-800">Libro Diario</h2>
                            </div>
                            <button
                                onClick={onNew}
                                className="text-xs bg-white border border-primary text-primary px-3 py-1.5 rounded-md hover:bg-primary hover:text-white transition-all font-medium flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[14px]">add</span> Nuevo
                            </button>
                        </div>

                        <div className="p-4 bg-white border-b border-slate-200">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">
                                    search
                                </span>
                                <input
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow placeholder-slate-400"
                                    placeholder="Buscar asiento, código o cuenta..."
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 text-xs">
                                    <tr>
                                        <th className="px-3 py-3 font-medium">Fecha</th>
                                        <th className="px-3 py-3 font-medium">Cuenta</th>
                                        <th className="px-2 py-3 font-medium text-right text-emerald-600">Debe</th>
                                        <th className="px-2 py-3 font-medium text-right text-blue-600">Haber</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200">
                                    {isLoading ? (
                                        <tr>
                                            <td className="px-3 py-6 text-slate-500" colSpan={4}>
                                                Cargando...
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td className="px-3 py-6 text-red-600" colSpan={4}>
                                                {error}
                                            </td>
                                        </tr>
                                    ) : flatLines.length === 0 ? (
                                        <tr>
                                            <td className="px-3 py-6 text-slate-500" colSpan={4}>
                                                Sin transacciones
                                            </td>
                                        </tr>
                                    ) : (
                                        flatLines.map((r, idx) => (
                                            <tr
                                                key={`${r.id_transaccion}-${idx}`}
                                                onClick={() => setActiveId(r.id_transaccion)}
                                                className={`group hover:bg-rose-50 transition-colors cursor-pointer border-l-4 ${activeId === r.id_transaccion
                                                        ? "border-primary bg-rose-50/40"
                                                        : "border-transparent hover:border-primary"
                                                    }`}
                                            >
                                                <td className="px-3 py-3 align-top whitespace-nowrap">
                                                    <div className="text-slate-900 font-medium">{r.fecha?.slice(5) || ""}</div>
                                                    <div className="text-xs text-slate-400">#{r.id_transaccion}</div>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="text-slate-800 font-medium text-xs sm:text-sm">{r.cuenta_nombre || "—"}</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{r.cuenta_codigo || ""}</div>
                                                </td>
                                                <td className="px-2 py-3 align-top text-right">
                                                    <div className="text-emerald-700 font-bold text-xs sm:text-sm">
                                                        {r.debe ? money(r.debe) : "-"}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3 align-top text-right">
                                                    <div className="text-blue-700 font-bold text-xs sm:text-sm">
                                                        {r.haber ? money(r.haber) : "-"}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-xl space-y-3">
                            <PaginationControls
                                offset={offset}
                                limit={pageSize}
                                count={transacciones.length}
                                isLoading={isLoading}
                                onPrev={() => setOffset((o) => Math.max(0, o - pageSize))}
                                onNext={() => setOffset((o) => o + pageSize)}
                                onLimitChange={(n) => {
                                    setPageSize(n);
                                    setOffset(0);
                                }}
                            />
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{flatLines.length} líneas (en esta página)</span>
                                <button
                                    onClick={() => fetchTransacciones({ offset })}
                                    className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-all font-medium disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    Refrescar
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* DETALLE DERECHA */}
                <section className="lg:col-span-8 flex flex-col gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-200 bg-rose-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">description</span>
                                <h2 className="text-xl font-semibold text-slate-800">Datos de la Transacción</h2>
                            </div>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                {activeId ? `#${activeId} (solo lectura)` : "DRAFT-NEW"}
                            </span>
                        </div>

                        <div className="p-6">
                            <form className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                <div className="md:col-span-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Fecha <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        className="w-full rounded-md border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 text-sm py-2 disabled:bg-slate-50"
                                        type="date"
                                        value={draft.fecha}
                                        disabled={isReadOnly}
                                        onChange={(e) => setDraft((d) => ({ ...d, fecha: e.target.value }))}
                                    />
                                </div>

                                <div className="md:col-span-8">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tipo de transaccion <span className="text-primary">*</span>
                                    </label>
                                    <select
                                        value={draft.tipo_transaccion}
                                        disabled={isReadOnly}
                                        onChange={(e) => setDraft((d) => ({ ...d, tipo_transaccion: e.target.value }))}
                                        className="w-full rounded-md border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 text-sm py-2 disabled:bg-slate-50"
                                    >
                                        <option value="">- Seleccionar -</option>
                                        <option value="VENTA">VENTA</option>
                                        <option value="INGRESO">INGRESO</option>
                                        <option value="AJUSTE">AJUSTE</option>
                                        <option value="EGRESO">EGRESO</option>
                                        <option value="DEPRECIACION">DEPRECIACION</option>
                                        <option value="GESTION DE ACTIVOS">GESTION DE ACTIVOS</option>
                                        <option value="GESTION DE PASIVOS">GESTION DE PASIVOS</option>
                                        <option value="GESTION DE PATRIMONIO">GESTION DE PATRIMONIO</option>
                                    </select>
                                </div>

                                {/* ✅ Mostrar bloque VENTA también en modo lectura */}
                                {isVentaTipo(draft.tipo_transaccion) ? (
                                    <>
                                        <div className="md:col-span-6">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Producto <span className="text-primary">*</span>
                                            </label>

                                            <select
                                                value={draft.id_producto || ""}
                                                disabled={isReadOnly}
                                                onChange={(e) =>
                                                    setDraft((d) => ({
                                                        ...d,
                                                        id_producto: e.target.value ? Number(e.target.value) : null,
                                                    }))
                                                }
                                                className="w-full rounded-md border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 text-sm py-2 disabled:bg-slate-50"
                                            >
                                                <option value="">- Seleccionar producto -</option>

                                                {/* ✅ En lectura, asegurar que el producto aparezca aunque no esté en productosActivos */}
                                                {isReadOnly && selectedVenta?.producto?.id_producto ? (
                                                    <option value={Number(selectedVenta.producto.id_producto)}>
                                                        {selectedVenta.producto.nombre}
                                                    </option>
                                                ) : null}

                                                {(productosActivos || []).map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nombre} {p.precio ? `— ${p.precio} ${p.moneda || ""}` : ""}
                                                    </option>
                                                ))}
                                            </select>

                                            {isLoadingProductos ? (
                                                <p className="text-xs text-slate-400 mt-1">Cargando productos...</p>
                                            ) : null}
                                            {errorProductos ? <p className="text-xs text-red-600 mt-1">{errorProductos}</p> : null}
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Cantidad <span className="text-primary">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                disabled={isReadOnly}
                                                className="w-full rounded-md border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 text-sm py-2 disabled:bg-slate-50"
                                                value={draft.cantidad ?? 1}
                                                onChange={(e) =>
                                                    setDraft((d) => ({
                                                        ...d,
                                                        cantidad: e.target.value === "" ? "" : Number(e.target.value),
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Cita realizada (opcional)
                                            </label>

                                            {/* ✅ Modo lectura: mostrar la cita exacta de la venta, bloqueado */}
                                            {isReadOnly ? (
                                                <select
                                                    value={draft.id_cita ?? ""}
                                                    disabled
                                                    className="w-full rounded-md border-slate-300 bg-white text-slate-900 shadow-sm text-sm py-2 disabled:bg-slate-50"
                                                >
                                                    <option value={draft.id_cita ?? ""}>
                                                        {selectedVentaCitaLabel || "- Sin cita -"}
                                                    </option>
                                                </select>
                                            ) : (
                                                <select
                                                    value={draft.id_cita ?? ""}
                                                    onChange={(e) =>
                                                        setDraft((d) => ({
                                                            ...d,
                                                            id_cita: e.target.value ? Number(e.target.value) : null,
                                                        }))
                                                    }
                                                    className="w-full rounded-md border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 text-sm py-2"
                                                >
                                                    <option value="">- Sin cita (o ya facturada) -</option>
                                                    {(citasRealizadasNoUsadas || []).map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {!isReadOnly ? (
                                                <>
                                                    {isLoadingCitas ? (
                                                        <p className="text-xs text-slate-400 mt-1">Cargando citas realizadas...</p>
                                                    ) : null}
                                                    {errorCitas ? <p className="text-xs text-red-600 mt-1">{errorCitas}</p> : null}
                                                    {!isLoadingCitas && !errorCitas ? (
                                                        <p className="text-[11px] text-slate-500 mt-1">
                                                            Mostrando {citasRealizadasNoUsadas.length} citas realizadas no usadas.
                                                        </p>
                                                    ) : null}
                                                </>
                                            ) : null}
                                        </div>
                                    </>
                                ) : null}

                                <div className="md:col-span-12">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Concepto / Descripción</label>
                                    <input
                                        className="w-full rounded-md border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 text-sm py-2 placeholder-slate-400 disabled:bg-slate-50"
                                        placeholder="Ej: Registro de donación en efectivo evento anual..."
                                        type="text"
                                        value={draft.glosa}
                                        disabled={isReadOnly}
                                        onChange={(e) => setDraft((d) => ({ ...d, glosa: e.target.value }))}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Movimientos */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-grow flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-200 bg-rose-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">table_chart</span>
                                <h2 className="text-xl font-semibold text-slate-800">Movimientos Contables</h2>
                            </div>
                            <button
                                disabled={isReadOnly}
                                className="text-sm bg-white border border-primary/20 text-primary shadow-sm hover:bg-rose-50 transition-all px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">playlist_add</span> Importar Plantilla
                            </button>
                        </div>

                        <div className="p-0 overflow-x-auto flex-1 relative min-h-[300px]">
                            <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3.5 border-r border-slate-200 w-32">Código</th>
                                        <th className="px-4 py-3.5 border-r border-slate-200">Cuenta Contable</th>
                                        <th className="px-4 py-3.5 w-48 text-right border-r border-slate-200 bg-emerald-50/80 text-emerald-800">
                                            <div className="flex flex-col">
                                                <span className="uppercase tracking-wider text-xs">Debe</span>
                                                <span className="text-[10px] font-normal opacity-70">(Débito)</span>
                                            </div>
                                        </th>
                                        <th className="px-4 py-3.5 w-48 text-right border-r border-slate-200 bg-blue-50/80 text-blue-800">
                                            <div className="flex flex-col">
                                                <span className="uppercase tracking-wider text-xs">Haber</span>
                                                <span className="text-[10px] font-normal opacity-70">(Crédito)</span>
                                            </div>
                                        </th>
                                        <th className="px-2 py-3.5 w-12 text-center"></th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200">
                                    {(draft.movimientos || []).map((m, idx) => {
                                        const c = m.id_cuenta ? cuentasById.get(m.id_cuenta) : null;
                                        const rowKey =
                                            m.id_movimiento ??
                                            `${m.id_cuenta ?? "null"}-${String(m.debe ?? "")}-${String(m.haber ?? "")}-${idx}`;

                                        // ✅ MOD: filtrar opciones para evitar cuentas duplicadas en otras filas
                                        const takenByOthers = new Set(
                                            (draft.movimientos || [])
                                                .map((mm, i) => (i !== idx ? Number(mm?.id_cuenta) || null : null))
                                                .filter(Boolean)
                                        );

                                        const availableCuentas = (cuentas || []).filter((cc) => {
                                            const id = Number(cc.id_cuenta);
                                            // Mantener la cuenta actual visible (si es la elegida)
                                            if (m?.id_cuenta && Number(m.id_cuenta) === id) return true;
                                            // Ocultar si ya está tomada por otra fila
                                            return !takenByOthers.has(id);
                                        });

                                        return (
                                            <tr key={rowKey} className="group hover:bg-rose-50/30 transition-colors">
                                                <td className="px-4 py-3 border-r border-slate-200 align-top font-mono text-sm text-slate-800">
                                                    {c?.codigo || "—"}
                                                </td>
                                                <td className="p-0 border-r border-slate-200 align-top relative">
                                                    <select
                                                        value={m.id_cuenta || ""}
                                                        disabled={isReadOnly}
                                                        onChange={(e) =>
                                                            onChangeMov(idx, { id_cuenta: e.target.value ? Number(e.target.value) : null })
                                                        }
                                                        className="w-full h-full text-sm border-0 bg-transparent px-4 py-3 pr-8 focus:bg-white focus:ring-inset focus:ring-2 focus:ring-primary transition-all text-slate-800 font-medium truncate disabled:bg-slate-50"
                                                    >
                                                        <option value="">- Seleccionar cuenta -</option>

                                                        {(availableCuentas || []).map((cc) => (
                                                            <option key={cc.id_cuenta} value={cc.id_cuenta}>
                                                                {cc.codigo} — {cc.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span className="absolute right-2 top-3 pointer-events-none text-slate-400">
                                                        <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                                    </span>
                                                </td>
                                                <td className="p-0 border-r border-slate-200 align-top bg-emerald-50/10">
                                                    <input
                                                        value={m.debe}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => onChangeMov(idx, { debe: e.target.value })}
                                                        className="w-full h-full text-right font-medium text-emerald-800 border-0 bg-transparent px-4 py-3 focus:bg-white focus:ring-inset focus:ring-2 focus:ring-emerald-600 transition-all placeholder-slate-300 disabled:bg-slate-50"
                                                        placeholder="0.00"
                                                    />
                                                </td>
                                                <td className="p-0 border-r border-slate-200 align-top bg-blue-50/10">
                                                    <input
                                                        value={m.haber}
                                                        disabled={isReadOnly}
                                                        onChange={(e) => onChangeMov(idx, { haber: e.target.value })}
                                                        className="w-full h-full text-right text-blue-800 border-0 bg-transparent px-4 py-3 focus:bg-white focus:ring-inset focus:ring-2 focus:ring-blue-600 transition-all placeholder-slate-300 disabled:bg-slate-50"
                                                        placeholder="0.00"
                                                    />
                                                </td>
                                                <td className="p-0 text-center align-middle">
                                                    <button
                                                        onClick={() => onRemoveLine(idx)}
                                                        disabled={isReadOnly}
                                                        className="w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
                                                        title="Eliminar línea"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                                <tfoot className="bg-white border-t-2 border-slate-200 sticky bottom-0 z-10">
                                    <tr>
                                        <td className="p-3" colSpan="5">
                                            <button
                                                type="button"
                                                onClick={onAddLine}
                                                disabled={isReadOnly}
                                                className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-primary hover:border-primary hover:bg-rose-50 transition-all flex justify-center items-center gap-2 group disabled:opacity-50"
                                            >
                                                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                                                    add_circle
                                                </span>
                                                <span className="font-medium text-sm">Agregar Línea</span>
                                            </button>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
                            <div className="text-xs text-slate-500 italic">
                                {isReadOnly ? "* Transacción inmutable (solo lectura)." : "* Todos los cambios se guardan automáticamente en borrador."}
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={onNew}
                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium transition-colors text-sm"
                                >
                                    {isReadOnly ? "Volver a nuevo" : "Cancelar"}
                                </button>

                                {!isReadOnly ? (
                                    <button
                                        onClick={onSave}
                                        disabled={isSaving || !isBalanced}
                                        className={`flex-1 sm:flex-none px-8 py-2.5 rounded-lg ${isSaving || !isBalanced ? "bg-slate-300" : "bg-primary hover:bg-[#5a2634]"
                                            } text-white shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all font-semibold flex items-center justify-center gap-2 text-sm`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">save</span> Guardar Asiento
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
