import { CalendarCheck, HeartHandshake, MessageSquare } from "lucide-react";
import { ProfileCard } from "@/features/dashboard/profile-card";
import { StatCard } from "@/features/dashboard/stat-card";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export default function PatientDashboardPage() {
  return (
    <div className="grid gap-8">
      <PageHeader title="Mi portal" description="Resumen de tu proceso y próximos pasos dentro de Corazón Migrante." />
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Próxima cita" value="Pendiente" description="Se actualizará cuando el sistema confirme disponibilidad." />
        <StatCard label="Solicitudes" value="0" description="Las solicitudes se muestran con paginación real." />
        <StatCard label="Estado" value="Activo" description="Estado visual local, pendiente de contrato real." />
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <ProfileCard />
        <Card>
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            {[
              { icon: CalendarCheck, title: "Citas", text: "Consulta y gestiona tus solicitudes." },
              { icon: HeartHandshake, title: "Acompañamiento", text: "Revisa información de tu proceso." },
              { icon: MessageSquare, title: "Mensajes", text: "Pendiente de activar en el sistema." }
            ].map((item) => (
              <div className="rounded-2xl border bg-background p-4" key={item.title}>
                <item.icon className="h-6 w-6 text-primary" />
                <p className="mt-4 font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
