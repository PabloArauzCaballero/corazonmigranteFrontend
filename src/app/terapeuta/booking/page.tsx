import type { Metadata } from "next";
import { ManagedBookingForm } from "@/features/booking/booking-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Disponibilidad de pacientes" };

export default function TherapistBookingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Disponibilidad para paciente" description="Consulta disponibilidad y registra citas para un paciente concreto." />
      <ManagedBookingForm actorLabel="terapeuta" />
    </div>
  );
}
