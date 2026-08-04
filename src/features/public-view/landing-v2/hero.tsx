"use client";

/**
 * Cabecera de la landing v2: visual, presentación y bloque principal.
 *
 * Extraído de `landing-v2-page.tsx`, que superaba las 1000 líneas.
 */
import Link from "next/link";
import { AnimatedChatBubbles, Parallax, Reveal } from "@/features/public-view/landing-motion";
import { textFromValue } from "@/features/public-view/landing-v2.mapper";
import type { LandingV2Content } from "@/features/public-view/landing-v2.types";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { Button } from "@/shared/ui/button";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { ImageBlock, TextList, actionHref, externalTarget, iconFor } from "@/features/public-view/landing-v2/primitives";
import { SectionBadge } from "@/features/public-view/landing-v2/navbar";

function HeroVisual({ hero }: { hero: LandingV2Content["hero"] }) {
  const visual = hero?.visual;
  const bubbles = visual?.bubbles?.filter((item) => item.text) ?? [];
  const stats = visual?.stats?.filter((item) => item.label || item.value) ?? [];
  const trustCards = hero?.trust_cards?.filter((item) => item.title || item.body) ?? [];

  return (
    <div className="relative mx-auto w-full max-w-[39rem] lg:max-w-none">
      <div className="absolute -left-5 top-8 z-10 hidden rounded-[1.7rem] border border-card/80 bg-card/88 p-4 shadow-[0_20px_55px_rgba(43,27,23,0.14)] backdrop-blur md:block">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-accent text-primary">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Espacio seguro</p>
            <p className="text-xs text-ink-muted">Escucha profesional</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2.6rem] border border-card/80 bg-card/68 p-3 shadow-[0_38px_95px_rgba(43,27,23,0.18)] backdrop-blur">
        <div className="overflow-hidden rounded-[2.15rem] border border-ink/10 bg-surface-inverse">
          <div className="flex items-center justify-between border-b border-surface-inverse-foreground/10 px-6 py-5 text-surface-inverse-foreground">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-inverse-foreground/10 text-surface-inverse-foreground">
                {iconFor(visual?.header?.icon || "chat", "h-5 w-5")}
              </span>
              <div>
                <p className="text-sm font-semibold text-surface-inverse-foreground/60">Acompañamiento</p>
                <p className="font-black">{visual?.header?.title || "Tu bienestar, paso a paso"}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-100">
              Online
            </span>
          </div>

          <AnimatedChatBubbles bubbles={bubbles} />

          <div className="grid gap-3 bg-card px-5 py-5 sm:grid-cols-2">
            {stats.map((stat) => (
              <div
                className="rounded-2xl border border-ink/10 bg-background p-4"
                key={`${stat.label}-${stat.value}`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">
                  {stat.label}
                </p>
                <p className="mt-1 text-lg font-black text-ink">{stat.value}</p>
              </div>
            ))}
          </div>

          {textFromValue(visual?.note) ? (
            <div className="flex items-center gap-2 border-t border-ink/10 bg-card px-5 py-4 text-sm font-semibold text-ink-muted">
              {iconFor(visual?.note?.icon, "h-4 w-4 text-primary")}
              {textFromValue(visual?.note)}
            </div>
          ) : null}
        </div>
      </div>

      {trustCards.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {trustCards.map((card) => (
            <div
              className="rounded-[1.35rem] border border-ink/10 bg-card/84 p-4 shadow-sm"
              key={`${card.title}-${card.body}`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                {iconFor(card.icon, "h-5 w-5")}
              </span>
              <p className="mt-3 font-black text-ink">{card.title}</p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">{card.body}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}


export function PresentationSection({
  content,
  landing,
  phone,
}: {
  content: LandingV2Content;
  landing: NormalizedPublicLanding;
  phone?: string;
}) {
  const section = content.presentation_section;
  if (!section) return null;
  const image = section.img ?? (section.imgs
    ? {
        ...section.imgs,
        id_ui:
          section.imgs.id_ui ??
          section.imgs.idUi ??
          section.imgs.id_ui_list?.[0] ??
          section.imgs.id_uis?.[0],
      }
    : undefined);
  const primaryHref = actionHref(section.primary_cta, phone, "#contacto");
  const secondaryHref = actionHref(section.secondary_cta, phone, "#emociones");

  return (
    <section className="bg-card py-16">
      <div className="container grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <Reveal variant="right">
          <div>
            <SectionBadge badge={section.badge} />
            {section.title ? (
              <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] text-ink md:text-6xl">
                {section.title}
              </h2>
            ) : null}
            {section.subtitle ? (
              <p className="mt-5 text-xl leading-8 text-ink-muted">{section.subtitle}</p>
            ) : null}
            <TextList items={section.description} className="mt-7 grid gap-4" />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {section.primary_cta?.label ? (
                <Button asChild className="cta-shine rounded-2xl transition-transform hover:-translate-y-1">
                  <Link href={primaryHref} {...externalTarget(primaryHref)}>
                    {section.primary_cta.label}
                  </Link>
                </Button>
              ) : null}
              {section.secondary_cta?.label ? (
                <Button asChild className="rounded-2xl border-line-strong bg-card/78 transition-transform hover:-translate-y-1" variant="outline">
                  <Link href={secondaryHref} {...externalTarget(secondaryHref)}>
                    {section.secondary_cta.label}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </Reveal>
        <Reveal variant="left" delay={150}>
          <Parallax speed={0.06}>
            <div className="group overflow-hidden rounded-[2.35rem] border border-line bg-background p-3 shadow-[0_28px_80px_rgba(43,27,23,0.13)]">
              <div className="relative min-h-[16rem] overflow-hidden rounded-[1.9rem] bg-line sm:min-h-[22rem] md:min-h-[28rem]">
                <ImageBlock
                  image={image}
                  landing={landing}
                  alt={section.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                {section.img_footer_text ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface-inverse/88 to-transparent p-7 text-surface-inverse-foreground">
                    <p className="max-w-xl text-xl font-black leading-8">{section.img_footer_text}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </Parallax>
        </Reveal>
      </div>
    </section>
  );
}

export function Hero({ content, phone }: { content: LandingV2Content; phone?: string }) {
  const hero = content.hero;
  const titleLine1 = hero?.title_line_1 || hero?.title;
  const titleLine2 = hero?.title_line_2 || hero?.subtitle;
  const lead = hero?.lead?.length ? hero.lead : hero?.description;
  const primaryHref = actionHref(hero?.primary_cta, phone, "#contacto");
  const secondaryHref = actionHref(hero?.secondary_cta, phone, "#psicologos");

  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-background">
      {/* Animated aurora background */}
      <div className="animate-aurora absolute left-[-20rem] top-[-18rem] -z-10 h-[42rem] w-[42rem] rounded-full bg-primary/14 blur-3xl" />
      <div className="animate-blob absolute bottom-[-20rem] right-[-16rem] -z-10 h-[44rem] w-[44rem] rounded-full bg-brand-plum/12 blur-3xl" />
      <div className="animate-blob absolute left-[30%] top-[40%] -z-10 h-[26rem] w-[26rem] rounded-full bg-brand-gold/8 blur-3xl" style={{ animationDelay: "3s" }} />

      {/* `dvh` en lugar de `vh`: en móvil `100vh` mide la ventana con las barras del
          navegador retraídas, de modo que el héroe quedaba sistemáticamente más alto
          que la pantalla y empujaba el resto de la página fuera de vista al cargar. */}
      <div className="container grid min-h-[calc(100dvh-4rem)] gap-10 py-10 sm:gap-12 sm:py-14 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-20">
        <div className="max-w-3xl">
          <Reveal variant="up">
            <SectionBadge badge={hero?.badge} />
          </Reveal>

          <Reveal variant="up" delay={120}>
            <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black tracking-[-0.055em] text-ink md:text-7xl">
              {titleLine1}
              {titleLine2 ? (
                <span className="mt-1 block text-gradient-migrant">{titleLine2}</span>
              ) : null}
            </h1>
          </Reveal>

          <Reveal variant="up" delay={240}>
            <TextList items={lead} className="mt-7 grid gap-4" />
          </Reveal>

          <Reveal variant="up" delay={360}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {hero?.primary_cta?.label ? (
                <Button
                  asChild
                  className="cta-shine h-[3.35rem] rounded-2xl px-7 text-base shadow-[0_18px_45px_rgba(99,48,35,0.22)] transition-transform hover:-translate-y-1"
                  size="lg"
                >
                  <Link href={primaryHref} {...externalTarget(primaryHref)}>
                    {hero.primary_cta.label}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
              {hero?.secondary_cta?.label ? (
                <Button
                  asChild
                  className="h-[3.35rem] rounded-2xl border-line-strong bg-card/78 px-7 text-base transition-transform hover:-translate-y-1 hover:bg-card"
                  size="lg"
                  variant="outline"
                >
                  <Link href={secondaryHref} {...externalTarget(secondaryHref)}>
                    {hero.secondary_cta.label}
                  </Link>
                </Button>
              ) : null}
            </div>
          </Reveal>
        </div>

        <Reveal variant="left" delay={200}>
          <HeroVisual hero={hero} />
        </Reveal>
      </div>

      {/* Scroll cue */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-ink-subtle lg:flex">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em]">Desliza</span>
        <svg className="animate-scroll-cue h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
