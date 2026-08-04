/**
 * Pie de la landing genérica y el botón flotante de contacto.
 *
 * Extraído de `public-landing-page.tsx`, que superaba las 700 líneas.
 */
import Link from "next/link";
import { contactHref, formatContactPhone } from "@/features/landing/contact";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { TUTORIAL_TARGETS } from "@/features/tutorial/model/tutorial-targets";
import { MessageCircle } from "lucide-react";

export function FloatingContact({ phone }: { phone?: string }) {
  return (
    <a
      data-tutorial-id={TUTORIAL_TARGETS.landingContacto}
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-surface-inverse-foreground shadow-[0_18px_45px_rgba(99,48,35,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-brand-clay"
      href={contactHref(phone)}
      target={phone ? "_blank" : undefined}
      rel={phone ? "noreferrer" : undefined}
      aria-label="Contactar a Corazón Migrante"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">Contactar</span>
    </a>
  );
}

export function Footer({
  landing,
  phone,
}: {
  landing: NormalizedPublicLanding;
  phone?: string;
}) {
  const brand = landing.navbar.brand || landing.title || "Corazón Migrante";
  const formattedPhone = formatContactPhone(phone);
  return (
    <footer className="border-t border-ink/10 bg-surface-inverse text-surface-inverse-foreground">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.15fr_0.85fr_1fr]">
        <div>
          <p className="text-lg font-black">{brand}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-surface-inverse-foreground/64">
            {landing.footer?.note ||
              landing.seoDescription ||
              "Acompañamiento emocional con atención clara, humana y responsable."}
          </p>
        </div>
        <div>
          <p className="font-semibold">Accesos</p>
          <div className="mt-3 grid gap-2 text-sm text-surface-inverse-foreground/64">
            <Link className="transition hover:text-surface-inverse-foreground" href="/biblioteca">
              Biblioteca
            </Link>
            <Link className="transition hover:text-surface-inverse-foreground" href="/privacidad">
              Política de privacidad
            </Link>
            <Link className="transition hover:text-surface-inverse-foreground" href="/terminos">
              Términos y condiciones
            </Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Contacto</p>
          {formattedPhone ? (
            <a
              className="mt-3 inline-flex text-sm font-semibold text-surface-inverse-foreground/74 transition hover:text-surface-inverse-foreground"
              href={contactHref(phone)}
              target="_blank"
              rel="noreferrer"
            >
              {formattedPhone}
            </a>
          ) : (
            <p className="mt-3 text-sm leading-6 text-surface-inverse-foreground/64">
              Completa tu registro para recibir orientación inicial.
            </p>
          )}
          <p className="mt-4 text-sm leading-6 text-surface-inverse-foreground/64">
            La información publicada es orientativa y no reemplaza servicios de
            emergencia.
          </p>
        </div>
      </div>
    </footer>
  );
}
