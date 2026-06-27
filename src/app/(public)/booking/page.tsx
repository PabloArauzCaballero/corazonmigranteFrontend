import type { Metadata } from "next";
import { BookingForm } from "@/features/booking/booking-form";

export const metadata: Metadata = { title: "Solicitar cita" };

export default function BookingPage() {
  return (
    <section className="container py-16">
      <BookingForm />
    </section>
  );
}
