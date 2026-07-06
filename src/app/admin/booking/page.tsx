import type { Metadata } from "next";
import { ManagedBookingForm } from "@/features/booking/booking-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Disponibilidad administrativa" };

export default function AdminBookingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Disponibilidad administrativa" description="Agenda citas para un paciente concreto: selecciona el usuario final, el terapeuta, el servicio y el horario disponible." />
      <ManagedBookingForm actorLabel="administrador" />
    </div>
  );
}
