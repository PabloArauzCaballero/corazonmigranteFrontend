import type { Metadata } from "next";
import { ManagedBookingForm } from "@/features/booking/booking-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Booking administrativo" };

export default function AdminBookingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Booking administrativo" description="Agendamiento operativo para un paciente concreto. Respeta las autorizaciones del sistema." />
      <ManagedBookingForm actorLabel="administrador" />
    </div>
  );
}
