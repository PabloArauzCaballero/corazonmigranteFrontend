import { z } from "zod";

export const timezoneDefault = "America/La_Paz";

export const bookingTimezoneOptions = [
  { value: "America/La_Paz", label: "Bolivia (La Paz, Santa Cruz, Cochabamba)" },
  { value: "America/Lima", label: "Perú (Lima)" },
  { value: "America/Bogota", label: "Colombia (Bogotá)" },
  { value: "America/Guayaquil", label: "Ecuador (Guayaquil, Quito)" },
  { value: "America/Santiago", label: "Chile (Santiago)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (Buenos Aires)" },
  { value: "America/Asuncion", label: "Paraguay (Asunción)" },
  { value: "America/Montevideo", label: "Uruguay (Montevideo)" },
  { value: "America/Sao_Paulo", label: "Brasil (São Paulo)" },
  { value: "America/Mexico_City", label: "México (Ciudad de México)" },
  { value: "America/New_York", label: "EE. UU. (Este)" },
  { value: "America/Chicago", label: "EE. UU. (Centro)" },
  { value: "America/Los_Angeles", label: "EE. UU. (Pacífico)" },
  { value: "Europe/Madrid", label: "España (Madrid)" }
] as const;

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
