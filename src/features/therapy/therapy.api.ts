import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { getString, isRecord, normalizePaginatedResponse, normalizeStatus, type PaginatedResult } from "@/shared/api/normalizers";
import { buildQueryString, type SistemaListQuery } from "@/shared/api/query";

export type AppointmentRequestRow = {
  id: string;
  patient: string;
  therapist: string;
  service: string;
  approach: string;
  date: string;
  time: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  therapistUserId: string;
  productId: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
  rawStatus: string;
  isPaid: boolean;
  saleTransactionId: string;
  price: string;
};

export type PatientAppointmentRow = {
  id: string;
  date: string;
  service: string;
  therapist: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
  rawStatus: string;
};

const CANCELLABLE_APPOINTMENT_STATUSES = new Set(["REQUESTED", "CONFIRMED"]);

export function isAppointmentCancellable(rawStatus: string) {
  return CANCELLABLE_APPOINTMENT_STATUSES.has(rawStatus.toUpperCase());
}

export type TherapistAgendaRow = {
  id: string;
  date: string;
  time: string;
  patient: string;
  service: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

function nestedRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return undefined;
}

function fullName(profile: Record<string, unknown> | undefined, fallback: string) {
  if (!profile) return fallback;
  const first = getString(profile, ["firstName", "first_name", "nombres"], "");
  const last = getString(profile, ["lastName", "last_name", "apellidos"], "");
  const combined = [first, last].filter(Boolean).join(" ").trim();
  return combined || fallback;
}

export function mapAppointmentRequest(item: unknown, index: number): AppointmentRequestRow {
  const record = isRecord(item) ? item : {};
  const patientUser = nestedRecord(record, ["patient"]);
  const patientProfile = patientUser ? nestedRecord(patientUser, ["patientProfile", "patient_profile"]) : undefined;
  const therapistUser = nestedRecord(record, ["therapist"]);
  const therapistProfile = therapistUser ? nestedRecord(therapistUser, ["therapistProfile", "therapist_profile"]) : undefined;
  const product = nestedRecord(record, ["product"]);
  const approach = product ? nestedRecord(product, ["approach"]) : undefined;
  const scheduledStartAt = getString(record, ["scheduledStartAt", "scheduled_start_at", "fecha", "fecha_hora", "date", "scheduled_at", "fecha_preferida"], "");
  const scheduledEndAt = getString(record, ["scheduledEndAt", "scheduled_end_at"], "");
  const startDate = scheduledStartAt ? new Date(scheduledStartAt) : undefined;

  return {
    id: getString(record, ["id", "cita_id", "id_cita", "solicitud_id", "uuid"], `solicitud-${index + 1}`),
    patient: fullName(patientProfile, getString(record, ["paciente", "patient", "patientName", "nombre_paciente", "nombre", "full_name"], "Paciente sin nombre")),
    therapist: fullName(therapistProfile, getString(record, ["terapeuta", "therapistName", "nombre_terapeuta"], "Por asignar")),
    service: getString(product ?? record, ["name", "servicio", "service", "productName", "producto", "producto_nombre", "tipo_servicio"], "Servicio no especificado"),
    approach: getString(approach ?? {}, ["name"], "Sin enfoque"),
    date: startDate && !Number.isNaN(startDate.getTime()) ? new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" }).format(startDate) : scheduledStartAt || "Pendiente",
    time: startDate && !Number.isNaN(startDate.getTime()) ? new Intl.DateTimeFormat("es-BO", { timeStyle: "short" }).format(startDate) : "—",
    scheduledStartAt,
    scheduledEndAt,
    therapistUserId: getString(therapistUser ?? {}, ["id"], getString(record, ["therapistUserId", "therapist_user_id"], "")),
    productId: getString(product ?? {}, ["id"], getString(record, ["productId", "product_id"], "")),
    status: normalizeStatus(record.estado ?? record.status),
    rawStatus: getString(record, ["status", "estado"], "REQUESTED"),
    isPaid: Boolean(record.isPaid ?? record.is_paid ?? false),
    saleTransactionId: getString(record, ["saleTransactionId", "sale_transaction_id"], ""),
    price: getString(record, ["price", "precio"], "")
  };
}

export function mapPatientAppointment(item: unknown, index: number): PatientAppointmentRow {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "cita_id", "id_cita", "uuid"], `cita-${index + 1}`),
    date: getString(record, ["fecha", "fecha_hora", "date", "scheduledStartAt", "scheduled_start_at", "scheduled_at", "fecha_preferida"], "Pendiente"),
    service: getString(record, ["servicio", "service", "productName", "product_id", "productId", "producto", "producto_nombre", "tipo_servicio"], "Servicio no especificado"),
    therapist: getString(record, ["terapeuta", "therapist", "therapistName", "therapist_user_id", "therapistUserId", "nombre_terapeuta"], "Por asignar"),
    status: normalizeStatus(record.estado ?? record.status),
    rawStatus: getString(record, ["status", "estado"], "REQUESTED")
  };
}

