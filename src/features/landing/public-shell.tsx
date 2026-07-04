import Link from "next/link";
import { HeartPulse, MessageCircle, Phone } from "lucide-react";
import { fileServer } from "@/config/file-server";
import {
  contactHref,
  formatContactPhone,
  resolveContactPhone,
} from "@/features/landing/contact";
import { Button } from "@/shared/ui/button";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/privacidad", label: "Privacidad" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  const phone = resolveContactPhone();
  const formattedPhone = formatContactPhone(phone);

  return (
    <div className="min-h-screen bg-[#fbf8f3]">
      <header className="sticky top-0 z-40 border-b border-[#1a342f]/10 bg-[#fbf8f3]/88 backdrop-blur-2xl">
        <div className="container flex h-20 items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-3 font-bold"
            aria-label="Ir al inicio de Corazón Migrante"
          >
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-[#1a342f]/10 bg-white shadow-sm transition group-hover:shadow-md">
              {fileServer.logoUrl ? (
                <img
                  src={fileServer.logoUrl}
                  alt="Corazón Migrante"
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <HeartPulse className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <span className="leading-tight text-[#172b27]">
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
            <Button asChild className="rounded-2xl" variant="ghost">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button
              asChild
              className="rounded-2xl shadow-[0_16px_40px_rgba(35,99,89,0.20)]"
            >
              <Link href="/registro">Crear cuenta</Link>
            </Button>
          </div>
        </div>

        <nav
          className="container flex gap-2 overflow-x-auto pb-3 md:hidden"
          aria-label="Navegación pública móvil"
        >
          {navItems.map((item) => (
            <Link
              className="shrink-0 rounded-full border border-[#1a342f]/10 bg-white/72 px-4 py-2 text-xs font-semibold text-[#625e57]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
            href="/login"
          >
            Ingresar
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-[#1a342f]/10 bg-[#102f2a] text-white">
        <div className="container grid gap-10 py-14 md:grid-cols-[1.15fr_0.85fr_1fr]">
          <div>
            <p className="text-lg font-black">Corazón Migrante</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/64">
              Acompañamiento psicológico con una experiencia clara, humana y
              privada.
            </p>
          </div>
          <div>
            <p className="font-semibold">Legal</p>
            <div className="mt-3 grid gap-2 text-sm text-white/64">
              <Link className="transition hover:text-white" href="/privacidad">
                Política de privacidad
              </Link>
              <Link className="transition hover:text-white" href="/terminos">
                Términos y condiciones
              </Link>
            </div>
          </div>
          <div>
            <p className="font-semibold">Contacto</p>
            {formattedPhone ? (
              <a
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white/74 transition hover:text-white"
                href={contactHref(phone)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />{" "}
                {formattedPhone}
              </a>
            ) : null}
            <p className="mt-4 text-sm leading-6 text-white/64">
              La información publicada es orientativa y no reemplaza servicios
              de emergencia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
