import type { Metadata } from "next";
import { RegisterPatientForm } from "@/features/auth/register-patient-form";
import { AuthVisualLayout } from "@/shared/ui/auth-visual-layout";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Regístrate en Corazón Migrante para reservar sesiones de acompañamiento psicológico especializado para migrantes.",
  openGraph: {
    title: "Crear cuenta | Corazón Migrante",
    description: "Un espacio seguro y profesional para tu bienestar emocional durante la experiencia migratoria.",
  },
};

export default function RegistroPage() {
  return (
    <AuthVisualLayout title="Crea tu cuenta para reservar de forma segura.">
      <RegisterPatientForm />
    </AuthVisualLayout>
  );
}
