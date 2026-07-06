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
 * Directorio de terapeutas ajustado al backend real:
 * - El backend actual NO acepta role/rol/status en GET /admin/users.
 * - Si /admin/users no expone rol/perfil, no inventamos terapeutas a partir de usuarios genéricos.
 * - Como respaldo se revisan páginas CMS públicas que podrían contener tarjetas de equipo.
 */
export async function listBookingTherapists(options: { canUseAdminDirectory?: boolean } = {}) {
  if (options.canUseAdminDirectory) {
    try {
      const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${therapistDirectoryQuery}`);
      const items = normalizeTherapistResult(payload, { requireMarker: true });
      if (items.length > 0) return items;
    } catch {
      // continúa con CMS público
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

  throw new ApiError(
    "El backend actual no expone un directorio público de terapeutas. La ruta de disponibilidad existe, pero necesita un therapistUserId real; agrega un endpoint de directorio o publica terapeutas en CMS.",
    501
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
    search: search || undefined
  });
  const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${query}`);
  const result = normalizePaginatedResponse(payload, mapPatientOption, { page: 1, pageSize: 100 });
  return result.items.filter((patient) => patient.id && !patient.id.startsWith("paciente-"));
}

export async function getBookingAvailability(input: { therapistUserId: string; productId: string; from: string; to: string; timezone: string }) {
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

/** Booking operativo aún no soportado por el backend incluido en este zip. */
export async function createManagedBooking(_input: ManagedBookingInput) {
  throw new ApiError(
    "El backend actual solo permite POST /api/v1/appointments desde un usuario PACIENTE y no acepta patientUserId. Para booking administrativo falta un endpoint específico en el backend.",
    501
  );
}
