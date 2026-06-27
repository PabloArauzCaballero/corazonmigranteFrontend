import { ProfileCard } from "@/features/dashboard/profile-card";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export default function TherapistProfilePage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Perfil profesional" description="Información profesional del terapeuta, pendiente de contrato real para archivos, horarios y especialidades." />
      <ProfileCard />
      <Card><CardContent className="p-6 text-sm text-muted-foreground">PENDIENTE_CM: confirmar especialidades, profesiones, país/ciudad, imagen profesional y validaciones.</CardContent></Card>
    </div>
  );
}
