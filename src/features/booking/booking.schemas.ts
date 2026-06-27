import { z } from "zod";

export const bookingSchema = z.object({
  fullName: z.string().min(3, "Ingresa tu nombre completo."),
  email: z.string().email("Ingresa un correo válido."),
  country: z.string().min(2, "Indica tu país actual."),
  serviceId: z.string().min(1, "Selecciona un servicio."),
  preferredDate: z.string().min(1, "Selecciona una fecha."),
  preferredTime: z.string().min(1, "Selecciona una hora."),
  notes: z.string().max(800, "Usa máximo 800 caracteres.").optional()
});

export type BookingInput = z.infer<typeof bookingSchema>;
