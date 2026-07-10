import type { Metadata } from "next";
import { ManagedBookingForm } from "@/features/booking/booking-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Disponibilidad administrativa" };

export default function AdminBookingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Agendar una cita" description="Usa este formulario para crear una cita nueva en nombre de un paciente. Elige el paciente, el terapeuta, el servicio y un horario disponible; el sistema se encarga del resto." />
      <ManagedBookingForm actorLabel="administrador" />
    </div>
  );
}
