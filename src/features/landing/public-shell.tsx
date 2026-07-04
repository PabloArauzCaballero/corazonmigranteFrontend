import Link from "next/link";
import { BookOpenText, HeartPulse, MessageCircle, Phone } from "lucide-react";
import { env } from "@/config/env";
import { fileServer } from "@/config/file-server";
import { contactHref, normalizeContactPhone } from "@/features/landing/contact";
import { Button } from "@/shared/ui/button";

const navItems = [
  { href: "/#acompanamiento", label: "Acompañamiento" },
  { href: "/biblioteca", label: "Biblioteca" }
];

function PublicHeader() {
  const phone = normalizeContactPhone(env.NEXT_PUBLIC_PUBLIC_CONTACT_PHONE);
  const href = contactHref(phone);

  return (
    <header className="sticky top-0 z-40 border-b border-[#173c35]/10 bg-[#fbf8f3]/92 backdrop-blur-2xl">
      <div className="container flex min-h-[4.75rem] items-center justify-between gap-4 py-3">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Ir al inicio de Corazón Migrante">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#173c35]/10 bg-white shadow-sm transition group-hover:shadow-md">
            {fileServer.logoUrl ? <img src={fileServer.logoUrl} alt="Corazón Migrante" className="h-full w-full object-contain p-1.5" /> : <HeartPulse className="h-5 w-5 text-primary" aria-hidden="true" />}
          </span>
          <span className="truncate leading-tight">
            <span className="block truncate text-[1.05rem] font-black tracking-[-0.02em] text-[#172b27]">Corazón Migrante</span>
            <span className="block truncate text-xs font-semibold text-[#766f66]">Acompañamiento emocional</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navegación pública">
          {navItems.map((item) => (
            <Link className="text-sm font-semibold text-[#625e57] transition hover:text-primary" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {phone ? (
            <a className="inline-flex items-center gap-2 rounded-full border border-[#173c35]/10 bg-white/70 px-3 py-2 text-xs font-bold text-[#173c35] shadow-sm" href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noreferrer" : undefined}>
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {phone}
            </a>
          ) : null}
          {href ? (
            <Button asChild className="rounded-full px-4" variant="outline">
              <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Contactar
              </a>
            </Button>
          ) : null}
          <Button asChild className="rounded-full" variant="ghost">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild className="rounded-full px-5 shadow-[0_16px_40px_rgba(35,99,89,0.18)]">
            <Link href="/registro">Crear cuenta</Link>
          </Button>
        </div>
      </div>

      <nav className="container flex gap-2 overflow-x-auto pb-3 md:hidden" aria-label="Navegación pública móvil">
        {navItems.map((item) => (
          <Link className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#173c35]/10 bg-white/76 px-4 py-2 text-xs font-bold text-[#625e57]" href={item.href} key={item.href}>
            {item.href.includes("biblioteca") ? <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {item.label}
          </Link>
        ))}
        {href ? (
          <a className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#173c35]/10 bg-white/76 px-4 py-2 text-xs font-bold text-[#173c35]" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Contactar
          </a>
        ) : null}
        <Link className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white" href="/login">
          Ingresar
        </Link>
      </nav>
    </header>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf8f3]">
      <PublicHeader />
      <main>{children}</main>
      <footer className="border-t border-[#173c35]/10 bg-[#102f2a] text-white">
        <div className="container grid gap-10 py-14 md:grid-cols-[1.15fr_0.85fr_1fr]">
          <div>
            <p className="text-lg font-black">Corazón Migrante</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/64">Acompañamiento emocional con una experiencia clara, privada y humana.</p>
          </div>
          <div>
            <p className="font-semibold">Accesos</p>
            <div className="mt-3 grid gap-2 text-sm text-white/64">
              <Link className="transition hover:text-white" href="/biblioteca">Biblioteca</Link>
              <Link className="transition hover:text-white" href="/privacidad">Privacidad</Link>
              <Link className="transition hover:text-white" href="/terminos">Términos</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold">Atención responsable</p>
            <p className="mt-3 text-sm leading-6 text-white/64">Este sitio no reemplaza servicios de emergencia ni ofrece diagnósticos automáticos.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
