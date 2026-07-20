import type { Metadata } from "next";
import { BookingAuthWall } from "@/features/booking/booking-form";

export const metadata: Metadata = { title: "Reservar cita" };

export default function BookingPage() {
  return (
    <section className="container py-16">
      <BookingAuthWall />
    </section>
  );
}