export async function listAppointmentRequests(query: SistemaListQuery = {}): Promise<PaginatedResult<AppointmentRequestRow>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.therapy.appointmentRequests}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapAppointmentRequest, query);
}

export type UpdateAdminAppointmentInput = Partial<{
  therapistUserId: string;
  productId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: string;
  adminNotes: string;
}>;

export async function updateAdminAppointment(appointmentId: string, input: UpdateAdminAppointmentInput) {
  const body = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== ""));
  return apiRequest<unknown>(ENDPOINTS.therapy.adminUpdateAppointment.replace(":appointmentId", appointmentId), {
    method: "PATCH",
    body
  });
}

export async function updateAppointmentPayment(appointmentId: string, isPaid: boolean) {
  return apiRequest<unknown>(ENDPOINTS.therapy.adminUpdateAppointmentPayment.replace(":appointmentId", appointmentId), {
    method: "PATCH",
    body: { isPaid }
  });
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

export async function cancelPatientAppointment(appointmentId: string) {
  return apiRequest<unknown>(ENDPOINTS.therapy.updateAppointmentStatus.replace(":appointmentId", appointmentId), {
    method: "PATCH",
    body: { status: "CANCELLED_BY_PATIENT" }
  });
}

export async function listTherapistAgenda(query: SistemaListQuery = {}): Promise<PaginatedResult<TherapistAgendaRow>> {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.therapy.therapistAgenda}${buildQueryString(query)}`);
  return normalizePaginatedResponse(payload, mapTherapistAgenda, query);
}

export type TherapistScheduleRow = {
  id: string;
  weekday: number;
  weekdayLabel: string;
  startTime: string;
  endTime: string;
  timezone: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
};

const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export type TherapistScheduleInput = {
  weekday: number;
  startTime: string;
  endTime: string;
  timezone: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export function mapTherapistSchedule(item: unknown, index: number): TherapistScheduleRow {
  const record = isRecord(item) ? item : {};
  const weekday = Number(getString(record, ["weekday", "dia", "dia_semana"], "0"));
  return {
    id: getString(record, ["id", "schedule_id", "uuid"], `horario-${index + 1}`),
    weekday,
    weekdayLabel: WEEKDAY_LABELS[weekday] ?? "—",
    startTime: getString(record, ["startTime", "start_time", "hora_inicio"], "—").slice(0, 5),
    endTime: getString(record, ["endTime", "end_time", "hora_fin"], "—").slice(0, 5),
    timezone: getString(record, ["timezone", "timeZone", "zonaHoraria"], "America/La_Paz"),
    effectiveFrom: getString(record, ["effectiveFrom", "effective_from", "vigente_desde"], "—"),
    effectiveTo: getString(record, ["effectiveTo", "effective_to", "vigente_hasta"], ""),
    status: getString(record, ["status", "estado"], "ACTIVE")
  };
}

function adminSchedulesPath(therapistUserId: string) {
  return ENDPOINTS.therapy.adminTherapistSchedules.replace(":therapistUserId", therapistUserId);
}

function adminSchedulePath(therapistUserId: string, scheduleId: string) {
  return ENDPOINTS.therapy.adminTherapistScheduleById
    .replace(":therapistUserId", therapistUserId)
    .replace(":scheduleId", scheduleId);
}

function cleanScheduleInput(input: Partial<TherapistScheduleInput>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      return true;
    })
  );
}

export async function listAdminTherapistSchedules(therapistUserId: string) {
  const payload = await apiRequest<unknown>(adminSchedulesPath(therapistUserId));
  return normalizePaginatedResponse(payload, mapTherapistSchedule, { page: 1, pageSize: 100 }).items;
}

export async function createAdminTherapistSchedule(therapistUserId: string, input: TherapistScheduleInput) {
  return apiRequest<unknown>(adminSchedulesPath(therapistUserId), {
    method: "POST",
    body: cleanScheduleInput(input)
  });
}

export async function updateAdminTherapistSchedule(therapistUserId: string, scheduleId: string, input: Partial<TherapistScheduleInput>) {
  return apiRequest<unknown>(adminSchedulePath(therapistUserId, scheduleId), {
    method: "PATCH",
    body: cleanScheduleInput(input)
  });
}

export async function deactivateAdminTherapistSchedule(therapistUserId: string, scheduleId: string) {
  return apiRequest<unknown>(adminSchedulePath(therapistUserId, scheduleId), { method: "DELETE" });
}
