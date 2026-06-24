import React, { useMemo, useState } from "react";

function Chip({ children }) {
    return (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            {children}
        </span>
    );
}

export default function SpecialistCard({ item }) {
    const [open, setOpen] = useState(false);

    const name = item?.name || "";
    const role = item?.role || "";
    const image = item?.image?.src || "";
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    const bio = item?.bio || "";

    // ✅ Si tu JSON trae position por persona, úsalo
    // Ej: "object-[50%_12%]" para subir la cara
    const imgPos = item?.image?.position || "object-top";

    const text = useMemo(() => String(bio || ""), [bio]);

    return (
        <article
            className={[
                "group overflow-hidden rounded-[28px]",
                "bg-white",
                "shadow-[0_18px_50px_rgba(15,23,42,0.08)]",
                "border border-slate-100",
            ].join(" ")}
        >
            {/* ===== Image ===== */}
            <div className="relative h-[260px] w-full bg-slate-100 overflow-hidden">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className={[
                            "h-full w-full object-cover",
                            imgPos, // ✅ object-top o personalizado
                            "transition-transform duration-700 group-hover:scale-[1.02]",
                        ].join(" ")}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300" />
                )}

                {/* sombra suave para que el recorte no se note duro */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
            </div>

            {/* ===== Body ===== */}
            <div className="p-7">
                {/* header + botón fijo */}
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-[28px] leading-tight font-semibold text-slate-900 truncate">
                            {name}
                        </h3>
                        <p className="mt-1 text-[16px] text-slate-500">{role}</p>
                    </div>

                    <div className="shrink-0">
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            className={[
                                "inline-flex items-center gap-2",
                                "rounded-full px-4 py-2",
                                "bg-slate-50 hover:bg-slate-100",
                                "text-slate-600 text-sm",
                                "border border-slate-100",
                                "transition",
                            ].join(" ")}
                        >
                            Leer
                            <span
                                className={[
                                    "material-symbols-outlined text-[18px] transition-transform",
                                    open ? "rotate-180" : "",
                                ].join(" ")}
                            >
                                expand_more
                            </span>
                        </button>
                    </div>
                </div>

                {/* tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {tags.slice(0, 6).map((t) => (
                        <Chip key={t}>{t}</Chip>
                    ))}
                </div>

                {/* bio: clamp para mantener altura */}
                <div className="mt-5">
                    <p
                        className={[
                            "text-[16px] leading-7 text-slate-600",
                            open ? "" : "line-clamp-3",
                        ].join(" ")}
                    >
                        {text}
                    </p>
                </div>
            </div>
        </article>
    );
}
