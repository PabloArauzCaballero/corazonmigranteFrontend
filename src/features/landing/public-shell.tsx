import Link from "next/link";
import { HeartPulse, Menu } from "lucide-react";
import { Button } from "@/shared/ui/button";

const navItems = [
  { href: "/#acompanamiento", label: "Acompañamiento" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/booking", label: "Agendar" }
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-bold">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <HeartPulse className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>
              Corazón Migrante
              <span className="block text-xs font-medium text-muted-foreground">Acompañamiento emocional</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Navegación pública">
            {navItems.map((item) => (
              <Link className="text-sm font-medium text-muted-foreground transition hover:text-foreground" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild>
              <Link href="/registro">Crear cuenta</Link>
            </Button>
          </div>
          <Button className="md:hidden" size="icon" variant="ghost" aria-label="Abrir menú">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t bg-card/60">
        <div className="container grid gap-8 py-10 md:grid-cols-3">
          <div>
            <p className="font-bold">Corazón Migrante</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Plataforma para organizar acompañamiento psicológico con una experiencia clara, humana y privada.</p>
          </div>
          <div>
            <p className="font-semibold">Legal</p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <Link href="/privacidad">Política de privacidad</Link>
              <Link href="/terminos">Términos y condiciones</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold">Atención</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Este sitio no reemplaza servicios de emergencia ni ofrece diagnósticos automáticos.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
