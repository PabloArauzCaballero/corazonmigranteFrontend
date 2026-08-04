"use client";

/**
 * Pie de la landing v2 y el botón flotante de contacto.
 *
 * Extraído de `landing-v2-page.tsx`, que superaba las 1000 líneas.
 */
import Link from "next/link";
import { contactHref, formatContactPhone } from "@/features/landing/contact";
import { linkKey, textFromValue } from "@/features/public-view/landing-v2.mapper";
import type { LandingV2Content } from "@/features/public-view/landing-v2.types";
import { MessageCircle, Phone } from "lucide-react";
import { footerLegalLinks, iconFor, publicLinks } from "@/features/public-view/landing-v2/primitives";

export function Footer({ content, phone }: { content: LandingV2Content; phone?: string }) {
  const footer = content.footer;
  const year = new Date().getFullYear();
  const copyright = footer?.legal?.copyright_template?.replace("{year}", String(year));
  const links = footer?.quick_links?.length ? footer.quick_links : publicLinks(content);
  const legalLinks = footerLegalLinks(content);
  const formattedPhone = formatContactPhone(phone);
  return (
    <footer className="border-t border-ink/10 bg-surface-inverse text-surface-inverse-foreground">
      <div className="container grid gap-10 py-14 lg:grid-cols-[1.15fr_0.75fr_1.1fr]">
        <div>
          <div className="flex items-center gap-3 text-lg font-black">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-inverse-foreground/10">
              {iconFor(footer?.brand?.icon || "favorite", "h-5 w-5")}
            </span>
            {footer?.brand?.label || content.navbar?.brand?.label || "Corazón Migrante"}
          </div>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-surface-inverse-foreground/64">
            {footer?.tagline?.map((item) => <p key={item}>{item}</p>)}
          </div>
          {formattedPhone ? (
            <a
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-surface-inverse-foreground/10 bg-surface-inverse-foreground/8 px-4 py-2 text-sm font-bold text-surface-inverse-foreground/85 transition hover:bg-surface-inverse-foreground/12 hover:text-surface-inverse-foreground"
              href={contactHref(phone)}
              target="_blank"
              rel="noreferrer"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {formattedPhone}
            </a>
          ) : null}
        </div>

        <div>
          <p className="font-semibold">Accesos</p>
          <div className="mt-3 grid gap-2 text-sm text-surface-inverse-foreground/64">
            {links.map((item) => (
              <Link
                className="transition hover:text-surface-inverse-foreground"
                href={item.href || "#"}
                key={linkKey(item, "footer")}
              >
                {item.label}
              </Link>
            ))}
            {links.some((item) => item.href === "/biblioteca" || /biblioteca/i.test(item.label ?? "")) ? null : (
              <Link className="transition hover:text-surface-inverse-foreground" href="/biblioteca">
                Biblioteca
              </Link>
            )}
          </div>
        </div>

        <div>
          <p className="font-semibold">{footer?.notice?.title || "Aviso"}</p>
          <p className="mt-3 text-sm leading-6 text-surface-inverse-foreground/64">{footer?.notice?.body}</p>
          {textFromValue(footer?.notice?.note) ? (
            <p className="mt-4 flex items-center gap-2 text-sm leading-6 text-surface-inverse-foreground/64">
              {iconFor(footer?.notice?.note?.icon, "h-4 w-4")}
              {textFromValue(footer?.notice?.note)}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-surface-inverse-foreground/50">
            {legalLinks.map((item) => (
              <Link className="transition hover:text-surface-inverse-foreground" href={item.href || "#"} key={linkKey(item, "legal")}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-surface-inverse-foreground/10 py-5 text-center text-xs text-surface-inverse-foreground/45">
        {copyright || `© ${year} Corazón Migrante. Todos los derechos reservados.`}
      </div>
    </footer>
  );
}

export function FloatingContact({ phone }: { phone?: string }) {
  return (
    <a
      className="group fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-surface-inverse-foreground shadow-[0_18px_45px_rgba(99,48,35,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-brand-clay"
      href={phone ? contactHref(phone) : "#contacto"}
      target={phone ? "_blank" : undefined}
      rel={phone ? "noreferrer" : undefined}
      aria-label="Contactar a Corazón Migrante"
    >
      <span className="absolute inset-0 -z-10 rounded-full bg-primary/50 opacity-70 blur-sm transition group-hover:opacity-0" />
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/30" style={{ animationDuration: "2.5s" }} />
      <MessageCircle className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
      <span className="hidden sm:inline">Contactar</span>
    </a>
  );
}
