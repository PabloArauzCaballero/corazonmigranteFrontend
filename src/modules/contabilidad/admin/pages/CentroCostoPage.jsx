import React, { useEffect, useMemo, useState } from "react";
import { useCentrosCostoAdmin } from "../hooks/useCentrosCostoAdmin";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import ActionResultModal from "../components/modals/ActionResultModal";
import MetadataKeyValueTable from "../components/MetadataKeyValueTable";
import PaginationControls from "../components/PaginationControls";

const EMPTY_FORM = {
  id_centro_costo: null,
  codigo: "",
  nombre: "",
  metadata: {},
  register_status: "Activo",
};

export default function CentroCostoPage({ session }) {
  const [pageSize, setPageSize] = useState(50);
  const [offset, setOffset] = useState(0);

  const { rows, isLoading, error, fetchCentros, crearCentro, editarCentro, apagarCentro } = useCentrosCostoAdmin(session, {
    autoFetch: false,
    limit: pageSize,
  });

  useEffect(() => {
    if (!session?.id_sesion) return;
    fetchCentros({ offset });
  }, [session?.id_sesion, offset, pageSize, fetchCentros]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos"); // todos | activo | inactivo

  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  // Evita sobre-escribir metadata con {} cuando el listar no la trae.
  const [metadataTouched, setMetadataTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const filteredRows = useMemo(() => {
    let data = [...rows];

    if (filter === "activo") data = data.filter((r) => (r.register_status || "").toLowerCase() === "activo");
    if (filter === "inactivo") data = data.filter((r) => (r.register_status || "").toLowerCase() !== "activo");

    const q = query.trim().toLowerCase();
    if (q) {
      data = data.filter((r) =>
        String(r.codigo).toLowerCase().includes(q) ||
        String(r.nombre).toLowerCase().includes(q)
      );
    }
    return data;
  }, [rows, query, filter]);

  const startCreate = () => {
    setActiveId(null);
    setForm(EMPTY_FORM);
    setMetadataTouched(false);
  };

  const startEdit = (row) => {
    setActiveId(row.id_centro_costo);
    setMetadataTouched(false);
    setForm({
      id_centro_costo: row.id_centro_costo,
      codigo: row.codigo ?? "",
      nombre: row.nombre ?? "",
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
      const payload = {
        id_centro_costo: form.id_centro_costo,
        codigo: form.codigo,
        nombre: form.nombre,
        register_status: form.register_status,
        metadata: form.id_centro_costo
          ? (metadataTouched ? (form.metadata ?? {}) : undefined)
          : (form.metadata ?? {}),
      };

      if (form.id_centro_costo) {
        await editarCentro(payload);
      } else {
        await crearCentro(payload);
      }

      await fetchCentros({ offset });
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
      await apagarCentro(deleteTarget);
      await fetchCentros({ offset });
      if (activeId === deleteTarget.id_centro_costo) startCreate();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      showResult("error", e?.message || "Error al eliminar", "Ocurrió un problema");
    } finally {
      setDeleting(false);
    }
  };

  const statusBadge = form.register_status === "Activo" ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Inactivo</span>
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Finanzas</span>
            <span className="material-icons text-xs">chevron_right</span>
            <span>Configuración</span>
            <span className="material-icons text-xs">chevron_right</span>
            <span className="text-primary font-medium">Centros de Costos</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Centros de Costos</h2>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition flex items-center gap-2 shadow-sm text-sm font-medium"
          >
            <span className="material-icons text-lg">print</span>
            Imprimir
          </button>
          <button
            type="button"
            className="bg-primary hover:bg-[#5a1b28] text-white px-4 py-2 rounded-lg shadow-md transition flex items-center gap-2 text-sm font-medium"
            onClick={startCreate}
          >
            <span className="material-icons text-lg">add</span>
            Nuevo Centro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LIST */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-250px)] min-h-[600px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="material-icons text-primary">format_list_bulleted</span>
                <h3 className="text-lg font-semibold text-gray-800">Listado de Centros</h3>
              </div>
              <button
                type="button"
                className="bg-white text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-xs font-semibold"
                onClick={() => fetchCentros({ offset })}
                disabled={isLoading}
              >
                Refrescar
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10 space-y-3">
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                  placeholder="Buscar centro de costo..."
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className={[
                    "text-xs font-medium px-3 py-1 rounded-full",
                    filter === "todos" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  ].join(" ")}
                  onClick={() => setFilter("todos")}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={[
                    "text-xs font-medium px-3 py-1 rounded-full",
                    filter === "activo" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  ].join(" ")}
                  onClick={() => setFilter("activo")}
                >
                  Activos
                </button>
                <button
                  type="button"
                  className={[
                    "text-xs font-medium px-3 py-1 rounded-full",
                    filter === "inactivo" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  ].join(" ")}
                  onClick={() => setFilter("inactivo")}
                >
                  Inactivos
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
                    const active = r.id_centro_costo === activeId;
                    return (
                      <tr
                        key={r.id_centro_costo}
                        className={[
                          "group hover:bg-gray-50 transition-colors",
                          active ? "bg-primary/5 border-l-4 border-primary" : "",
                        ].join(" ")}
                      >
                        <td
                          className={["px-4 py-3.5 font-bold", active ? "text-primary" : "text-gray-900"].join(" ")}
                          onClick={() => startEdit(r)}
                          style={{ cursor: "pointer" }}
                        >
                          {r.codigo || "-"}
                        </td>
                        <td
                          className={["px-4 py-3.5", active ? "text-gray-900 font-medium" : "text-gray-600"].join(" ")}
                          onClick={() => startEdit(r)}
                          style={{ cursor: "pointer" }}
                        >
                          {r.nombre}
                          <span className={["block text-[10px] font-normal", active ? "text-primary/70" : "text-gray-400"].join(" ")}
                          >
                            {r.register_status || ""}
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
                        No hay centros de costo para mostrar.
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
                  onClick={() => fetchCentros({ offset })}
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
                  <span className="material-icons text-2xl">apartment</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{form.id_centro_costo ? "Editar Centro de Costos" : "Crear Centro de Costos"}</h3>
                  <p className="text-gray-500 text-sm">Información detallada del centro de costos</p>
                </div>
              </div>
              {statusBadge}
            </div>

            {error ? (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                <div className="font-semibold mb-1">Error</div>
                <div className="text-xs">{error}</div>
              </div>
            ) : null}

            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4 border-b border-gray-100 pb-2">Identificación</h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Código <span className="text-primary">*</span></label>
                    <input
                      className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-lg tracking-wide shadow-sm"
                      type="text"
                      value={form.codigo}
                      onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                      placeholder="ej: ADM"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Código único identificador.</p>
                  </div>

                  <div className="md:col-span-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre <span className="text-primary">*</span></label>
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                      placeholder="Ej: Administración"
                      type="text"
                      value={form.nombre}
                      onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4 border-b border-gray-100 pb-2">Detalles</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer hover:bg-gray-100"
                        value={form.register_status}
                        onChange={(e) => setForm((p) => ({ ...p, register_status: e.target.value }))}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                      <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
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
                  className="order-1 sm:order-none w-full sm:w-auto px-8 py-3 bg-primary hover:bg-[#5a1b28] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  onClick={onSave}
                  disabled={saving}
                >
                  <span className="material-icons text-sm">save</span>
                  {saving ? "Guardando..." : "Guardar Centro"}
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
                  className="order-3 sm:order-none sm:ml-auto w-full sm:w-auto px-4 py-3 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  onClick={() => onAskDelete({ ...form, id_centro_costo: form.id_centro_costo })}
                  disabled={!form.id_centro_costo || saving}
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
        title="Eliminar centro de costo"
        message={
          deleteTarget
            ? `¿Seguro que deseas eliminar el centro "${deleteTarget.nombre || deleteTarget.codigo}"?`
            : "¿Seguro que deseas eliminar este centro?"
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
