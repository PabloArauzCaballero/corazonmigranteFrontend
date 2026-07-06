import type { Metadata } from "next";
import { TherapistScheduleManager } from "@/features/therapy/schedule-manager";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Horarios de atención" };

export default function TherapistSchedulesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Horarios de atención" description="Configura tus horarios recurrentes y bloqueos de agenda. Alimentan la disponibilidad pública de reservas." />
      <TherapistScheduleManager />
    </div>
  );
}
