"use client";

/**
 * Secciones de emociones y contacto.
 *
 * Extraído de `landing-v2-page.tsx`, que superaba las 1000 líneas.
 */
import Link from "next/link";
import { contactHref, formatContactPhone } from "@/features/landing/contact";
import { Reveal } from "@/features/public-view/landing-motion";
import { humanizeTitle, textFromValue } from "@/features/public-view/landing-v2.mapper";
import type { LandingV2Content } from "@/features/public-view/landing-v2.types";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { ArrowRight, Phone } from "lucide-react";
import { ImageBlock, actionHref, externalTarget, iconFor } from "@/features/public-view/landing-v2/primitives";
import { SectionBadge } from "@/features/public-view/landing-v2/navbar";

export function EmotionsSection({
  content,
  landing,
}: {
  content: LandingV2Content;
  landing: NormalizedPublicLanding;
}) {
  const section = content.sections?.emotions;
  const items = section?.items?.filter((item) => item.title || item.body) ?? [];
  if (!section || items.length === 0) return null;
  return (
    <section id={section.id || "emociones"} className="scroll-mt-28 bg-card py-20">
      <div className="container">
        <Reveal variant="up">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">
              Salud emocional
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black tracking-[-0.04em] text-ink md:text-6xl">
              {section.title}
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item, i) => (
            <Reveal variant="up" delay={i * 110} key={`${item.title}-${item.body}`}>
              <Card
                className="group h-full overflow-hidden border-line bg-background transition duration-300 hover:-translate-y-2 hover:shadow-[0_26px_70px_rgba(43,27,23,0.13)]"
              >
                <div className="h-52 overflow-hidden bg-line">
                  <ImageBlock
                    image={item.image}
                    landing={landing}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-black tracking-tight text-ink">
                    {humanizeTitle(item.title)}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-ink-muted">{item.body}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection({
  content,
  phone,
}: {
  content: LandingV2Content;
  phone?: string;
}) {
  const section = content.sections?.cta;
  if (!section) return null;
  const href = actionHref(section.primary_cta, phone, "#contacto");
  const formattedPhone = formatContactPhone(phone);
  return (
    <section id={section.id || "contacto"} className="scroll-mt-28 bg-card py-20">
      <div className="container">
        <Reveal variant="zoom">
        <div className="relative grid overflow-hidden rounded-[2.6rem] border border-ink/10 bg-surface-inverse text-surface-inverse-foreground shadow-[0_36px_95px_rgba(43,27,23,0.2)] lg:grid-cols-[0.62fr_0.38fr]">
          {/* animated glow inside dark card */}
          <div className="animate-blob pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="animate-blob pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-brand-plum/25 blur-3xl" style={{ animationDelay: "2.5s" }} />
          <div className="relative p-8 md:p-12">
            <SectionBadge badge={section.badge} />
            <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] md:text-6xl">
              {section.title}
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-surface-inverse-foreground/72">{section.body}</p>
            {section.bullets?.length ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {section.bullets.map((bullet, i) => (
                  <Reveal variant="up" delay={i * 90} key={textFromValue(bullet)}>
                    <div className="flex h-full items-start gap-3 rounded-2xl border border-surface-inverse-foreground/10 bg-surface-inverse-foreground/8 p-4 text-sm leading-6 text-surface-inverse-foreground/76 transition duration-300 hover:border-emerald-200/40 hover:bg-surface-inverse-foreground/12">
                      {iconFor(bullet.icon, "mt-0.5 h-5 w-5 shrink-0 text-emerald-200")}
                      {textFromValue(bullet)}
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative border-t border-surface-inverse-foreground/10 bg-surface-inverse-foreground/8 p-8 md:p-10 lg:border-l lg:border-t-0">
            <div className="rounded-[2rem] bg-card p-7 text-ink shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                Contacto
              </p>
              <h3 className="mt-3 text-2xl font-black">{section.card_body || "Reserva tu cita cuando estés listo."}</h3>
              {formattedPhone ? (
                <a
                  href={contactHref(phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 flex items-center gap-3 rounded-2xl border border-line-strong bg-background px-4 py-3 font-black text-primary transition hover:bg-surface-sunken"
                >
                  <Phone className="h-5 w-5" aria-hidden="true" />
                  {formattedPhone}
                </a>
              ) : null}
              {section.primary_cta?.label ? (
                <Button asChild className="cta-shine mt-5 w-full rounded-2xl transition-transform hover:-translate-y-0.5">
                  <Link href={href} {...externalTarget(href)}>
                    {formattedPhone ? "Contactar" : section.primary_cta.label}
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
              {textFromValue(section.note) ? (
                <p className="mt-5 flex items-center gap-2 text-xs font-semibold leading-5 text-ink-muted">
                  {iconFor(section.note?.icon, "h-4 w-4 text-primary")}
                  {textFromValue(section.note)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
