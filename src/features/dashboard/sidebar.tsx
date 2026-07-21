"use client";

import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, BookOpen, CalendarDays, ChevronDown, Clock3, Crown, Download, Files, HeartPulse,
  Home, LayoutDashboard, LogOut, Megaphone, Newspaper, Package, ReceiptText,
  Tags, UserCog, UserRound, UsersRound,
} from "lucide-react";
import { clearClientSession } from "@/shared/auth/cookies";
import { fileServer } from "@/config/file-server";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { NotificationBell } from "@/features/notifications/notification-bell";

export type SidebarItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type SidebarGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: SidebarItem[];
};

export const patientNav: SidebarItem[] = [
  { href: "/paciente",         label: "Resumen",          icon: Home },
  { href: "/paciente/citas",   label: "Mis citas",        icon: CalendarDays },
  { href: "/paciente/booking", label: "Reservar cita",    icon: HeartPulse },
  { href: "/paciente/premium", label: "Contenido premium",icon: Crown },
  { href: "/paciente/descargables", label: "Mis descargables", icon: Download },
  { href: "/paciente/perfil",  label: "Perfil",           icon: UserRound },
];

export const therapistNav: SidebarItem[] = [
  { href: "/terapeuta",          label: "Resumen",        icon: LayoutDashboard },
  { href: "/terapeuta/agenda",   label: "Agenda",         icon: CalendarDays },
  { href: "/terapeuta/horarios", label: "Horarios",       icon: Clock3 },
  { href: "/terapeuta/booking",  label: "Disponibilidad", icon: HeartPulse },
  { href: "/terapeuta/perfil",   label: "Perfil",         icon: UserRound },
];

// Flat items for the admin nav (used in mobile horizontal scroll)
export const adminNav: SidebarItem[] = [
  { href: "/admin",                          label: "Panel principal",      icon: LayoutDashboard },
  { href: "/admin/notificaciones",           label: "Notificaciones",       icon: Bell },
  { href: "/admin/solicitudes",              label: "Citas de pacientes",   icon: CalendarDays },
  { href: "/admin/booking",                  label: "Agendar cita",         icon: HeartPulse },
  { href: "/admin/usuarios",                 label: "Personas registradas", icon: UsersRound },
  { href: "/admin/publicidad/empresas",      label: "Empresas",             icon: Megaphone },
  { href: "/admin/publicidad/ubicaciones",   label: "Ubicaciones",          icon: Megaphone },
  { href: "/admin/publicidad/campanas",      label: "Campañas",             icon: Megaphone },
  { href: "/admin/publicidad/creativos",     label: "Creativos",            icon: Megaphone },
  { href: "/admin/productos/enfoques",       label: "Enfoques",             icon: HeartPulse },
  { href: "/admin/productos/servicios",      label: "Servicios",            icon: Package },
  { href: "/admin/contenido/paginas",        label: "Páginas",              icon: Files },
  { href: "/admin/archivos",                 label: "Archivos",             icon: Files },
  { href: "/admin/contenido/publico",        label: "Noticias",             icon: BookOpen },
  { href: "/admin/contenido/publicaciones",  label: "Publicaciones",        icon: Newspaper },
  { href: "/admin/contenido/categorias",     label: "Categorías",           icon: Tags },
  { href: "/admin/contenido/tags",           label: "Etiquetas",            icon: Tags },
  { href: "/admin/contenido/autores",        label: "Autores",              icon: UserRound },
  { href: "/admin/contenido/suscriptores",   label: "Suscriptores",         icon: UsersRound },
  { href: "/admin/contenido/homepage",       label: "Portada",              icon: Home },
  { href: "/admin/contabilidad",             label: "Contabilidad",         icon: ReceiptText },
  { href: "/admin/contabilidad/cuentas",     label: "Cuentas",              icon: UserCog },
];

// Structured nav for desktop sidebar — Publicidad as collapsible group
type NavEntry =
  | { kind: "link"; href: string; label: string; icon: ComponentType<{ className?: string }> }
  | { kind: "group"; label: string; icon: ComponentType<{ className?: string }>; items: SidebarItem[] };

