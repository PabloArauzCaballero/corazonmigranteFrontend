"use client";

/**
 * Barra de navegación de la landing v2 y la insignia de sección.
 *
 * Extraído de `landing-v2-page.tsx`, que superaba las 1000 líneas.
 */
import Link from "next/link";
import { contactHref, formatContactPhone } from "@/features/landing/contact";
import { useScrollNavbar } from "@/features/public-view/landing-motion";
import { linkKey, resolveV2Image, textFromValue } from "@/features/public-view/landing-v2.mapper";
import type { LandingV2Content, LandingV2IconText } from "@/features/public-view/landing-v2.types";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Phone } from "lucide-react";
import { actionHref, iconFor, publicLinks } from "@/features/public-view/landing-v2/primitives";

export function SectionBadge({ badge }: { badge?: LandingV2IconText }) {
  const text = textFromValue(badge);
  if (!text) return null;
  return (
    <Badge
      className="inline-flex rounded-full border-primary/15 bg-primary/10 px-4 py-1.5 text-primary hover:bg-primary/10"
      variant="secondary"
    >
      {iconFor(badge?.icon, "mr-2 h-4 w-4")}
      {text}
    </Badge>
  );
}

export function Navbar({
  content,
  landing,
  phone,
}: {
  content: LandingV2Content;
  landing: NormalizedPublicLanding;
  phone?: string;
}) {
  const links = publicLinks(content);
  const brand = content.navbar?.brand?.label || content.footer?.brand?.label || "Corazón Migrante";
  const formattedPhone = formatContactPhone(phone);
  const signUp = content.navbar?.cta_sign_up;
  const login = content.navbar?.cta_login;
  const brandIcon = content.navbar?.brand?.icon;
  const brandLogo = typeof brandIcon === "number" || /^\d+$/.test(String(brandIcon ?? ""))
    ? resolveV2Image({ id_ui: brandIcon }, landing)
    : undefined;

  const sectionIds = links
    .map((item) => (item.href || "").replace(/^#/, ""))
    .filter(Boolean);
  const { scrolled, active } = useScrollNavbar(sectionIds);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-ink/10 bg-background/95 shadow-[0_8px_30px_rgba(43,27,23,0.08)] backdrop-blur-2xl"
          : "border-transparent bg-background/70 backdrop-blur-xl"
      }`}
    >
      <div className={`container flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? "min-h-[3.5rem] py-2 sm:min-h-[4.25rem]" : "min-h-16 py-2.5 sm:min-h-20 sm:py-3"}`}>
        <Link
          href={content.navbar?.brand?.href || "#inicio"}
          className="group flex min-w-0 items-center gap-3 font-bold"
          aria-label="Ir al inicio"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl border border-ink/10 bg-card text-primary shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md sm:h-12 sm:w-12">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={brand}
                className="h-full w-full object-contain p-1.5"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              iconFor(content.navbar?.brand?.icon || content.footer?.brand?.icon || "favorite", "h-6 w-6")
            )}
          </span>
          <span className="truncate leading-tight text-ink">
            {brand}
            <span className="hidden truncate text-xs font-medium text-ink-muted min-[380px]:block">
              Acompañamiento emocional
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 xl:flex"
          aria-label="Navegación pública"
        >
          {links.map((item) => {
            const id = (item.href || "").replace(/^#/, "");
            const isActive = Boolean(id) && id === active;
            return (
              <Link
                className={`relative text-sm font-semibold transition duration-300 hover:text-primary after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:rounded-full after:bg-primary after:transition-all after:duration-300 ${
                  isActive ? "text-primary after:w-full" : "text-ink-muted after:w-0 hover:after:w-full"
                }`}
                href={item.href || "#"}
                key={linkKey(item, "nav")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {formattedPhone ? (
            <a
              className="hidden items-center gap-2 rounded-2xl border border-line-strong bg-card/75 px-4 py-2 text-sm font-semibold text-ink-muted transition hover:bg-card 2xl:inline-flex"
              href={contactHref(phone)}
              target="_blank"
              rel="noreferrer"
            >
              <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
              {formattedPhone}
            </a>
          ) : null}
          <Button asChild className="rounded-2xl" variant="ghost">
            <Link href={actionHref(login, phone, "/login")}>{login?.label || "Acceder"}</Link>
          </Button>
          <Button asChild className="rounded-2xl shadow-[0_16px_40px_rgba(99,48,35,0.18)]">
            <Link href={actionHref(signUp, phone, "/registro")}>{signUp?.label || "Registrarse"}</Link>
          </Button>
        </div>
      </div>

      <nav
        className="scroll-x-contained container flex gap-2 pb-3 xl:hidden"
        aria-label="Navegación pública móvil"
      >
        {links.map((item) => {
          const id = (item.href || "").replace(/^#/, "");
          const isActive = Boolean(id) && id === active;
          return (
            <Link
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                isActive ? "border-primary bg-primary text-surface-inverse-foreground" : "border-ink/10 bg-card/76 text-ink-muted"
              }`}
              href={item.href || "#"}
              key={linkKey(item, "mobile")}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-surface-inverse-foreground"
          href={actionHref(login, phone, "/login")}
        >
          {login?.label || "Acceder"}
        </Link>
        {signUp?.label ? (
          <Link
            className="shrink-0 rounded-full border border-primary/20 bg-card px-4 py-2 text-xs font-semibold text-primary"
            href={actionHref(signUp, phone, "/registro")}
          >
            {signUp.label}
          </Link>
        ) : null}
        {formattedPhone ? (
          <a
            className="shrink-0 rounded-full border border-ink/10 bg-card/76 px-4 py-2 text-xs font-semibold text-ink-muted"
            href={contactHref(phone)}
            target="_blank"
            rel="noreferrer"
          >
            Contactar
          </a>
        ) : null}
      </nav>
    </header>
  );
}
