import React from "react";

export default function EnfoquesList({
    query,
    onChangeQuery,
    enfoques,
    selectedId,
    onSelect,
    onEdit,
    onDelete,
}) {
    return (
        <div className="bg-card-light rounded-2xl shadow-soft border border-white overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            <div className="p-6 border-b border-border-light bg-white/50">
                <h2 className="font-display text-xl text-primary font-bold mb-4">Enfoques Activos</h2>

                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-sub-light">
                        search
                    </span>
                    <input
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-light rounded-xl focus:ring-primary focus:border-primary text-sm"
                        placeholder="Buscar enfoque..."
                        type="text"
                        value={query}
                        onChange={(e) => onChangeQuery?.(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-input-light/30 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-text-sub-light">Nombre</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-text-sub-light text-right">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-text-sub-light text-right">
                                Acción
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                        {enfoques.map((e) => {
                            const isSelected = e.id === selectedId;
                            const estadoPill =
                                e.estado === "Activo"
                                    ? "bg-green-100 text-green-700"
                                    : e.estado === "Draft"
                                        ? "bg-gray-200 text-gray-600"
                                        : "bg-primary/10 text-primary";

                            return (
                                <tr
                                    key={e.id}
                                    className={
                                        "hover:bg-white transition-colors cursor-pointer group " +
                                        (isSelected ? "bg-white/40" : "")
                                    }
                                    onClick={() => onSelect?.(e.id)}
                                >
                                    <td className={"px-6 py-4 " + (isSelected ? "border-l-4 border-primary" : "")}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all " +
                                                    (isSelected
                                                        ? "bg-primary text-white"
                                                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white")
                                                }
                                            >
                                                {e?.url ? (
                                                    <img
                                                        src={e.url}
                                                        alt="Miniatura"
                                                        className="w-6 h-6 object-cover rounded"
                                                    />
                                                ) : (
                                                    <span className="material-symbols-outlined text-lg">{e.icon}</span>
                                                )}                                            </div>
                                            <div>
                                                <p className={"font-semibold text-sm " + (isSelected ? "text-primary" : "text-text-main-light")}>
                                                    {e.nombre}
                                                </p>
                                                <p className="text-xs text-text-sub-light">Creado: {e.creado}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2 py-1 rounded-full ${estadoPill} text-[10px] font-bold uppercase`}>
                                            {e.estado}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    onEdit?.(e);
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-sm align-middle mr-1">edit</span>
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    onDelete?.(e);
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-sm align-middle mr-1">delete</span>
                                                Eliminar
                                            </button>
                                        </div>
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
