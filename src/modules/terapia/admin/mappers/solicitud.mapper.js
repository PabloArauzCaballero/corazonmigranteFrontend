import { formatDate, formatTime } from "../utils/datetime";
import { badgeByEstado } from "../utils/estado";
import { initialsFromName } from "../utils/initial";

export function mapSolicitudToUI(x) {
    const id = String(x.id_cita ?? x.id ?? "—");
    const estadoUpper = String(x.estado || "PENDIENTE").toUpperCase();

    // Pago es un atributo independiente (no debe reemplazar el estado)
    const pagado = Boolean(x.is_pagado ?? x.pagado ?? false);

    const nombre = x.paciente_nombre_completo || "Sin nombre";
    const correo = x.paciente_email || "—";

    const fecha = formatDate(x.fecha_programada || x.inicio);
    const hora = `${formatTime(x.inicio)} - ${formatTime(x.fin)}`;

    return {
        id,
        ref: `REF: ${id}`,
        nombre,
        estado: estadoUpper,
        estadoBadgeClass: badgeByEstado(estadoUpper),

        pagado,

        pagado,

        fecha,
        hora,

        iniciales: initialsFromName(nombre),
        avatar: null,

        correo,
        telefono: "—",

        tipo: x.producto_nombre || "—",
        origen: x.canal || "—",
        registrada: formatDate(x.created_at),

        enlace_sesion: x.enlace_sesion || null,
        notas_internas: x.notas_internas || "",
        terapeuta: x.terapeuta_nombre_completo || "—",

        raw: x,
    };
}
