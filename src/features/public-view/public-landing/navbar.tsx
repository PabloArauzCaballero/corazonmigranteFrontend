/**
 * Barra de navegación de la landing genérica.
 *
 * Extraído de `public-landing-page.tsx`, que superaba las 700 líneas.
 */
import Link from "next/link";
import { contactHref, formatContactPhone } from "@/features/landing/contact";
import { resolveLogoUrl } from "@/features/public-view/public-view.normalizer";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { Button } from "@/shared/ui/button";
import { HeartHandshake, Phone } from "lucide-react";
import { actionHref, cleanNavLinks, safeHref } from "@/features/public-view/public-landing/primitives";

export function PublicNavbar({
  landing,
  phone,
}: {
  landing: NormalizedPublicLanding;
  phone?: string;
}) {
  const logo = resolveLogoUrl(landing.navbar, landing.uiById);
  const links = cleanNavLinks(landing);
  const brand = landing.navbar.brand || landing.title || "Corazón Migrante";
  const formattedPhone = formatContactPhone(phone);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-background/88 backdrop-blur-2xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 font-bold"
          aria-label="Ir al inicio"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
            {logo ? (
              <img
                src={logo}
                alt={brand}
                className="h-full w-full object-contain p-1.5"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <HeartHandshake
                className="h-6 w-6 text-primary"
                aria-hidden="true"
              />
            )}
          </span>
          <span className="truncate leading-tight text-ink">
            {brand}
            {landing.navbar.tagline ? (
              <span className="block truncate text-xs font-medium text-ink-muted">
                {landing.navbar.tagline}
              </span>
            ) : null}
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Navegación pública"
        >
          {links.map((item) => (
            <Link
              className="relative text-sm font-semibold text-ink-muted transition duration-300 hover:text-primary after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              href={safeHref(item)}
              key={`${item.label}-${item.href}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
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
          <Button asChild className="rounded-2xl" variant="ghost">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button
            asChild
            className="rounded-2xl shadow-[0_16px_40px_rgba(99,48,35,0.18)]"
          >
            <Link href={actionHref(landing.navbar.cta, "/registro")}>
              {"Crear cuenta"}
            </Link>
          </Button>
        </div>
      </div>

      <nav
        className="container flex gap-2 overflow-x-auto pb-3 md:hidden"
        aria-label="Navegación pública móvil"
      >
        {links.map((item) => (
          <Link
            className="shrink-0 rounded-full border border-ink/10 bg-card/76 px-4 py-2 text-xs font-semibold text-ink-muted"
            href={safeHref(item)}
            key={`${item.label}-${item.href}-mobile`}
          >
            {item.label}
          </Link>
        ))}
        <Link
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-surface-inverse-foreground"
          href="/login"
        >
          Ingresar
        </Link>
      </nav>
    </header>
  );
}
