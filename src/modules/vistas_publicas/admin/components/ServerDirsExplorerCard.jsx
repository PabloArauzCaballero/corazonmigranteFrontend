import React from "react";

export default function ServerDirsExplorerCard({
  prefix = "",
  dirs = [],
  isLoading = false,
  error = "",
  selectedDir = "",
  onUp,
  onOpen,
  onUse,
}) {
  const pretty = prefix ? `/${prefix}` : "/";

  return (
    <section className="rounded-xl overflow-hidden shadow-sm bg-white/70 backdrop-blur border border-primary/10">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">folder_open</span>
          <h3 className="font-display text-xl text-gray-800">Servidor de archivos</h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-gray-500 text-base">location_on</span>
          <span className="text-sm font-mono text-gray-600">{pretty}</span>
          <button
            type="button"
            onClick={onUp}
            className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center disabled:opacity-50"
            disabled={!prefix || isLoading}
            title="Subir un nivel"
          >
            <span className="material-symbols-outlined">arrow_upward</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ruta</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Carpeta</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Acción</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {error ? (
              <tr>
                <td className="px-6 py-6 text-sm text-red-600" colSpan={3}>
                  {error}
                </td>
              </tr>
            ) : isLoading ? (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500" colSpan={3}>
                  Cargando carpetas...
                </td>
              </tr>
            ) : dirs.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-sm text-gray-500" colSpan={3}>
                  No hay carpetas para mostrar.
                </td>
              </tr>
            ) : (
              dirs.map((d, idx) => {
                const active = selectedDir === d.path;
                return (
                  <tr key={d.path} className={["hover:bg-gray-50 transition-colors", idx % 2 === 1 ? "bg-gray-50/30" : ""].join(" ")}>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{d.path}</td>
                    <td className="px-6 py-4 text-sm font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-500">folder</span>
                      {d.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="border border-gray-200 text-gray-700 text-[10px] px-3 py-2 rounded-full uppercase font-bold hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={() => onOpen?.(d.path)}
                          disabled={isLoading}
                          title="Abrir carpeta"
                        >
                          <span className="material-symbols-outlined text-[18px] leading-none">folder_open</span>
                        </button>

                        <button
                          type="button"
                          className={[
                            "text-[10px] px-4 py-2 rounded-full uppercase font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                            active ? "bg-primary text-white" : "bg-primary/90 text-white hover:bg-primary",
                          ].join(" ")}
                          onClick={() => onUse?.(d.path)}
                          disabled={isLoading}
                          title="Usar esta carpeta como destino"
                        >
                          USAR
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
