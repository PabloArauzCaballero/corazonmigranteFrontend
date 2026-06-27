import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  roleHint: z.enum(["PACIENTE", "TERAPEUTA", "ADMIN", "SUPER_ADMIN", "CONTADOR"]).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerPatientSchema = z.object({
  fullName: z.string().min(3, "Ingresa tu nombre completo."),
  email: z.string().email("Ingresa un correo válido."),
  password: z.string().min(8, "Usa al menos 8 caracteres."),
  country: z.string().min(2, "Indica tu país actual."),
  reason: z.string().min(10, "Cuéntanos brevemente el motivo de consulta.")
});

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
