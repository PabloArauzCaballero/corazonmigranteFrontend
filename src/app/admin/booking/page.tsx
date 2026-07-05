import type { Metadata } from "next";
import { ManagedBookingForm } from "@/features/booking/booking-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Disponibilidad administrativa" };

export default function AdminBookingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Disponibilidad administrativa" description="Vista operativa para consultar terapeuta, servicio y horario. Crear sesiones por otro paciente no esta expuesto en el OpenAPI actual." />
      <ManagedBookingForm actorLabel="administrador" />
    </div>
  );
}
