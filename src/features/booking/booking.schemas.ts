import { z } from "zod";

export const timezoneDefault = "America/La_Paz";

export const patientBookingSchema = z.object({
  therapistUserId: z.string().uuid("Debes indicar el ID UUID del terapeuta."),
  productId: z.string().uuid("Selecciona un servicio válido."),
  scheduledDate: z.string().min(1, "Selecciona una fecha."),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Selecciona una hora válida en formato HH:mm."),
  timezone: z.string().min(3, "La zona horaria es obligatoria."),
  notesForTherapist: z.string().max(800, "Usa máximo 800 caracteres.").optional()
});

export type PatientBookingInput = z.infer<typeof patientBookingSchema>;

export const managedBookingSchema = patientBookingSchema.extend({
  patientUserId: z.string().uuid("Debes indicar el ID UUID del paciente.")
});

export type ManagedBookingInput = z.infer<typeof managedBookingSchema>;

export type BookingInput = PatientBookingInput;

export function buildScheduledStartAt(date: string, time: string) {
  return `${date}T${time}:00`;
}
