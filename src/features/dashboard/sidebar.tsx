"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, CalendarDays, Crown, Files, HeartPulse, Home, LayoutDashboard, LogOut, Megaphone, Newspaper, Package, ReceiptText, Tags, UserCog, UserRound, UsersRound } from "lucide-react";
import { clearClientSession } from "@/shared/auth/cookies";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";

export type SidebarItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const patientNav: SidebarItem[] = [
  { href: "/paciente", label: "Resumen", icon: Home },
  { href: "/paciente/citas", label: "Mis citas", icon: CalendarDays },
  { href: "/paciente/booking", label: "Reservar cita", icon: HeartPulse },
  { href: "/paciente/premium", label: "Contenido premium", icon: Crown },
  { href: "/paciente/perfil", label: "Perfil", icon: UserRound }
];

export const therapistNav: SidebarItem[] = [
  { href: "/terapeuta", label: "Resumen", icon: LayoutDashboard },
  { href: "/terapeuta/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/terapeuta/booking", label: "Disponibilidad", icon: HeartPulse },
  { href: "/terapeuta/perfil", label: "Perfil", icon: UserRound }
];

export const adminNav: SidebarItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: CalendarDays },
  { href: "/admin/booking", label: "Disponibilidad", icon: HeartPulse },
  { href: "/admin/usuarios", label: "Usuarios", icon: UsersRound },
  { href: "/admin/productos/enfoques", label: "Enfoques", icon: HeartPulse },
  { href: "/admin/productos/servicios", label: "Servicios", icon: Package },
  { href: "/biblioteca", label: "Vistas publicas", icon: Files },
  { href: "/novedades", label: "Novedades publicas", icon: Newspaper },
  { href: "/admin/contenido/editorial", label: "Biblioteca CMS", icon: BookOpen },
  { href: "/admin/contenido/publicaciones", label: "Publicaciones", icon: Newspaper },
  { href: "/admin/contenido/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/contenido/tags", label: "Tags", icon: Tags },
  { href: "/admin/contenido/autores", label: "Autores", icon: UserRound },
  { href: "/admin/contenido/suscriptores", label: "Suscriptores", icon: UsersRound },
  { href: "/admin/contenido/homepage", label: "Portada", icon: Home },
  { href: "/admin/publicidad", label: "Publicidad", icon: Megaphone },
  { href: "/admin/contabilidad", label: "Contabilidad", icon: ReceiptText },
  { href: "/admin/contabilidad/cuentas", label: "Cuentas", icon: UserCog }
];

export function DashboardShell({ navItems, title, children }: { navItems: SidebarItem[]; title: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearClientSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card/95 p-5 backdrop-blur lg:block">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><HeartPulse className="h-6 w-6" /></span>
          <span>{title}<span className="block text-xs font-medium text-muted-foreground">Corazon Migrante</span></span>
        </Link>
        <nav className="mt-8 grid gap-2" aria-label="Navegacion del panel">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                href={item.href}
                key={item.href}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button className="absolute bottom-5 left-5 right-5" onClick={logout} variant="outline">
          <LogOut className="h-4 w-4" /> Cerrar sesion
        </Button>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur lg:hidden">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="font-bold">{title}</Link>
            <Button onClick={logout} size="sm" variant="outline">Salir</Button>
          </div>
          <nav className="container flex gap-2 overflow-x-auto pb-3" aria-label="Navegacion movil">
            {navItems.map((item) => (
              <Link className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold" href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
        </header>
        <main className="container py-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
