const DIA = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo",
};

function hhmm(v) {
    // suele venir "09:00:00" o "09:00"
    if (!v) return "";
    const s = String(v);
    return s.length >= 5 ? s.slice(0, 5) : s;
}

export function mapHorarioToUI(row) {
    return {
        id: row?.id_horario_terapeuta,
        dia_semana: row?.dia_semana,
        dia: DIA[row?.dia_semana] || "—",
        hora_inicio: hhmm(row?.hora_inicio),
        hora_fin: hhmm(row?.hora_fin),
        rango: `${hhmm(row?.hora_inicio)} - ${hhmm(row?.hora_fin)}`,
        register_status: row?.horario_register_status,
        raw: row,
    };
}
