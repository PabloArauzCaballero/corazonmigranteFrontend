import { isDemoMode } from "@/config/env";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import type { BookingInput } from "@/features/booking/booking.schemas";

export type BookingBootstrap = {
  services: Array<{ id: string; name: string; description: string }>;
  availability: Array<{ date: string; times: string[] }>;
};

export async function getBookingBootstrap(): Promise<BookingBootstrap> {
  if (isDemoMode) return demoBookingBootstrap;
  return apiRequest<BookingBootstrap>(ENDPOINTS.therapy.bookingBootstrap, { auth: false });
}

export async function createBooking(input: BookingInput) {
  if (isDemoMode) return { ok: true, id: "demo-booking" };
  return apiRequest<{ ok: boolean; id: string }>(ENDPOINTS.therapy.createAppointment, {
    method: "POST",
    body: {
      nombre: input.fullName,
      email: input.email,
      pais_actual: input.country,
      producto_id: input.serviceId,
      fecha_preferida: input.preferredDate,
      hora_preferida: input.preferredTime,
      notas: input.notes
    },
    auth: false
  });
}

export const demoBookingBootstrap: BookingBootstrap = {
  services: [
    { id: "orientacion", name: "Orientación inicial", description: "Primer espacio para entender la necesidad y orientar el proceso." },
    { id: "acompanamiento", name: "Acompañamiento psicológico", description: "Sesiones de continuidad según disponibilidad profesional." },
    { id: "familia", name: "Orientación familiar", description: "Apoyo para procesos de adaptación y vínculos familiares." }
  ],
  availability: [
    { date: "2026-07-02", times: ["09:00", "15:00", "18:30"] },
    { date: "2026-07-03", times: ["10:00", "16:00"] },
    { date: "2026-07-06", times: ["08:30", "14:00", "19:00"] }
  ]
};
