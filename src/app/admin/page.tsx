import Link from "next/link";
import { Activity, CalendarDays, Megaphone, ReceiptText, UsersRound, Bell } from "lucide-react";
import { AdminOverview } from "@/features/dashboard/admin-overview";
import { ProfileCard } from "@/features/dashboard/profile-card";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        title="Panel principal"
        description="Bienvenido. Revisa las citas pendientes, administra usuarios y controla la contabilidad del centro."
      />

      <AdminOverview />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <ProfileCard />
        <Card>
          <CardContent className="p-6">
            <p className="mb-4 text-sm font-semibold text-muted-foreground">Accesos directos</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                { href: "/admin/solicitudes", icon: CalendarDays, title: "Citas" },
                { href: "/admin/usuarios", icon: UsersRound, title: "Usuarios" },
                { href: "/admin/publicidad", icon: Megaphone, title: "Publicidad" },
                { href: "/admin/contabilidad", icon: ReceiptText, title: "Contabilidad" },
                { href: "/admin/notificaciones", icon: Bell, title: "Notificaciones" },
              ].map((item) => (
                <Button asChild className="h-auto flex-col gap-2 py-4" variant="outline" key={item.href}>
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs">{item.title}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-start gap-4 p-6 text-sm leading-6 text-muted-foreground">
          <Activity className="mt-1 h-5 w-5 shrink-0 text-primary" />
          Todas las tablas usan búsqueda, filtros por estado y paginación real. Los datos son siempre los más recientes del servidor.
        </CardContent>
      </Card>
    </div>
  );
}
