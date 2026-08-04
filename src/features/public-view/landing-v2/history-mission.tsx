"use client";

/**
 * Secciones de historia y misión.
 *
 * Extraído de `landing-v2-page.tsx`, que superaba las 1000 líneas.
 */
import Link from "next/link";
import { Parallax, Reveal } from "@/features/public-view/landing-motion";
import type { LandingV2Content } from "@/features/public-view/landing-v2.types";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { Button } from "@/shared/ui/button";
import { ImageBlock, TextList, iconFor, richParts } from "@/features/public-view/landing-v2/primitives";
import { SectionBadge } from "@/features/public-view/landing-v2/navbar";

export function HistorySection({
  content,
  landing,
}: {
  content: LandingV2Content;
  landing: NormalizedPublicLanding;
}) {
  const section = content.sections?.map;
  const rootImage = content.sections?.image;
  const rootLink = content.sections?.link;
  if (!section) return null;
  const paragraphs = section.paragraphs;
  const main = paragraphs?.main ?? [];
  const additional = paragraphs?.aditional ?? paragraphs?.additional ?? [];
  const testimonios = Object.entries(paragraphs?.testimonios ?? {});
  const conclusions = Object.entries(paragraphs?.conclusion_phrase ?? {});

  return (
    <section id={section.id || "mapa"} className="scroll-mt-28 bg-card py-20">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SectionBadge badge={section.badge} />
            <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] text-ink md:text-6xl">
              {section.title}
            </h2>
            {section.subtitle ? (
              <p className="mt-5 text-xl leading-8 text-ink-muted">{section.subtitle}</p>
            ) : null}
            <div className="mt-8 overflow-hidden rounded-[2.2rem] border border-line bg-line shadow-[0_28px_80px_rgba(43,27,23,0.12)]">
              <ImageBlock
                image={section.image ?? rootImage}
                landing={landing}
                alt={section.title}
                className="h-56 w-full object-cover sm:h-72 md:h-[26rem]"
              />
            </div>
            {(section.link?.label || rootLink?.label) ? (
              <Button asChild className="mt-6 rounded-2xl" variant="outline">
                <Link href={section.link?.href || rootLink?.href || "#mision"}>
                  {section.link?.label || rootLink?.label}
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="space-y-8">
            {main.length > 0 ? (
              <div className="rounded-[2rem] border border-line bg-background p-7 md:p-9">
                <TextList items={main} />
              </div>
            ) : null}

            {additional.length > 0 ? (
              <div className="rounded-[2rem] border border-line bg-card p-7 shadow-sm md:p-9">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">
                  Relato migrante
                </p>
                <TextList items={additional} className="mt-5 grid gap-5" />
              </div>
            ) : null}
          </div>
        </div>

        {testimonios.length > 0 ? (
          <div className="mt-16">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">
                Testimonios
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.03em] text-ink md:text-5xl">
                Historias que explican lo que muchas veces no se dice
              </h3>
            </div>
            <div className="mt-9 grid gap-6">
              {testimonios.map(([title, item], index) => {
                const image = item.image;
                const text = item.paragraph ?? item.paragraphs ?? [];
                return (
                  <article
                    className="grid overflow-hidden rounded-[2.2rem] border border-line bg-background shadow-sm lg:grid-cols-[0.36fr_0.64fr]"
                    key={title}
                  >
                    <div className="min-h-[12rem] bg-line sm:min-h-[15rem] md:min-h-[18rem]">
                      <ImageBlock
                        image={image}
                        landing={landing}
                        alt={title}
                        className="h-full min-h-[12rem] w-full object-cover sm:min-h-[15rem] md:min-h-[18rem]"
                      />
                    </div>
                    <div className="p-7 md:p-9">
                      <p className="text-sm font-bold text-primary">Historia {index + 1}</p>
                      <h4 className="mt-2 text-2xl font-black tracking-tight text-ink">
                        {title}
                      </h4>
                      <TextList items={text} className="mt-5 grid gap-4" />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}

        {conclusions.length > 0 ? (
          <div className="mt-16 grid gap-5 md:grid-cols-2">
            {conclusions.map(([title, items]) => (
              <div
                className="rounded-[2rem] border border-line-strong bg-surface-inverse p-7 text-surface-inverse-foreground shadow-[0_25px_70px_rgba(43,27,23,0.14)]"
                key={title}
              >
                <h4 className="text-2xl font-black tracking-tight">{title}</h4>
                <div className="mt-5 grid gap-4">
                  {items.map((item) => (
                    <p className="text-sm leading-7 text-surface-inverse-foreground/75" key={item}>
                      {richParts(item)}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function MissionSection({
  content,
  landing,
}: {
  content: LandingV2Content;
  landing: NormalizedPublicLanding;
}) {
  const section = content.sections?.mission;
  if (!section) return null;
  return (
    <section id={section.id || "mision"} className="scroll-mt-28 bg-background py-20">
      <div className="container grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <Reveal variant="right">
          <div>
            <SectionBadge badge={section.badge} />
            <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] text-ink md:text-6xl">
              {section.title}
            </h2>
            <TextList items={section.paragraphs} className="mt-7 grid gap-5" />
            {section.feature_cards?.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {section.feature_cards.map((card, i) => (
                  <Reveal variant="up" delay={i * 120} key={`${card.title}-${card.body}`}>
                    <div className="group h-full rounded-[1.5rem] border border-line bg-card/86 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(43,27,23,0.10)]">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        {iconFor(card.icon, "h-5 w-5")}
                      </span>
                      <h3 className="mt-4 text-lg font-black text-ink">{card.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-ink-muted">{card.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : null}
            {section.link?.label ? (
              <Button asChild className="cta-shine mt-8 rounded-2xl transition-transform hover:-translate-y-1">
                <Link href={section.link.href || "#psicologos"}>{section.link.label}</Link>
              </Button>
            ) : null}
          </div>
        </Reveal>
        <Reveal variant="left" delay={150}>
          <Parallax speed={0.08}>
            <div className="overflow-hidden rounded-[2.35rem] border border-card/80 bg-card/72 p-3 shadow-[0_28px_80px_rgba(43,27,23,0.13)]">
              <ImageBlock
                image={section.image}
                landing={landing}
                alt={section.title}
                className="h-64 w-full rounded-[1.9rem] object-cover sm:h-96 md:h-[34rem]"
              />
            </div>
          </Parallax>
        </Reveal>
      </div>
    </section>
  );
}
