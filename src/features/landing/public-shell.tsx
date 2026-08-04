"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, LogOut, Menu, MessageCircle, Phone, ShieldCheck, X } from "lucide-react";
import { fileServer } from "@/config/file-server";
import { dashboardForRole } from "@/shared/auth/roles";
import { useSession } from "@/shared/auth/use-session";
import {
  contactHref,
  formatContactPhone,
  resolveContactPhone,
} from "@/features/landing/contact";
import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/novedades", label: "Novedades" },
  { href: "/cursos", label: "Cursos" },
  { href: "/privacidad", label: "Privacidad" },
];

/** Marca el enlace de la sección actual, incluidas sus subrutas. */
function isNavItemActive(href: string, pathname: string) {
  const path = href.split("?")[0];
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function PublicShell({ children }: { children: ReactNode }) {
  const phone = resolveContactPhone();
  const formattedPhone = formatContactPhone(phone);
  const { session, isReady, logout } = useSession();
  const portalHref = session ? dashboardForRole(session.role) : "/login";
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // El menú se cierra al navegar: sin esto quedaba abierto sobre la página nueva. Se
  // ajusta durante el render para que la página destino no llegue a pintarse con el
  // panel todavía desplegado.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  // Con el panel desplegado se bloquea el scroll del fondo y se escucha Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-background/88 backdrop-blur-2xl">
        <div className="container flex h-16 items-center justify-between gap-3 sm:h-20 sm:gap-4">
          {/* `min-w-0`: un hijo flex no encoge por debajo de su contenido salvo que se
              le indique, y a 320 px el bloque de marca empujaba al botón de menú fuera
              del ancho de la cabecera. */}
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5 font-bold sm:gap-3"
            aria-label="Ir al inicio de Corazón Migrante"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm transition group-hover:shadow-md sm:h-12 sm:w-12">
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
            <span className="min-w-0 truncate leading-tight text-ink">
              Corazón Migrante
              {/* El descriptivo se oculta en el móvil más estrecho: compite por el
                  ancho con el botón de menú y no aporta información esencial. */}
              <span className="hidden truncate text-xs font-medium text-ink-muted min-[380px]:block">
                Acompañamiento emocional
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Navegación pública"
          >
            {navItems.map((item) => {
              const active = isNavItemActive(item.href, pathname);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`relative text-sm font-semibold transition after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full ${
                    active ? "text-primary after:w-full" : "text-ink-muted after:w-0"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Botón de menú móvil — sustituye a la tira de píldoras con scroll
              horizontal, que ocultaba enlaces sin ninguna señal de que hubiera más. */}
          <button
            type="button"
            aria-controls="menu-movil"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-ink/12 bg-card/70 text-ink transition hover:bg-card md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {formattedPhone ? (
              <a
                className="hidden items-center gap-2 rounded-2xl border border-line-strong bg-card/70 px-4 py-2 text-sm font-semibold text-ink-muted transition hover:bg-card xl:inline-flex"
                href={contactHref(phone)}
                target="_blank"
                rel="noreferrer"
              >
                <Phone className="h-4 w-4 text-primary" aria-hidden="true" />{" "}
                {formattedPhone}
              </a>
            ) : null}
            {/* Hasta que la sesión se lee de localStorage (tras hidratar) se reserva el
                hueco con un placeholder. Antes se pintaba "Ingresar / Crear cuenta" y,
                un instante después, "Mi portal / Salir": un parpadeo en cada carga
                para quien ya tenía sesión iniciada. */}
            {!isReady ? (
              <div aria-hidden="true" className="h-11 w-56 animate-pulse rounded-2xl bg-surface-inverse/5" />
            ) : session ? (
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

        {menuOpen ? (
          /* El menú se despliega dentro de la cabecera y, mientras está abierto, el
             scroll del cuerpo está bloqueado. En orientación horizontal (p. ej.
             568×320) la lista completa supera la altura disponible y, sin scroll
             propio, sus últimos controles quedaban fuera de alcance. */
          <nav
            className="animate-slide-down pb-safe container grid max-h-[calc(100dvh-5rem)] gap-1 overflow-y-auto overscroll-contain border-t border-ink/10 py-4 md:hidden"
            id="menu-movil"
            aria-label="Navegación pública"
          >
            {navItems.map((item) => {
              const active = isNavItemActive(item.href, pathname);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active ? "bg-primary/10 text-primary" : "text-ink-soft hover:bg-surface-inverse/5"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-2 grid gap-2 border-t border-ink/10 pt-3">
              {isReady && session ? (
                <>
                  <Button asChild className="w-full rounded-2xl" variant="outline">
                    <Link href={portalHref}>Mi portal</Link>
                  </Button>
                  <Button className="w-full rounded-2xl" onClick={logout} type="button">
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Salir
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="w-full rounded-2xl" variant="outline">
                    <Link href="/login">Ingresar</Link>
                  </Button>
                  <Button asChild className="w-full rounded-2xl">
                    <Link href="/registro">Crear cuenta</Link>
                  </Button>
                </>
              )}
              {formattedPhone ? (
                <a
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl border border-line-strong bg-card/70 px-4 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-card"
                  href={contactHref(phone)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Phone className="h-4 w-4 text-primary" aria-hidden="true" /> {formattedPhone}
                </a>
              ) : null}
              {/* En móvil el selector va dentro del cajón: en la cabecera compite por
                  espacio con el logotipo y el botón de menú. */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-sm font-semibold text-ink-muted">Tema</span>
                <ThemeToggle />
              </div>
            </div>
          </nav>
        ) : null}
      </header>
      <main id="contenido-principal" tabIndex={-1}>{children}</main>
      <footer className="relative overflow-hidden border-t border-surface-inverse-foreground/10 bg-surface-inverse text-surface-inverse-foreground">
        <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/16 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-brand-plum/14 blur-3xl" />

        <div className="container relative grid gap-12 py-16 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-3 font-bold"
              aria-label="Ir al inicio de Corazón Migrante"
            >
              <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-surface-inverse-foreground/15 bg-card/95 shadow-sm">
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
            <p className="mt-4 max-w-sm text-sm leading-6 text-surface-inverse-foreground/60">
              Acompañamiento psicológico con una experiencia clara, humana y
              privada para personas migrantes.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-surface-inverse-foreground/12 bg-surface-inverse-foreground/5 px-4 py-2 text-xs font-semibold text-surface-inverse-foreground/70">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Confidencial y profesional
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-inverse-foreground/40">
              Navegación
            </p>
            <div className="mt-4 grid gap-3 text-sm text-surface-inverse-foreground/68">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="transition hover:text-surface-inverse-foreground"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-inverse-foreground/40">
              Legal
            </p>
            <div className="mt-4 grid gap-3 text-sm text-surface-inverse-foreground/68">
              <Link className="transition hover:text-surface-inverse-foreground" href="/privacidad">
                Política de privacidad
              </Link>
              <Link className="transition hover:text-surface-inverse-foreground" href="/terminos">
                Términos y condiciones
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surface-inverse-foreground/40">
              Contacto
            </p>
            {formattedPhone ? (
              <a
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-surface-inverse-foreground/12 bg-surface-inverse-foreground/5 px-4 py-2.5 text-sm font-semibold text-surface-inverse-foreground/85 transition hover:border-surface-inverse-foreground/25 hover:bg-surface-inverse-foreground/10"
                href={contactHref(phone)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                {formattedPhone}
              </a>
            ) : null}
            <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-surface-inverse-foreground/50">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              La información publicada es orientativa y no reemplaza servicios
              de emergencia.
            </p>
          </div>
        </div>

        <div className="border-t border-surface-inverse-foreground/10">
          <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-surface-inverse-foreground/45 md:flex-row">
            <p>© {new Date().getFullYear()} Corazón Migrante. Todos los derechos reservados.</p>
            <p>Hecho con cuidado para acompañar a quienes están lejos de casa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
