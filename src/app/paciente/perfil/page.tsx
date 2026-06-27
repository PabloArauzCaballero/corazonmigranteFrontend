import { ProfileCard } from "@/features/dashboard/profile-card";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export default function PatientProfilePage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Perfil" description="Datos básicos visibles. La edición completa debe usar contrato real del backend." />
      <ProfileCard />
      <Card>
        <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
          PENDIENTE_CM: confirmar campos editables, validaciones, documentación sensible y reglas de actualización para pacientes.
        </CardContent>
      </Card>
    </div>
  );
}
