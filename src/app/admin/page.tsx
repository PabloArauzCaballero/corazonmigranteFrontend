import Link from "next/link";
import { Activity, CalendarDays, ReceiptText, UsersRound } from "lucide-react";
import { ProfileCard } from "@/features/dashboard/profile-card";
import { StatCard } from "@/features/dashboard/stat-card";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-8">
      <PageHeader title="Panel operativo" description="Centro de control para solicitudes, usuarios, contenido público, productos terapéuticos y contabilidad según permisos." />
      <div className="grid gap-5 md:grid-cols-4">
        <StatCard label="Solicitudes" value="2" description="Debe venir de /api/terapia/admin/citas/solicitudes/listar." />
        <StatCard label="Usuarios" value="3" description="Paginación y filtros server-side." />
        <StatCard label="Servicios" value="3" description="Catálogo conectado al backend." />
        <StatCard label="Contabilidad" value="Protegida" description="Acceso por permisos específicos." />
      </div>
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
          Todas las tablas administrativas de producción deben consultar el backend con filtros, búsqueda, ordenamiento y paginación real. Esta base deja el contrato documentado para no repetir el problema de listas limitadas a 100/200 registros.
        </CardContent>
      </Card>
    </div>
  );
}