const adminDesktopNav: NavEntry[] = [
  { kind: "link", href: "/admin",                        label: "Panel principal",      icon: LayoutDashboard },
  { kind: "link", href: "/admin/notificaciones",         label: "Notificaciones",       icon: Bell },
  { kind: "link", href: "/admin/solicitudes",            label: "Citas de pacientes",   icon: CalendarDays },
  { kind: "link", href: "/admin/booking",                label: "Agendar cita",         icon: HeartPulse },
  { kind: "link", href: "/admin/usuarios",               label: "Personas registradas", icon: UsersRound },
  { kind: "link", href: "/admin/descargables",           label: "Descargables",         icon: Download },
  {
    kind: "group",
    label: "Publicidad",
    icon: Megaphone,
    items: [
      { href: "/admin/publicidad/empresas",    label: "Empresas",    icon: Megaphone },
      { href: "/admin/publicidad/ubicaciones", label: "Ubicaciones", icon: Megaphone },
      { href: "/admin/publicidad/campanas",    label: "Campañas",    icon: Megaphone },
      { href: "/admin/publicidad/creativos",   label: "Creativos",   icon: Megaphone },
    ],
  },
  { kind: "link", href: "/admin/productos/enfoques",      label: "Enfoques terapéuticos", icon: HeartPulse },
  { kind: "link", href: "/admin/productos/servicios",     label: "Servicios",              icon: Package },
  { kind: "link", href: "/admin/contenido/paginas",       label: "Páginas del sitio",      icon: Files },
  { kind: "link", href: "/admin/archivos",                label: "Archivos y medios",      icon: Files },
  { kind: "link", href: "/admin/contenido/publico",       label: "Noticias y columnas",    icon: BookOpen },
  { kind: "link", href: "/admin/contenido/publicaciones", label: "Publicaciones",          icon: Newspaper },
  { kind: "link", href: "/admin/contenido/categorias",    label: "Categorías",             icon: Tags },
  { kind: "link", href: "/admin/contenido/tags",          label: "Etiquetas",              icon: Tags },
  { kind: "link", href: "/admin/contenido/autores",       label: "Autores",                icon: UserRound },
  { kind: "link", href: "/admin/contenido/suscriptores",  label: "Suscriptores premium",   icon: UsersRound },
  { kind: "link", href: "/admin/contenido/homepage",      label: "Portada del sitio",      icon: Home },
  { kind: "link", href: "/admin/contabilidad",            label: "Contabilidad",           icon: ReceiptText },
  { kind: "link", href: "/admin/contabilidad/cuentas",    label: "Cuentas contables",      icon: UserCog },
];

function isActive(href: string, pathname: string) {
  if (href === "/admin" || href === "/paciente" || href === "/terapeuta") return pathname === href;
  return pathname.startsWith(href);
}

function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: ComponentType<{ className?: string }>; pathname: string }) {
  const active = isActive(href, pathname);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-0.5"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-150", active ? "scale-110" : "group-hover:scale-105")} />
      <span className="truncate">{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary-foreground/60" />}
    </Link>
  );
}

function NavGroup({ entry, pathname }: { entry: Extract<NavEntry, { kind: "group" }>; pathname: string }) {
  const anyActive = entry.items.some((item) => isActive(item.href, pathname));
  const [open, setOpen] = useState(anyActive);
  const Icon = entry.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex w-full min-w-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150",
          anyActive ? "text-foreground" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{entry.label}</span>
        <ChevronDown
          className={cn("ml-auto h-4 w-4 shrink-0 transition-transform duration-200", open ? "rotate-180" : "")}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-3 mt-1 grid gap-0.5 border-l pl-3">
          {entry.items.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} pathname={pathname} />
          ))}
        </div>
      </div>
    </div>
  );
}

type DashboardShellProps = {
  navItems: SidebarItem[];
  title: string;
  children: ReactNode;
  showNotifications?: boolean;
};

export function DashboardShell({ navItems, title, children, showNotifications = false }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoFailed, setLogoFailed] = useState(false);

  function logout() {
    clearClientSession();
    router.replace("/login");
  }

  const showLogo = Boolean(fileServer.logoUrl) && !logoFailed;
  const isAdmin = navItems === adminNav;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-x-hidden border-r bg-card/95 p-4 backdrop-blur lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between gap-2 pb-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 font-bold">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm">
              {showLogo ? (
                <img src={fileServer.logoUrl} alt="Corazón Migrante" className="h-full w-full object-contain p-1" onError={() => setLogoFailed(true)} />
              ) : (
                <HeartPulse className="h-5 w-5 text-primary" />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm leading-tight">{title}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">Corazón Migrante</p>
            </div>
          </Link>
          {showNotifications && <div className="shrink-0"><NotificationBell /></div>}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-4" aria-label="Navegación del panel">
          <div className="grid gap-0.5">
            {isAdmin
              ? adminDesktopNav.map((entry, i) =>
                  entry.kind === "group"
                    ? <NavGroup key={i} entry={entry} pathname={pathname} />
                    : <NavLink key={entry.href} href={entry.href} label={entry.label} icon={entry.icon} pathname={pathname} />
                )
              : navItems.map((item) => (
                  <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} pathname={pathname} />
                ))
            }
          </div>
        </nav>

        {/* Logout */}
        <Button className="mt-2 w-full" onClick={logout} variant="outline" size="sm">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </Button>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur lg:hidden">
          <div className="container flex h-14 items-center justify-between gap-2">
            <Link href="/" className="flex min-w-0 items-center gap-2 font-bold">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white shadow-sm">
                {showLogo ? (
                  <img src={fileServer.logoUrl} alt="Corazón Migrante" className="h-full w-full object-contain p-0.5" onError={() => setLogoFailed(true)} />
                ) : (
                  <HeartPulse className="h-4 w-4 text-primary" />
                )}
              </span>
              <span className="truncate text-sm">{title}</span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {showNotifications && <NotificationBell />}
              <Button onClick={logout} size="sm" variant="outline">Salir</Button>
            </div>
          </div>
          <nav className="scrollbar-none container flex gap-1.5 overflow-x-auto pb-2 pt-1" aria-label="Navegación móvil">
            {navItems.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                    active ? "bg-primary text-primary-foreground shadow-sm" : "border bg-card hover:bg-muted"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="container py-8 md:py-10">
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
