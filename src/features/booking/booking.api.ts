import { apiRequest } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { buildScheduledStartAt, type ManagedBookingInput, type PatientBookingInput } from "@/features/booking/booking.schemas";
import { buildQueryString } from "@/shared/api/query";
import { getNumber, getString, isRecord, normalizePaginatedResponse } from "@/shared/api/normalizers";

export type BookingProduct = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  currency: string;
};

export type BookingTherapist = {
  id: string;
  name: string;
  title: string;
  specialty: string;
  bio: string;
  personalPhrase: string;
  avatarUrl?: string;
  timezone: string;
};

export type AvailabilitySlot = {
  scheduledStartAt: string;
  scheduledEndAt?: string;
  timezone: string;
};

function unwrapPayload(payload: unknown) {
  if (isRecord(payload) && "data" in payload) return payload.data;
  return payload;
}

export function mapBookingProduct(item: unknown, index: number): BookingProduct {
  const record = isRecord(item) ? item : {};
  return {
    id: getString(record, ["id", "productId", "product_id", "producto_id", "uuid"], `producto-${index + 1}`),
    name: getString(record, ["name", "nombre", "title", "titulo"], "Servicio sin nombre"),
    description: getString(record, ["description", "descripcion", "shortDescription", "descripcion_corta"], ""),
    durationMinutes: getNumber(record, ["durationMinutes", "duration_minutes", "duracion_minutos"], 50),
    price: getNumber(record, ["price", "precio", "baseSessionPrice"], 0),
    currency: getString(record, ["currency", "moneda"], "BOB")
  };
}

function nestedRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return {};
}

function firstString(records: Record<string, unknown>[], keys: string[], fallback = "") {
  for (const record of records) {
    const value = getString(record, keys, "");
    if (value) return value;
  }
  return fallback;
}

export function mapBookingTherapist(item: unknown, index: number): BookingTherapist {
  const record = isRecord(item) ? item : {};
  const profile = nestedRecord(record, ["therapistProfile", "therapist_profile", "perfilTerapeuta", "profile", "perfil"]);
  const firstName = firstString([record, profile], ["firstName", "first_name", "nombre"], "");
  const lastName = firstString([record, profile], ["lastName", "last_name", "apellido"], "");
  const composedName = `${firstName} ${lastName}`.trim();
  const name = firstString([record, profile], ["name", "nombreCompleto", "fullName", "full_name", "displayName"], composedName || `Terapeuta ${index + 1}`);

  return {
    id: firstString([record, profile], ["id", "userId", "user_id", "therapistUserId", "therapist_user_id", "uuid"], `terapeuta-${index + 1}`),
    name,
    title: firstString([profile, record], ["title", "titulo", "professionalTitle"], "Terapeuta"),
    specialty: firstString([profile, record], ["mainSpecialty", "main_specialty", "specialty", "especialidad"], "Acompanamiento emocional"),
    bio: firstString([profile, record], ["bio", "biography", "descripcion"], ""),
    personalPhrase: firstString([profile, record], ["personalPhrase", "personal_phrase", "phrase", "frase"], ""),
    avatarUrl: firstString([profile, record], ["avatarUrl", "avatar_url", "photoUrl", "photo_url", "profileImageUrl", "imageUrl", "publicUrl"], "") || undefined,
    timezone: firstString([profile, record], ["timezone", "timeZone", "zonaHoraria"], "America/La_Paz")
  };
}

export function mapAvailabilitySlot(item: unknown, index: number): AvailabilitySlot {
  const record = isRecord(item) ? item : {};
  const scheduledStartAt = getString(record, ["scheduledStartAt", "startAt", "start", "fecha_hora", "dateTime", "datetime"], `slot-${index + 1}`);
  return {
    scheduledStartAt,
    scheduledEndAt: getString(record, ["scheduledEndAt", "endAt", "end"], ""),
    timezone: getString(record, ["timezone", "timeZone", "zonaHoraria"], "America/La_Paz")
  };
}

function normalizeAvailability(payload: unknown): AvailabilitySlot[] {
  const source = unwrapPayload(payload);
  if (Array.isArray(source)) return source.map(mapAvailabilitySlot);
  if (isRecord(source)) {
    const candidates = [source.items, source.slots, source.availability, source.disponibilidad, source.data];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate.map(mapAvailabilitySlot);
    }
  }
  return [];
}

