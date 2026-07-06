import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { ApiError } from "@/shared/api/errors";
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

function normalizeTherapistResult(payload: unknown) {
  const result = normalizePaginatedResponse(payload, mapBookingTherapist, { page: 1, pageSize: 100 });
  return result.items.filter((therapist) => therapist.id && !therapist.id.startsWith("terapeuta-"));
}

const therapistDirectoryQuery = buildQueryString({
  page: 1,
  pageSize: 100,
  role: "THERAPIST",
  rol: "TERAPEUTA",
  status: "activo"
});

/**
 * Directorio de terapeutas consciente del rol:
 * - ADMIN / SUPER_ADMIN / CONTADOR usan `GET /admin/users?role=THERAPIST` (autorizado por el OpenAPI).
 * - PACIENTE / TERAPEUTA / anónimo NUNCA envían su token a la ruta administrativa (eso causaba el 403).
 *   Para ellos se intentan fuentes públicas en orden y se devuelve la primera que responda.
 */
export async function listBookingTherapists(options: { canUseAdminDirectory?: boolean } = {}) {
  if (options.canUseAdminDirectory) {
    const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${therapistDirectoryQuery}`);
    return normalizeTherapistResult(payload);
  }

  // 1) Intento público directo (sin Authorization) por si el backend expone el directorio sin rol admin.
  try {
    const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${therapistDirectoryQuery}`, { auth: false });
    const items = normalizeTherapistResult(payload);
    if (items.length > 0) return items;
  } catch {
    // continúa con las siguientes fuentes
  }

  // 2) Páginas CMS públicas que pueden alojar el directorio de terapeutas.
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

  throw new ApiError(
    "El directorio público de terapeutas no está disponible todavía en el backend. Un administrador puede reservar por ti mientras se habilita.",
    404
  );
}

export type PatientOption = {
  id: string;
  name: string;
  email: string;
};

export function mapPatientOption(item: unknown, index: number): PatientOption {
  const record = isRecord(item) ? item : {};
  const firstName = getString(record, ["firstName", "first_name", "nombres", "nombre"], "");
  const lastName = getString(record, ["lastName", "last_name", "apellidos", "apellido"], "");
  const composed = `${firstName} ${lastName}`.trim();
  return {
    id: getString(record, ["id", "userId", "user_id", "uuid"], `paciente-${index + 1}`),
    name: getString(record, ["name", "full_name", "nombre_completo", "fullName", "displayName"], composed || `Paciente ${index + 1}`),
    email: getString(record, ["email", "correo", "correo_electronico"], "")
  };
}

/** Lista desplegable de usuarios finales (pacientes) para booking operativo. Requiere rol administrativo. */
export async function listPatientOptions(search = "") {
  const query = buildQueryString({
    page: 1,
    pageSize: 100,
    role: "PATIENT",
    rol: "PACIENTE",
    search: search || undefined
  });
  const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${query}`);
  const result = normalizePaginatedResponse(payload, mapPatientOption, { page: 1, pageSize: 100 });
  return result.items.filter((patient) => patient.id && !patient.id.startsWith("paciente-"));
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
 * El OpenAPI documenta `from`/`to` como fecha simple (YYYY-MM-DD), pero el backend en producción
 * rechaza ese formato con HTTP_400 "formato inválido" para ese mismo par de fechas. Como fallback
 * reintentamos con límites de día completo en ISO-8601 (formato date-time), que es lo que acepta
 * el validador real del backend.
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

/**
 * Booking operativo: crea la cita para un paciente concreto seleccionado por admin/terapeuta.
 * Envía `patientUserId` en el body de `POST /appointments`; si el backend rechaza al actor,
 * el error del servidor se muestra humanizado en el formulario.
 */
export async function createManagedBooking(input: ManagedBookingInput) {
  return apiRequest<{ id: string; status: string }>(ENDPOINTS.appointments.createForPatient, {
    method: "POST",
    body: {
      patientUserId: input.patientUserId,
      patient_user_id: input.patientUserId,
      therapistUserId: input.therapistUserId,
      productId: input.productId,
      scheduledStartAt: buildScheduledStartAt(input.scheduledDate, input.scheduledTime),
      timezone: input.timezone,
      notesForTherapist: input.notesForTherapist
    },
    auth: true
  });
}
