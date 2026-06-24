import React from "react";

export default function ProductosCatalog({
    query,
    onChangeQuery,
    productos,
    selectedId,
    onSelect,
    onEdit,
    onDelete,
}) {
    return (
        <div className="bg-surface-light rounded-2xl shadow-soft border border-border-light overflow-hidden">
            <div className="p-4 border-b border-border-light bg-secondary/20 flex items-center justify-between">
                <h3 className="font-semibold text-text-main-light flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">list_alt</span>
                    Catálogo
                </h3>

                <div className="relative w-48">
                    <span className="material-symbols-outlined absolute left-2 top-1.5 text-text-muted-light text-base">
                        search
                    </span>
                    <input
                        className="w-full bg-white border-border-light rounded-md py-1 pl-8 pr-3 text-xs focus:ring-primary focus:border-primary"
                        placeholder="Filtrar..."
                        type="text"
                        value={query}
                        onChange={(e) => onChangeQuery?.(e.target.value)}
                    />
                </div>
            </div>

            <div className="divide-y divide-border-light max-h-[600px] overflow-y-auto custom-scrollbar">
                {productos.map((p) => {
                    const isSelected = p.id === selectedId;
                    const estadoPill =
                        p.estado === "Activo"
                            ? "bg-green-100 text-green-800"
                            : p.estado === "Agotado"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-gray-100 text-gray-800";

                    return (
                        <div
                            key={p.id}
                            className={
                                "p-4 hover:bg-background-light cursor-pointer transition-colors border-l-4 " +
                                (isSelected ? "border-primary bg-secondary/10" : "border-transparent")
                            }
                            onClick={() => onSelect?.(p.id)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={"text-[10px] font-bold uppercase tracking-widest " + (isSelected ? "text-primary" : "text-text-muted-light")}>
                                        {p.categoria}
                                    </span>
                                    {p.enfoque_default_nombre ? (
                                        <span className="text-[10px] text-text-muted-light bg-white/70 border border-border-light px-2 py-0.5 rounded">
                                            {p.enfoque_default_nombre}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={"inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium " + estadoPill}>
                                        {p.estado}
                                    </span>

                                    <button
                                        type="button"
                                        className="p-1.5 rounded-md text-text-muted-light hover:text-primary hover:bg-white/60"
                                        title="Editar"
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            onEdit?.(p);
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                                        title="Eliminar"
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            onDelete?.(p);
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            </div>

                            <h4 className="font-semibold text-text-main-light">{p.nombre}</h4>
                            <p className="text-xs text-text-muted-light mt-1 line-clamp-1">
                                {p.duracion_minutos ? `Duración: ${p.duracion_minutos} min` : ""}
                            </p>

                            <div className="mt-2 flex items-center gap-3">
                                <span className="text-[10px] flex items-center gap-1 text-text-muted-light">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    {p.duracion_minutos ? `${p.duracion_minutos} min` : "—"}
                                </span>
                                <span className="text-[10px] flex items-center gap-1 text-text-muted-light">
                                    <span className="material-symbols-outlined text-sm">payments</span>
                                    {Number(p.precio || 0).toFixed(2)} {p.moneda}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
