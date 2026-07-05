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

export async function listBookingTherapists() {
  const query = buildQueryString({
    page: 1,
    pageSize: 100,
    role: "TERAPEUTA",
    rol: "TERAPEUTA",
    status: "activo"
  });
  const payload = await apiRequest<unknown>(`${ENDPOINTS.users.list}${query}`);
  const result = normalizePaginatedResponse(payload, mapBookingTherapist, { page: 1, pageSize: 100 });
  return result.items.filter((therapist) => therapist.id && !therapist.id.startsWith("terapeuta-"));
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

export async function createManagedBooking(_input: ManagedBookingInput) {
  throw new ApiError(
    `La creación operativa de citas para pacientes concretos todavía no está habilitada para este rol.`,
    501
  );
}
