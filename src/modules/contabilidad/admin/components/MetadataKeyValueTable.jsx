import React, { useEffect, useMemo, useState } from "react";

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function toRows(metadata) {
  if (!metadata || typeof metadata !== "object") return [];
  return Object.entries(metadata).map(([key, value]) => ({
    id: randomId(),
    key: String(key ?? ""),
    value: value === null || value === undefined ? "" : String(value),
  }));
}

function parseValueSmart(v) {
  const s = String(v ?? "").trim();
  if (s === "") return "";
  if (s === "true") return true;
  if (s === "false") return false;
  // number
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

/**
 * Editor simple de metadata (JSONB) como tabla atributo-valor.
 * - value: objeto (metadata)
 * - onChange: (nextObj) => void
 */
export default function MetadataKeyValueTable({ value = {}, onChange, disabled = false, title = "Metadata" }) {
  const [rows, setRows] = useState(() => toRows(value));

  // si cambió desde afuera (ej: editar otra fila), rehidratar
  useEffect(() => {
    setRows(toRows(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value || {})]);

  const duplicatedKeys = useMemo(() => {
    const counts = new Map();
    for (const r of rows) {
      const k = (r.key || "").trim();
      if (!k) continue;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    const dup = new Set();
    for (const [k, c] of counts.entries()) if (c > 1) dup.add(k);
    return dup;
  }, [rows]);

  const emit = (nextRows) => {
    const obj = {};
    for (const r of nextRows) {
      const k = (r.key || "").trim();
      if (!k) continue;
      obj[k] = parseValueSmart(r.value);
    }
    onChange?.(obj);
  };

  const addRow = () => {
    if (disabled) return;
    const next = [...rows, { id: randomId(), key: "", value: "" }];
    setRows(next);
    emit(next);
  };

  const removeRow = (id) => {
    if (disabled) return;
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    emit(next);
  };

  const updateRow = (id, patch) => {
    if (disabled) return;
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRows(next);
    emit(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-wider text-gray-400 font-bold">{title}</h4>
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50"
        >
          + Agregar
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead className="text-xs uppercase text-gray-500 bg-gray-50">
            <tr>
              <th className="px-3 py-2 font-semibold">Atributo</th>
              <th className="px-3 py-2 font-semibold">Valor</th>
              <th className="px-3 py-2 font-semibold w-16 text-right"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-gray-400" colSpan={3}>
                  Sin metadata
                </td>
              </tr>
            ) : null}

            {rows.map((r) => {
              const keyTrim = (r.key || "").trim();
              const isDup = keyTrim && duplicatedKeys.has(keyTrim);
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={r.key}
                      disabled={disabled}
                      onChange={(e) => updateRow(r.id, { key: e.target.value })}
                      className={[
                        "w-full px-3 py-2 rounded-lg border bg-white text-sm",
                        isDup ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200 focus:ring-primary/30 focus:border-primary",
                        disabled ? "opacity-60" : "",
                      ].join(" ")}
                      placeholder="ej: nivel"
                    />
                    {isDup ? <div className="text-[10px] text-red-500 mt-1">Clave repetida</div> : null}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={r.value}
                      disabled={disabled}
                      onChange={(e) => updateRow(r.id, { value: e.target.value })}
                      className={[
                        "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-primary/30 focus:border-primary",
                        disabled ? "opacity-60" : "",
                      ].join(" ")}
                      placeholder='ej: "ajuste" o 1'
                    />
                    <div className="text-[10px] text-gray-400 mt-1">Tip: "true/false" y números se guardan tipados.</div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => removeRow(r.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                      title="Eliminar fila"
                    >
                      <span className="material-icons text-lg">delete_outline</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
