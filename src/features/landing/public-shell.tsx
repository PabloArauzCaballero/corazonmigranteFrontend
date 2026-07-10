"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HeartPulse, LogOut, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { fileServer } from "@/config/file-server";
import { dashboardForRole } from "@/shared/auth/roles";
import { useSession } from "@/shared/auth/use-session";
import {
  contactHref,
  formatContactPhone,
  resolveContactPhone,
} from "@/features/landing/contact";
import { Button } from "@/shared/ui/button";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/novedades", label: "Contenido Público" },
  { href: "/privacidad", label: "Privacidad" },
];

export function PublicShell({ children }: { children: ReactNode }) {
  const phone = resolveContactPhone();
  const formattedPhone = formatContactPhone(phone);
  const { session, isReady, logout } = useSession();
  const portalHref = session ? dashboardForRole(session.role) : "/login";

  return (
    <div className="min-h-screen bg-[#fbf8f3]">
      <header className="sticky top-0 z-40 border-b border-[#331f1a]/10 bg-[#fbf8f3]/88 backdrop-blur-2xl">
        <div className="container flex h-20 items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-3 font-bold"
            aria-label="Ir al inicio de Corazón Migrante"
          >
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-[#331f1a]/10 bg-white shadow-sm transition group-hover:shadow-md">
              {fileServer.logoUrl ? (
                <img
                  src={fileServer.logoUrl}
                  alt="Corazón Migrante"
                  className="h-full w-full object-contain p-1.5"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <HeartPulse className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <span className="leading-tight text-[#2b1b17]">
              Corazón Migrante
              <span className="block text-xs font-medium text-[#6d675f]">
                Acompañamiento emocional
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Navegación pública"
          >
            {navItems.map((item) => (
              <Link
                className="relative text-sm font-semibold text-[#625e57] transition hover:text-primary after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {formattedPhone ? (
              <a
                className="hidden items-center gap-2 rounded-2xl border border-[#d9cec2] bg-white/70 px-4 py-2 text-sm font-semibold text-[#625e57] transition hover:bg-white xl:inline-flex"
                href={contactHref(phone)}
                target="_blank"
                rel="noreferrer"
              >
                <Phone className="h-4 w-4 text-primary" aria-hidden="true" />{" "}
                {formattedPhone}
              </a>
            ) : null}
            {isReady && session ? (
              <>
                <Button asChild className="rounded-2xl" variant="ghost">
                  <Link href={portalHref}>Mi portal</Link>
                </Button>
                <Button
                  className="rounded-2xl shadow-[0_16px_40px_rgba(99,48,35,0.20)]"
                  onClick={logout}
                  type="button"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Salir
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="rounded-2xl" variant="ghost">
                  <Link href="/login">Ingresar</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-2xl shadow-[0_16px_40px_rgba(99,48,35,0.20)]"
                >
                  <Link href="/registro">Crear cuenta</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <nav
          className="container flex gap-2 overflow-x-auto pb-3 md:hidden"
          aria-label="Navegación pública móvil"
        >
          {navItems.map((item) => (
            <Link
              className="shrink-0 rounded-full border border-[#331f1a]/10 bg-white/72 px-4 py-2 text-xs font-semibold text-[#625e57]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {isReady && session ? (
            <Link
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
              href={portalHref}
            >
              Mi portal
            </Link>
          ) : (
            <Link
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
              href="/login"
            >
              Ingresar
            </Link>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="relative overflow-hidden border-t border-white/10 bg-[#27120c] text-white">
        <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/16 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-[#8c4a62]/14 blur-3xl" />

        <div className="container relative grid gap-12 py-16 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-3 font-bold"
              aria-label="Ir al inicio de Corazón Migrante"
            >
              <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/95 shadow-sm">
                {fileServer.logoUrl ? (
                  <img
                    src={fileServer.logoUrl}
                    alt="Corazón Migrante"
                    className="h-full w-full object-contain p-1.5"
                  />
                ) : (
                  <HeartPulse className="h-5 w-5 text-primary" aria-hidden="true" />
                )}
              </span>
              <span className="text-lg leading-tight">Corazón Migrante</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
              Acompañamiento psicológico con una experiencia clara, humana y
              privada para personas migrantes.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Confidencial y profesional
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Navegación
            </p>
            <div className="mt-4 grid gap-3 text-sm text-white/68">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="transition hover:text-white"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Legal
            </p>
            <div className="mt-4 grid gap-3 text-sm text-white/68">
              <Link className="transition hover:text-white" href="/privacidad">
                Política de privacidad
              </Link>
              <Link className="transition hover:text-white" href="/terminos">
                Términos y condiciones
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Contacto
            </p>
            {formattedPhone ? (
              <a
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10"
                href={contactHref(phone)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                {formattedPhone}
              </a>
            ) : null}
            <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-white/50">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              La información publicada es orientativa y no reemplaza servicios
              de emergencia.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/45 md:flex-row">
            <p>© {new Date().getFullYear()} Corazón Migrante. Todos los derechos reservados.</p>
            <p>Hecho con cuidado para acompañar a quienes están lejos de casa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
