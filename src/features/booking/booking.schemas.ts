import { z } from "zod";

export const timezoneDefault = "America/La_Paz";

export const patientBookingSchema = z.object({
  therapistUserId: z.string().uuid("Selecciona un terapeuta disponible."),
  productId: z.string().uuid("Selecciona un servicio valido."),
  scheduledDate: z.string().min(1, "Selecciona una fecha."),
  scheduledTime: z.string().min(1, "Selecciona una hora disponible."),
  timezone: z.string().min(3, "La zona horaria es obligatoria."),
  notesForTherapist: z.string().max(800, "Usa maximo 800 caracteres.").optional()
});

export type PatientBookingInput = z.infer<typeof patientBookingSchema>;

export const managedBookingSchema = patientBookingSchema.extend({
  patientUserId: z.string().uuid("Debes indicar el ID UUID del paciente.")
});

export type ManagedBookingInput = z.infer<typeof managedBookingSchema>;

export type BookingInput = PatientBookingInput;

export function buildScheduledStartAt(date: string, time: string) {
  if (time.includes("T")) return time;
  return `${date}T${time}:00`;
}
