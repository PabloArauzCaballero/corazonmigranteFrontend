// src/modules/contabilidad/admin/pages/CuentaPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useCuentasAdmin } from "../hooks/useCuentasAdmin";
import { useGruposCuentaAdmin } from "../hooks/useGruposCuentaAdmin";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import ActionResultModal from "../components/modals/ActionResultModal";
import MetadataKeyValueTable from "../components/MetadataKeyValueTable";
import PaginationControls from "../components/PaginationControls";

const EMPTY_FORM = {
  id_cuenta: null,
  codigo: "",
  nombre: "",
  id_grupo_cuenta: "", // select-friendly
  tipo_cuenta: "",
  sub_tipo: "",
  categoria: "",
  moneda: "BOB",
  metadata: {},
  register_status: "Activo",
};

// ✅ helper: devuelve number válido o undefined (para omitir)
function normalizeOptionalId(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

export default function CuentaPage({ session }) {
  const [pageSize, setPageSize] = useState(50);
  const [offset, setOffset] = useState(0);

  const { rows, isLoading, error, fetchCuentas, crearCuenta, editarCuenta, apagarCuenta } =
    useCuentasAdmin(session, { autoFetch: false, limit: pageSize });

  const { rows: grupos } = useGruposCuentaAdmin(session);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");

  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [metadataTouched, setMetadataTouched] = useState(false);
  const [grupoTouched, setGrupoTouched] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    if (!session?.id_sesion) return;
    fetchCuentas({ offset });
  }, [session?.id_sesion, offset, pageSize, fetchCuentas]);

  const filteredRows = useMemo(() => {
    let data = [...rows];

    if (filter === "activo") data = data.filter((r) => String(r.tipo_cuenta).toUpperCase().includes("ACTIVO"));
    if (filter === "pasivo") data = data.filter((r) => String(r.tipo_cuenta).toUpperCase().includes("PASIVO"));

    const q = query.trim().toLowerCase();
    if (q) {
      data = data.filter(
        (r) =>
          String(r.codigo || "").toLowerCase().includes(q) ||
          String(r.nombre || "").toLowerCase().includes(q) ||
          String(r.grupo_cuenta_nombre || "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [rows, query, filter]);

  const tipoCuentaOptions = useMemo(() => {
    const set = new Set(["BALANCE GENERAL", "ESTADO DE RESULTADOS"]);
    for (const r of rows) if (r.tipo_cuenta) set.add(String(r.tipo_cuenta));
    return Array.from(set);
  }, [rows]);

  const subTipoOptions = useMemo(() => {
    const set = new Set(["ACTIVO", "PASIVO", "PATRIMONIO", "INGRESOS", "GASTOS"]);
    for (const r of rows) if (r.sub_tipo) set.add(String(r.sub_tipo));
    return Array.from(set);
  }, [rows]);

  const categoriaOptions = useMemo(() => {
    const set = new Set(["CORRIENTE", "NO_CORRIENTE", "ORDINARIO", "NO_ORDINARIO"]);
    for (const r of rows) if (r.categoria) set.add(String(r.categoria));
    return Array.from(set);
  }, [rows]);

  const monedaOptions = useMemo(() => {
    const set = new Set(["BOB", "USD", "EUR", "COP"]);
    for (const r of rows) if (r.moneda) set.add(String(r.moneda));
    return Array.from(set);
  }, [rows]);

  const startCreate = () => {
    setActiveId(null);
    setForm(EMPTY_FORM);
    setMetadataTouched(false);
    setGrupoTouched(false);
  };

  const startEdit = (row) => {
    setActiveId(row.id_cuenta);
    setMetadataTouched(false);
    setGrupoTouched(false);

    setForm({
      id_cuenta: row.id_cuenta,
      codigo: row.codigo ?? "",
      nombre: row.nombre ?? "",
      id_grupo_cuenta: row.id_grupo_cuenta ? String(row.id_grupo_cuenta) : "",
      tipo_cuenta: row.tipo_cuenta ?? "",
      sub_tipo: row.sub_tipo ?? "",
      categoria: row.categoria ?? "",
      moneda: row.moneda ?? "BOB",
      metadata: row.metadata ?? {},
      register_status: row.register_status ?? "Activo",
    });
  };

  const onSave = async () => {
    if (!session?.id_sesion) {
      showResult("error", "Sesión inválida: falta id_sesion", "Ocurrió un problema");
      return;
    }
    if (!form.codigo || !form.nombre) {
      showResult("error", "Código y Nombre son obligatorios", "Ocurrió un problema");
      return;
    }

    setSaving(true);
    try {
      const grupoId = normalizeOptionalId(form.id_grupo_cuenta); // undefined si está vacío

      const payload = {
        id_cuenta: form.id_cuenta,
        codigo: form.codigo,
        nombre: form.nombre,
        tipo_cuenta: form.tipo_cuenta,
        sub_tipo: form.sub_tipo,
        categoria: form.categoria,
        moneda: form.moneda,
        register_status: form.register_status,
        metadata: form.id_cuenta ? (metadataTouched ? form.metadata ?? {} : undefined) : form.metadata ?? {},
      };

      // ✅ Regla: si está nulo/vacío => NO mandar NADA
      // Solo se manda si hay id válido.
      if (!form.id_cuenta) {
        // creando: solo si hay grupoId
        if (grupoId !== undefined) payload.id_grupo_cuenta = grupoId;
      } else {
        // editando: solo si lo tocó + id válido
        if (grupoTouched && grupoId !== undefined) payload.id_grupo_cuenta = grupoId;
        // si lo tocó y lo dejó vacío => NO se manda (tal cual pediste)
      }

      if (form.id_cuenta) await editarCuenta(payload);
      else await crearCuenta(payload);

      await fetchCuentas({ offset });
      startCreate();
    } catch (e) {
      console.error(e);

      showResult("error", e?.message || "Error al guardar", "Ocurrió un problema");
    } finally {
      setSaving(false);
    }
  };

  const onAskDelete = (row) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apagarCuenta(deleteTarget);
      await fetchCuentas({ offset });
      if (activeId === deleteTarget.id_cuenta) startCreate();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);

      showResult("error", e?.message || "Error al eliminar", "Ocurrió un problema");
    } finally {
      setDeleting(false);
    }
  };

  const statusBadge = (form.register_status || "Activo") === "Activo" ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      Inactivo
    </span>
  );

  return (
    <>
      <ActionResultModal
        open={resultOpen}
        kind={resultKind}
        title={resultTitle}
        message={resultMessage}
        onClose={() => setResultOpen(false)}
      />

      <main className="p-0 max-w-[1920px] mx-auto w-full">
        {/* HEADER */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span>Inicio</span>
              <span className="material-icons text-xs">chevron_right</span>
              <span>Contabilidad</span>
              <span className="material-icons text-xs">chevron_right</span>
              <span className="text-primary font-medium">Plan de Cuentas</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Plan de Cuentas</h2>
            {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition flex items-center gap-2 shadow-sm text-sm font-medium"
              onClick={() => window.print()}
            >
              <span className="material-icons text-lg">print</span> Imprimir
            </button>
            <button
              type="button"
              className="bg-primary hover:bg-[#5a1b28] text-white px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2 text-sm font-medium"
              onClick={startCreate}
            >
              <span className="material-icons text-lg">add</span> Nueva Cuenta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LISTADO */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-250px)] min-h-[600px]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-primary">format_list_bulleted</span>
                  <h3 className="text-lg font-semibold text-gray-800">Listado de Cuentas</h3>
                </div>

                <button
                  type="button"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white"
                  onClick={() => fetchCuentas({ offset })}
                  disabled={isLoading}
                >
                  {isLoading ? "Cargando..." : "Refrescar"}
                </button>
              </div>

              <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10 space-y-3">
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                    search
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                    placeholder="Buscar cuenta o grupo..."
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFilter("todos")}
                    className={[
                      "text-xs font-medium px-3 py-1 rounded-full",
                      filter === "todos" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    ].join(" ")}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("activo")}
                    className={[
                      "text-xs font-medium px-3 py-1 rounded-full",
                      filter === "activo" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    ].join(" ")}
                  >
                    Activos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("pasivo")}
                    className={[
                      "text-xs font-medium px-3 py-1 rounded-full",
                      filter === "pasivo" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    ].join(" ")}
                  >
                    Pasivos
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-grow">
                <table className="w-full text-left border-collapse">
                  <thead className="text-xs uppercase text-gray-500 bg-gray-50 sticky top-0 z-0">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-28">Código</th>
                      <th className="px-4 py-3 font-semibold">Nombre</th>
                      <th className="px-4 py-3 font-semibold text-right w-32">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {filteredRows.map((r) => {
                      const active = r.id_cuenta === activeId;
                      return (
                        <tr
                          key={r.id_cuenta}
                          className={[
                            "group hover:bg-gray-50 transition-colors",
                            active ? "bg-primary/5 border-l-4 border-primary" : "",
                          ].join(" ")}
                        >
                          <td className={["px-4 py-3.5 font-bold", active ? "text-primary" : "text-gray-900"].join(" ")}>
                            {r.codigo}
                          </td>
                          <td
                            className={["px-4 py-3.5", active ? "text-gray-900 font-medium" : "text-gray-600"].join(" ")}
                            onClick={() => startEdit(r)}
                            style={{ cursor: "pointer" }}
                          >
                            {r.nombre}
                            <span
                              className={["block text-[10px] font-normal", active ? "text-primary/70" : "text-gray-400"].join(" ")}
                            >
                              {r.grupo_cuenta_nombre || r.tipo_cuenta}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mr-3"
                              onClick={() => startEdit(r)}
                            >
                              <span className="material-icons text-base">edit</span>
                              Editar
                            </button>

                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                              onClick={() => onAskDelete(r)}
                            >
                              <span className="material-icons text-base">delete_outline</span>
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!isLoading && filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                          No hay cuentas para mostrar.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-t border-gray-100 bg-gray-50/50 space-y-3">
                <PaginationControls
                  offset={offset}
                  limit={pageSize}
                  count={rows.length}
                  isLoading={isLoading}
                  onPrev={() => setOffset((o) => Math.max(0, o - pageSize))}
                  onNext={() => setOffset((o) => o + pageSize)}
                  onLimitChange={(n) => {
                    setPageSize(n);
                    setOffset(0);
                  }}
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{filteredRows.length} registros (filtrados)</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => fetchCuentas({ offset })}
                    disabled={isLoading}
                  >
                    <span className="material-icons text-sm">refresh</span>
                    Refrescar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 lg:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[100px] -z-0 pointer-events-none" />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="material-icons text-2xl">edit_note</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{form.id_cuenta ? "Editar Cuenta" : "Crear Cuenta"}</h3>
                    <p className="text-gray-500 text-sm">Información detallada de la cuenta contable</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">{statusBadge}</div>
              </div>

              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4 border-b border-gray-100 pb-2">
                    Identificación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Código <span className="text-primary">*</span>
                      </label>
                      <input
                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-lg tracking-wide shadow-sm"
                        type="text"
                        value={form.codigo}
                        onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Debe ser único en el sistema.</p>
                    </div>

                    <div className="md:col-span-8">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre de la Cuenta <span className="text-primary">*</span>
                      </label>
                      <input
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                        placeholder="Ingrese el nombre de la cuenta..."
                        type="text"
                        value={form.nombre}
                        onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4 border-b border-gray-100 pb-2">
                    Propiedades y Clasificación
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Grupo de Cuenta</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer hover:bg-gray-100"
                          value={String(form.id_grupo_cuenta || "")}
                          onChange={(e) => {
                            setGrupoTouched(true);
                            setForm((p) => ({ ...p, id_grupo_cuenta: e.target.value }));
                          }}
                        >
                          <option value="">- Ninguno -</option>
                          {grupos.map((g) => (
                            <option key={g.id_grupo_cuenta} value={String(g.id_grupo_cuenta)}>
                              {g.nombre || g.codigo || `Grupo ${g.id_grupo_cuenta}`}
                            </option>
                          ))}
                        </select>
                        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tipo de Cuenta <span className="text-primary">*</span>
                      </label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer hover:bg-gray-100"
                          value={form.tipo_cuenta}
                          onChange={(e) => setForm((p) => ({ ...p, tipo_cuenta: e.target.value }))}
                        >
                          <option value="">Seleccione...</option>
                          {tipoCuentaOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subtipo</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer hover:bg-gray-100"
                          value={form.sub_tipo}
                          onChange={(e) => setForm((p) => ({ ...p, sub_tipo: e.target.value }))}
                        >
                          <option value="">- Ninguno -</option>
                          {subTipoOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer hover:bg-gray-100"
                          value={form.categoria}
                          onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                        >
                          <option value="">- Ninguna -</option>
                          {categoriaOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Moneda</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer hover:bg-gray-100"
                          value={form.moneda}
                          onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))}
                        >
                          {monedaOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <MetadataKeyValueTable
                        title="Metadata (atributo - valor)"
                        value={form.metadata ?? {}}
                        onChange={(next) => {
                          setMetadataTouched(true);
                          setForm((p) => ({ ...p, metadata: next }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-8 border-t border-gray-100">
                  <button
                    type="button"
                    className="order-1 sm:order-none w-full sm:w-auto px-8 py-3 bg-primary hover:bg-[#5a1b28] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={onSave}
                    disabled={saving}
                  >
                    <span className="material-icons text-sm">save</span>
                    {saving ? "Guardando..." : "Guardar Cuenta"}
                  </button>

                  <button
                    type="button"
                    className="order-2 sm:order-none w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    onClick={startCreate}
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="order-3 sm:order-none sm:ml-auto w-full sm:w-auto px-4 py-3 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-100 text-sm disabled:opacity-50"
                    onClick={() => onAskDelete({ ...form, id_cuenta: form.id_cuenta })}
                    disabled={!form.id_cuenta || saving}
                  >
                    <span className="material-icons text-lg">delete_outline</span>
                    Eliminar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <ConfirmDeleteModal
          open={deleteOpen}
          title="Eliminar cuenta"
          message={
            deleteTarget
              ? `¿Seguro que deseas eliminar la cuenta "${deleteTarget.nombre || deleteTarget.codigo}"?`
              : "¿Seguro que deseas eliminar esta cuenta?"
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          isLoading={deleting}
          onConfirm={onConfirmDelete}
          onCancel={() => {
            if (deleting) return;
            setDeleteOpen(false);
            setDeleteTarget(null);
          }}
        />
      </main>
    </>
  );
}
