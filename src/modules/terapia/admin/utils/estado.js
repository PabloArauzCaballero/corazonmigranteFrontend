// Normaliza variaciones (CONFIRMADA/CONFIRMADO, CANCELADA/CANCELADO, etc.)
export function normalizeEstado(estado) {
    const e = String(estado || "").trim().toUpperCase();
    if (e === "CONFIRMADA") return "CONFIRMADO";
    if (e === "CANCELADA") return "CANCELADO";
    if (e === "PAGADO" || e === "PAGADA") return "PAGADO";
    if (e === "RECHAZADA") return "RECHAZADO";
    if (e === "REPROGRAMADA") return "REPROGRAMADO";
    return e;
}

export function badgeByEstado(estado) {
    const e = normalizeEstado(estado);
    if (e === "CONFIRMADO") return "bg-emerald-100 text-emerald-700";
    if (e === "PAGADO") return "bg-violet-100 text-violet-700";
    if (e === "PENDIENTE") return "bg-amber-100 text-amber-700";
    if (e === "CANCELADO" || e === "RECHAZADO") return "bg-slate-100 text-slate-500";
    if (e === "REPROGRAMADO") return "bg-sky-100 text-sky-700";
    return "bg-slate-100 text-slate-500";
}

// Estilos para "chips" en la grilla del calendario (mejor contraste y consistencia)
export function chipByEstado(estado) {
    const e = normalizeEstado(estado);
    if (e === "CONFIRMADO") {
        return "bg-emerald-600 text-white ring-1 ring-inset ring-emerald-700/30 hover:bg-emerald-700";
    }
    if (e === "PAGADO") {
        return "bg-violet-600 text-white ring-1 ring-inset ring-violet-700/30 hover:bg-violet-700";
    }
    if (e === "PENDIENTE") {
        return "bg-amber-400 text-slate-900 ring-1 ring-inset ring-amber-500/40 hover:bg-amber-500";
    }
    if (e === "REPROGRAMADO") {
        return "bg-sky-500 text-white ring-1 ring-inset ring-sky-600/30 hover:bg-sky-600";
    }
    if (e === "CANCELADO" || e === "RECHAZADO") {
        return "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200 line-through hover:bg-rose-100";
    }
    return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-200";
}