export async function listBookingProducts() {
  const payload = await apiRequest<unknown>(`${ENDPOINTS.products.productsPublicList}${buildQueryString({ page: 1, pageSize: 100 })}`, { auth: false });
  return normalizePaginatedResponse(payload, mapBookingProduct, { page: 1, pageSize: 100 }).items;
}

function hasTherapistContractMarker(item: unknown) {
  const record = isRecord(item) ? item : {};
  const role = String(record.role ?? record.rol ?? record.roleCode ?? record.role_code ?? "").trim().toUpperCase();
  if (["THERAPIST", "TERAPEUTA"].includes(role)) return true;
  if (isRecord(record.therapistProfile) || isRecord(record.therapist_profile) || isRecord(record.perfilTerapeuta)) return true;
  return Boolean(
    getString(record, ["title", "titulo", "professionalTitle"], "") ||
      getString(record, ["mainSpecialty", "main_specialty", "specialty", "especialidad"], "") ||
      getString(record, ["approvalStatus", "approval_status"], "")
  );
}

function normalizeTherapistResult(payload: unknown, options: { requireMarker?: boolean } = {}) {
  const source = unwrapPayload(payload);
  const result = normalizePaginatedResponse(source, mapBookingTherapist, { page: 1, pageSize: 100 });
  const rawItems = normalizePaginatedResponse(source, (item) => item, { page: 1, pageSize: 100 }).items;
  return result.items.filter((therapist, index) => {
    if (!therapist.id || therapist.id.startsWith("terapeuta-")) return false;
    return options.requireMarker ? hasTherapistContractMarker(rawItems[index]) : true;
  });
}

const therapistDirectoryQuery = buildQueryString({ page: 1, pageSize: 100 });

/**
 * Directorio de terapeutas ajustado al servidor real:
 * - El servidor actual NO acepta role/rol/status en GET /admin/users.
 * - Si /admin/users no expone rol/perfil, no inventamos terapeutas a partir de usuarios genéricos.
 * - Como respaldo se revisan páginas públicas editoriales que podrían contener tarjetas de equipo.
 */
