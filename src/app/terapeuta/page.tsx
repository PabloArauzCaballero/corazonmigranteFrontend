import { ProfileCard } from "@/features/dashboard/profile-card";
import { StatCard } from "@/features/dashboard/stat-card";
import { PageHeader } from "@/shared/ui/page-header";

export default function TherapistDashboardPage() {
  return (
    <div className="grid gap-8">
      <PageHeader title="Portal terapeuta" description="Resumen de agenda y solicitudes asignadas. No muestra información clínica sensible sin contrato confirmado." />
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Agenda de hoy" value="0" description="Pendiente de conectar a endpoint de agenda asignada." />
        <StatCard label="Solicitudes" value="0" description="Debe filtrar por terapeuta en backend." />
        <StatCard label="Disponibilidad" value="Configurable" description="Gestionada con horarios versionados." />
      </div>
      <ProfileCard />
    </div>
  );
}
