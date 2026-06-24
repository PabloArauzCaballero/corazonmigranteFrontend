import { createApiConn } from "../../../..//helpers/api_conn_factory";
import { TERAPIA_ENDPOINTS } from "../../../../config/TERAPIA_ENDPOINTS";

export async function listarSolicitudes(payload) {
    return createApiConn(TERAPIA_ENDPOINTS.CITAS_SOLICITUDES_LISTAR, payload, "POST");
}

export async function reprogramarCita(payload) {
    return createApiConn(TERAPIA_ENDPOINTS.CITAS_REPROGRAMAR, payload, "POST");
}

export async function actualizarEstadoCita(payload) {
    return createApiConn(TERAPIA_ENDPOINTS.CITAS_ESTADO_ACTUALIZAR, payload, "POST");
}
export async function obtenerHorarios(payload) {
    return createApiConn(TERAPIA_ENDPOINTS.HORARIOS_OBTENER, payload, "POST");
}

export async function crearHorario(payload) {
    return createApiConn(TERAPIA_ENDPOINTS.HORARIOS_CREAR, payload, "POST");
}

export async function apagarHorario(payload) {
    return createApiConn(TERAPIA_ENDPOINTS.HORARIOS_APAGAR, payload, "POST");
}
