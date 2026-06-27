import type { Metadata } from "next";
import { RegisterPatientForm } from "@/features/auth/register-patient-form";

export const metadata: Metadata = { title: "Registro paciente" };

export default function RegistroPage() {
  return (
    <section className="container py-16">
      <RegisterPatientForm />
    </section>
  );
}
