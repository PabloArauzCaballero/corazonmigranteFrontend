export function exportUsersCsv(users) {
    if (!Array.isArray(users) || users.length === 0) {
        return { ok: false, message: "No hay usuarios para exportar" };
    }

    const headers = ["ID", "Email", "Rol", "Estado"];
    const csvRows = [headers.join(",")];

    users.forEach((u) => {
        csvRows.push([u.id, u.email, u.role, u.status].join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usuarios_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    return { ok: true };
}
