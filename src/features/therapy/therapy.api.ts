import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";

export type AppointmentRequestRow = {
  id: string;
  patient: string;
  service: string;
  date: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

export type PatientAppointmentRow = {
  id: string;
  date: string;
  service: string;
  therapist: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

export type TherapistAgendaRow = {
  id: string;
  date: string;
  time: string;
  patient: string;
  service: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

export function mapAppointmentRequest(item: unknown, index: number): AppointmentRequestRow {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "cita_id", "id_cita", "solicitud_id", "uuid"], `solicitud-${index + 1}`),
    patient: getString(record, ["paciente", "patient", "patientName", "patient_user_id", "patientUserId", "nombre_paciente", "nombre", "full_name"], "Paciente sin nombre"),
    service: getString(record, ["servicio", "service", "productName", "product_id", "productId", "producto", "producto_nombre", "tipo_servicio"], "Servicio no especificado"),
    date: getString(record, ["fecha", "fecha_hora", "date", "scheduledStartAt", "scheduled_start_at", "scheduled_at", "fecha_preferida"], "Pendiente"),
    status: normalizeStatus(record.estado ?? record.status)
  };
}

export function mapPatientAppointment(item: unknown, index: number): PatientAppointmentRow {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "cita_id", "id_cita", "uuid"], `cita-${index + 1}`),
    date: getString(record, ["fecha", "fecha_hora", "date", "scheduledStartAt", "scheduled_start_at", "scheduled_at", "fecha_preferida"], "Pendiente"),
    service: getString(record, ["servicio", "service", "productName", "product_id", "productId", "producto", "producto_nombre", "tipo_servicio"], "Servicio no especificado"),
    therapist: getString(record, ["terapeuta", "therapist", "therapistName", "therapist_user_id", "therapistUserId", "nombre_terapeuta"], "Por asignar"),
    status: normalizeStatus(record.estado ?? record.status)
  };
}

export async function listAppointmentRequests(query: SistemaListQuery = {}): Promise<PaginatedResult<AppointmentRequestRow>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.therapy.appointmentRequests}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapAppointmentRequest, query);
}

export function mapTherapistAgenda(item: unknown, index: number): TherapistAgendaRow {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "cita_id", "id_cita", "agenda_id", "uuid"], `agenda-${index + 1}`),
    date: getString(record, ["fecha", "fecha_hora", "date", "scheduledStartAt", "scheduled_start_at", "scheduled_at", "fecha_preferida"], "Pendiente"),
    time: getString(record, ["hora", "time", "hora_preferida", "scheduledTime", "scheduled_time"], "Pendiente"),
    patient: getString(record, ["paciente", "patient", "patientName", "patient_user_id", "patientUserId", "nombre_paciente", "nombre", "full_name"], "Paciente sin nombre"),
    service: getString(record, ["servicio", "service", "productName", "product_id", "productId", "producto", "producto_nombre", "tipo_servicio"], "Servicio no especificado"),
    status: normalizeStatus(record.estado ?? record.status)
  };
}

export async function listPatientAppointments(query: SistemaListQuery = {}): Promise<PaginatedResult<PatientAppointmentRow>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.therapy.patientAppointments}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapPatientAppointment, query);
}

export async function listTherapistAgenda(query: SistemaListQuery = {}): Promise<PaginatedResult<TherapistAgendaRow>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.therapy.therapistAgenda}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapTherapistAgenda, query);
}
