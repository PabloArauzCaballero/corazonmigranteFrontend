import React, { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import ActionResultModal from "../components/modals/ActionResultModal";
import MetadataKeyValueTable from "../components/MetadataKeyValueTable";
import { useGruposCuentaAdmin } from "../hooks/useGruposCuentaAdmin";
import PaginationControls from "../components/PaginationControls";

const EMPTY_FORM = {
  id_grupo_cuenta: null,
  codigo: "",
  nombre: "",
  tipo_grupo: "",
  id_grupo_padre: "",
  metadata: {},
  register_status: "Activo",
};

export default function GrupoCuentaPage({ session }) {
  const [pageSize, setPageSize] = useState(50);
  const [offset, setOffset] = useState(0);

  const { rows, isLoading, error, fetchGrupos, crearGrupoCuenta, editarGrupoCuenta, apagarGrupoCuenta } =
    useGruposCuentaAdmin(session, { autoFetch: false, limit: pageSize });

  useEffect(() => {
    if (!session?.id_sesion) return;
    fetchGrupos({ offset });
  }, [session?.id_sesion, offset, pageSize, fetchGrupos]);

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [metadataTouched, setMetadataTouched] = useState(false);
  const [parentTouched, setParentTouched] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [resultOpen, setResultOpen] = useState(false);
  const [resultKind, setResultKind] = useState("success");
  const [resultTitle, setResultTitle] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  const showResult = (kind, title, message) => {
    setResultKind(kind || "success");
    setResultTitle(title || "");
    setResultMessage(message || "");
    setResultOpen(true);
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.codigo || "").toLowerCase().includes(q) ||
        String(r.nombre || "").toLowerCase().includes(q) ||
        String(r.grupo_padre_nombre || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const tipoGrupoOptions = useMemo(() => {
    const set = new Set(["ACTIVO", "PASIVO", "PATRIMONIO", "INGRESO", "GASTO"]);
    for (const r of rows) if (r.tipo_grupo) set.add(String(r.tipo_grupo));
    return Array.from(set);
  }, [rows]);

  const padreOptions = useMemo(() => {
    // ✅ solo padres Activos + no permitir seleccionarse a sí mismo
    return rows
      .filter((r) => (r.register_status ?? "Activo") === "Activo")
      .filter((r) => !form.id_grupo_cuenta || r.id_grupo_cuenta !== form.id_grupo_cuenta)
      .map((r) => ({ id: r.id_grupo_cuenta, label: `${r.codigo} - ${r.nombre}` }));
  }, [rows, form.id_grupo_cuenta]);

  const startCreate = () => {
    setActiveId(null);
    setForm(EMPTY_FORM);
    setMetadataTouched(false);
    setParentTouched(false);
  };

  const startEdit = (row) => {
    setActiveId(row.id_grupo_cuenta);
    setMetadataTouched(false);
    setParentTouched(false);
    setForm({
      id_grupo_cuenta: row.id_grupo_cuenta,
      codigo: row.codigo ?? "",
      nombre: row.nombre ?? "",
      tipo_grupo: row.tipo_grupo ?? "",
      id_grupo_padre: row.id_grupo_padre ? String(row.id_grupo_padre) : "",
      metadata: row.metadata ?? {},
      register_status: row.register_status ?? "Activo",
    });
  };

  const onSave = async () => {
    if (!session?.id_sesion) {
      showResult("error", "Sesión inválida", "Falta id_sesion. Vuelve a iniciar sesión.");
      return;
    }
    if (!form.nombre) {
      showResult("error", "Campos obligatorios", "El Nombre es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      // raíz => null, id => number
      const rawPadre = form.id_grupo_padre;
      const padreNum = rawPadre === "" || rawPadre == null ? null : Number(rawPadre);
      const padreId = !padreNum || Number.isNaN(padreNum) ? null : padreNum;

      const payload = {
        id_grupo_cuenta: form.id_grupo_cuenta,
        codigo: form.codigo,
        nombre: form.nombre,
        tipo_grupo: form.tipo_grupo,
        register_status: form.register_status,
        metadata: form.id_grupo_cuenta ? (metadataTouched ? form.metadata ?? {} : undefined) : form.metadata ?? {},
      };

      // ✅ solo mandar padre si:
      // - creando (siempre)
      // - editando y el usuario lo tocó
      if (!form.id_grupo_cuenta) {
        payload.id_grupo_padre = padreId;
      } else if (parentTouched) {
        payload.id_grupo_padre = padreId;
      }

      if (form.id_grupo_cuenta) await editarGrupoCuenta(payload);
      else await crearGrupoCuenta(payload);

      setOffset(0);
      await fetchGrupos({ offset: 0 });
      startCreate();
      showResult("success", "Listo", "Grupo guardado correctamente.");
    } catch (e) {
      console.error(e);
      showResult("error", "Error al guardar", e?.message || "No se pudo guardar el grupo.");
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
      await apagarGrupoCuenta(deleteTarget);
      setOffset(0);
      await fetchGrupos({ offset: 0 });
      if (activeId === deleteTarget.id_grupo_cuenta) startCreate();
      setDeleteOpen(false);
      setDeleteTarget(null);
      showResult("success", "Listo", "Grupo eliminado correctamente.");
    } catch (e) {
      console.error(e);
      showResult("error", "Error al eliminar", e?.message || "No se pudo eliminar el grupo.");
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
    <main className="p-0 max-w-[1920px] mx-auto w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Inicio</span>
            <span className="material-icons text-xs">chevron_right</span>
            <span>Contabilidad</span>
            <span className="material-icons text-xs">chevron_right</span>
            <span className="text-primary font-medium">Grupos</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Grupos de Cuentas</h2>
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
            <span className="material-icons text-lg">add</span> Nuevo Grupo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LISTADO */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-250px)] min-h-[600px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="material-icons text-primary">folder_open</span>
                <h3 className="text-lg font-semibold text-gray-800">Listado de Grupos</h3>
              </div>

              <button
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50"
                onClick={() => fetchGrupos({ offset })}
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
                  placeholder="Buscar grupo..."
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead className="text-xs uppercase text-gray-500 bg-gray-50 sticky top-0 z-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-28">Código</th>
                    <th className="px-4 py-3 font-semibold">Nombre</th>
                    <th className="px-4 py-3 font-semibold text-right w-44">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {filteredRows.map((r) => {
                    const isActive = activeId === r.id_grupo_cuenta;
                    return (
                      <tr
                        key={r.id_grupo_cuenta}
                        className={[
                          "group hover:bg-gray-50 transition-colors",
                          isActive ? "bg-primary/5 border-l-4 border-primary" : "",
                        ].join(" ")}
                      >
                        <td
                          className={["px-4 py-3.5 font-bold", isActive ? "text-primary" : "text-gray-900"].join(" ")}
                          onClick={() => startEdit(r)}
                          style={{ cursor: "pointer" }}
                        >
                          {r.codigo || "-"}
                        </td>
                        <td
                          className={["px-4 py-3.5", isActive ? "text-gray-900 font-medium" : "text-gray-600"].join(" ")}
                          onClick={() => startEdit(r)}
                          style={{ cursor: "pointer" }}
                        >
                          {r.nombre}
                          <span className="block text-[10px] font-normal text-gray-400">
                            {r.grupo_padre_nombre ? `Padre: ${r.grupo_padre_nombre}` : "Grupo raíz"}
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
                      <td className="px-4 py-6 text-gray-400" colSpan={3}>
                        No hay grupos
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
                  onClick={() => fetchGrupos({ offset })}
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
                  <span className="material-icons text-2xl">folder_shared</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Crear / Editar Grupo</h3>
                  <p className="text-gray-500 text-sm">Definición de la estructura del plan de cuentas</p>
                </div>
              </div>
              {statusBadge}
            </div>

            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4 border-b border-gray-100 pb-2">
                  Identificación del Grupo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Código</label>
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-lg tracking-wide shadow-sm"
                      type="text"
                      value={form.codigo}
                      onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                      placeholder="ej: 1.12"
                    />
                  </div>
                  <div className="md:col-span-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre <span className="text-primary">*</span>
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                      type="text"
                      value={form.nombre}
                      onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                      placeholder="Ingrese el nombre del grupo..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-4 border-b border-gray-100 pb-2">
                  Jerarquía y Detalles
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Grupo</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer hover:bg-gray-100"
                        value={form.tipo_grupo}
                        onChange={(e) => setForm((p) => ({ ...p, tipo_grupo: e.target.value }))}
                      >
                        <option value="">- Seleccione -</option>
                        {tipoGrupoOptions.map((o) => (
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Grupo Padre</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none transition-all cursor-pointer hover:bg-gray-100"
                        value={form.id_grupo_padre}
                        onChange={(e) => {
                          setParentTouched(true);
                          setForm((p) => ({ ...p, id_grupo_padre: e.target.value }));
                        }}
                      >
                        <option value="">- Ninguno (Grupo raíz) -</option>
                        {padreOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
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
                  className="order-1 sm:order-none w-full sm:w-auto px-8 py-3 bg-primary hover:bg-[#5a1b28] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  onClick={onSave}
                  disabled={saving}
                >
                  <span className="material-icons text-sm">save</span>
                  {saving ? "Guardando..." : "Guardar Grupo"}
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
                  onClick={() => onAskDelete({ ...form, id_grupo_cuenta: form.id_grupo_cuenta })}
                  disabled={!form.id_grupo_cuenta || saving}
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
        title="Eliminar grupo de cuenta"
        message={
          deleteTarget
            ? `¿Seguro que deseas eliminar el grupo "${deleteTarget.nombre || deleteTarget.codigo}"?`
            : "¿Seguro que deseas eliminar este grupo?"
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

      <ActionResultModal
        open={resultOpen}
        kind={resultKind}
        title={resultTitle}
        message={resultMessage}
        onClose={() => setResultOpen(false)}
      />
    </main>
  );
}
