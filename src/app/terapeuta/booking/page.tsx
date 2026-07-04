import type { Metadata } from "next";
import { ManagedBookingForm } from "@/features/booking/booking-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Agendar paciente" };

export default function TherapistBookingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Agendar paciente" description="Vista para preparar una cita de un paciente concreto desde el portal terapeuta." />
      <ManagedBookingForm actorLabel="terapeuta" />
    </div>
  );
}
