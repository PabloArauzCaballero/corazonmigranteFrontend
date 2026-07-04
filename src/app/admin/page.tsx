import Link from "next/link";
import { Activity, CalendarDays, ReceiptText, UsersRound } from "lucide-react";
import { AdminOverview } from "@/features/dashboard/admin-overview";
import { ProfileCard } from "@/features/dashboard/profile-card";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-8">
      <PageHeader title="Panel operativo" description="Centro de control para solicitudes, usuarios, contenido público, productos terapéuticos y contabilidad según permisos." />
      <AdminOverview />
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <ProfileCard />
        <Card>
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            {[
              { href: "/admin/solicitudes", icon: CalendarDays, title: "Solicitudes" },
              { href: "/admin/usuarios", icon: UsersRound, title: "Usuarios" },
              { href: "/admin/contabilidad", icon: ReceiptText, title: "Contabilidad" }
            ].map((item) => (
              <Button asChild className="h-auto justify-start p-4" variant="outline" key={item.href}>
                <Link href={item.href}><item.icon className="h-5 w-5" /> {item.title}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="flex items-start gap-4 p-6 text-sm leading-6 text-muted-foreground">
          <Activity className="mt-1 h-5 w-5 shrink-0 text-primary" />
          Todas las tablas administrativas usan filtros, búsqueda, ordenamiento y paginación real. Esto evita listas incompletas y datos inventados.
        </CardContent>
      </Card>
    </div>
  );
}
