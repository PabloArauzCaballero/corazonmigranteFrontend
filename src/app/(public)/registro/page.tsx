import type { Metadata } from "next";
import { RegisterPatientForm } from "@/features/auth/register-patient-form";
import { AuthVisualLayout } from "@/shared/ui/auth-visual-layout";

export const metadata: Metadata = { title: "Registro paciente" };

export default function RegistroPage() {
  return (
    <AuthVisualLayout title="Crea tu cuenta para reservar de forma segura.">
      <RegisterPatientForm />
    </AuthVisualLayout>
  );
}