export async function listBookingTherapists(options: { canUseAdminDirectory?: boolean } = {}) {
  try {
    const payload = await apiRequest<unknown>(`${ENDPOINTS.booking.therapists}${therapistDirectoryQuery}`, { auth: false });
    const items = normalizeTherapistResult(payload);
    if (items.length > 0) return items;
  } catch {
    // Compatibilidad: si el servidor desplegado aún no tiene /booking/therapists,
    // probamos fuentes administrativas/públicas antiguas sin romper la pantalla.
  }

  if (options.canUseAdminDirectory) {
    try {
      const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${therapistDirectoryQuery}`);
      const items = normalizeTherapistResult(payload, { requireMarker: true });
      if (items.length > 0) return items;
    } catch {
      // continúa con contenido público
    }
  }

  const cmsSlugs = ["terapeutas", "equipo", "booking"];
  for (const slug of cmsSlugs) {
    try {
      const payload = await apiRequest<unknown>(ENDPOINTS.cms.publicPage.replace(":slug", slug), { auth: false });
      const items = normalizeTherapistResult(payload);
      if (items.length > 0) return items;
    } catch {
      // slug no existe, probar el siguiente
    }
  }

  return [];
}

export type PatientOption = {
  id: string;
  name: string;
  email: string;
};

export function mapPatientOption(item: unknown, index: number): PatientOption {
  const record = isRecord(item) ? item : {};
  const profile = nestedRecord(record, ["patientProfile", "patient_profile", "perfilPaciente", "profile"]);
  const firstName = firstString([profile, record], ["firstName", "first_name", "nombres", "nombre"], "");
  const lastName = firstString([profile, record], ["lastName", "last_name", "apellidos", "apellido"], "");
  const composed = `${firstName} ${lastName}`.trim();
  return {
    id: firstString([record, profile], ["id", "userId", "user_id", "uuid"], `paciente-${index + 1}`),
    name: firstString([record, profile], ["name", "full_name", "nombre_completo", "fullName", "displayName"], composed || `Paciente ${index + 1}`),
    email: getString(record, ["email", "correo", "correo_electronico"], "")
  };
}

function hasPatientContractMarker(item: unknown) {
  const record = isRecord(item) ? item : {};
  const role = String(record.role ?? record.rol ?? record.roleCode ?? record.role_code ?? "").trim().toUpperCase();
  const roles = Array.isArray(record.roles) ? record.roles.map((value) => String(value).trim().toUpperCase()) : [];
  if ([role, ...roles].some((value) => ["PATIENT", "PACIENTE"].includes(value))) return true;
  if (isRecord(record.patientProfile) || isRecord(record.patient_profile) || isRecord(record.perfilPaciente)) return true;
  return false;
}

/** Lista desplegable de usuarios finales (pacientes) para booking operativo. Requiere rol administrativo. */
export async function listPatientOptions(search = "") {
  const query = buildQueryString({
    page: 1,
    pageSize: 100,
    search: search || undefined
  });

  try {
    const payload = await apiRequest<unknown>(`${ENDPOINTS.users.patients}${query}`);
    const source = unwrapPayload(payload);
    return normalizePaginatedResponse(source, mapPatientOption, { page: 1, pageSize: 100 }).items
      .filter((patient) => patient.id && !patient.id.startsWith("paciente-"));
  } catch {
    // Compatibilidad con servidores previos al endpoint dedicado /admin/users/patients.
    const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${query}`);
    const source = unwrapPayload(payload);
    const raw = normalizePaginatedResponse(source, (item) => item, { page: 1, pageSize: 100 }).items;
    const mapped = normalizePaginatedResponse(source, mapPatientOption, { page: 1, pageSize: 100 }).items;
    return mapped.filter((patient, index) => patient.id && !patient.id.startsWith("paciente-") && hasPatientContractMarker(raw[index]));
  }
}

async function fetchAvailability(input: { therapistUserId: string; productId: string; from: string; to: string; timezone: string }) {
  const query = buildQueryString({
    therapistUserId: input.therapistUserId,
    productId: input.productId,
    from: input.from,
    to: input.to,
    timezone: input.timezone
  });
  const payload = await apiRequest<unknown>(`${ENDPOINTS.booking.availability}${query}`, { auth: false });
  return normalizeAvailability(payload);
}

/**
 * El OpenAPI documenta `from`/`to` como fecha simple (YYYY-MM-DD), pero el servidor real
 * rechaza ese formato con HTTP_400 para el mismo rango. Como respaldo reintentamos con
 * límites de día completo en ISO-8601, que es lo que acepta el validador real del backend.
 */
export async function getBookingAvailability(input: { therapistUserId: string; productId: string; from: string; to: string; timezone: string }) {
  try {
    return await fetchAvailability(input);
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      return await fetchAvailability({
        ...input,
        from: `${input.from}T00:00:00.000Z`,
        to: `${input.to}T23:59:59.999Z`
      });
    }
    throw error;
  }
}

export async function createPatientBooking(input: PatientBookingInput) {
  return apiRequest<{ id: string; status: string }>(ENDPOINTS.appointments.createMine, {
    method: "POST",
    body: {
      therapistUserId: input.therapistUserId,
      productId: input.productId,
      scheduledStartAt: buildScheduledStartAt(input.scheduledDate, input.scheduledTime),
      timezone: input.timezone,
      notesForTherapist: input.notesForTherapist
    },
    auth: true
  });
}

/** Booking asistido: ADMIN/SUPER_ADMIN/TERAPEUTA registran una cita para un paciente concreto. */
export async function createManagedBooking(input: ManagedBookingInput) {
  return apiRequest<{ id: string; status: string }>(ENDPOINTS.appointments.createForPatient, {
    method: "POST",
    body: {
      patientUserId: input.patientUserId,
      therapistUserId: input.therapistUserId,
      productId: input.productId,
      scheduledStartAt: buildScheduledStartAt(input.scheduledDate, input.scheduledTime),
      timezone: input.timezone,
      notesForTherapist: input.notesForTherapist
    },
    auth: true
  });
}
