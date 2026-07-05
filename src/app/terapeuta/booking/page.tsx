import type { Metadata } from "next";
import { ManagedBookingForm } from "@/features/booking/booking-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Disponibilidad de pacientes" };

export default function TherapistBookingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Disponibilidad para paciente" description="Consulta terapeutas, servicios y horarios calculados. La creacion operativa requiere endpoint dedicado del backend." />
      <ManagedBookingForm actorLabel="terapeuta" />
    </div>
  );
}
