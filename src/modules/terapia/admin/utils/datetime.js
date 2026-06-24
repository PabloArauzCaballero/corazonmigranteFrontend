export function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
}