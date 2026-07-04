import type { Metadata } from "next";
import { PatientBookingForm } from "@/features/booking/booking-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Reservar cita" };

export default function PatientBookingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Reservar cita" description="Reserva protegida: solo paciente autenticado y la identidad se toma desde el JWT." />
      <PatientBookingForm />
    </div>
  );
}
