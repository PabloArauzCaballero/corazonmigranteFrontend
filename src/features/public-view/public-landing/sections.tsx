/**
 * Secciones genéricas: encabezado, rejilla de tarjetas y bloque partido.
 *
 * Extraído de `public-landing-page.tsx`, que superaba las 700 líneas.
 */
import Link from "next/link";
import { fileServer } from "@/config/file-server";
import type { LandingSection, NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { HeartHandshake } from "lucide-react";
import { actionHref, imageUrl, sectionTone } from "@/features/public-view/public-landing/primitives";

function SectionHeading({ section }: { section: LandingSection }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {section.badge || section.label ? (
        <Badge
          className="rounded-full border-primary/15 bg-primary/10 px-4 py-1.5 text-primary hover:bg-primary/10"
          variant="secondary"
        >
          {section.badge || section.label}
        </Badge>
      ) : null}
      {section.title ? (
        <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.035em] text-ink md:text-5xl">
          {section.title}
        </h2>
      ) : null}
      {section.subtitle ? (
        <p className="mt-4 text-lg leading-8 text-ink-muted">
          {section.subtitle}
        </p>
      ) : null}
      {section.body ? (
        <p className="mt-4 text-base leading-8 text-ink-muted">
          {section.body}
        </p>
      ) : null}
    </div>
  );
}

function CardGrid({ section }: { section: LandingSection }) {
  if (!section.items || section.items.length === 0) return null;
  return (
    <div className="mt-11 grid gap-5 md:grid-cols-3">
      {section.items.map((item, index) => (
        <Card
          className="group overflow-hidden border-line bg-card/86 transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(43,27,23,0.13)]"
          key={`${item.title}-${index}`}
        >
          {item.image?.src ? (
            <img
              src={item.image.src}
              alt={item.image.alt || item.title || "Imagen"}
              className="h-48 w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <CardContent className="p-7">
            <span
              className={`grid h-11 w-11 place-items-center rounded-2xl ${sectionTone[index % sectionTone.length]}`}
            >
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
            </span>
            {item.label ? (
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {item.label}
              </p>
            ) : null}
            {item.title ? (
              <h3 className="mt-3 text-xl font-black tracking-tight text-ink">
                {item.title}
              </h3>
            ) : null}
            {item.body || item.description ? (
              <p className="mt-3 text-sm leading-7 text-ink-muted">
                {item.body || item.description}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SplitSection({
  section,
  landing,
}: {
  section: LandingSection;
  landing: NormalizedPublicLanding;
}) {
  const sectionImage = imageUrl(
    section.image,
    landing,
    fileServer.familyImageUrl ||
      fileServer.therapyImageUrl ||
      fileServer.landingHeroImageUrl,
  );
  return (
    <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <div>
        {section.badge || section.label ? (
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary">
            {section.badge || section.label}
          </p>
        ) : null}
        {section.title ? (
          <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.035em] text-ink md:text-5xl">
            {section.title}
          </h2>
        ) : null}
        {section.subtitle ? (
          <p className="mt-5 text-lg leading-8 text-ink-muted">
            {section.subtitle}
          </p>
        ) : null}
        {section.body ? (
          <p className="mt-5 text-base leading-8 text-ink-muted">
            {section.body}
          </p>
        ) : null}
        {section.paragraphs?.map((paragraph) => (
          <p
            className="mt-4 text-base leading-8 text-ink-muted"
            key={paragraph}
          >
            {paragraph}
          </p>
        ))}
        {section.primaryCta ? (
          <Button asChild className="mt-7 rounded-2xl">
            <Link href={actionHref(section.primaryCta)}>
              {section.primaryCta.label}
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="rounded-[2.2rem] border border-card/80 bg-card/72 p-3 shadow-[0_28px_80px_rgba(43,27,23,0.13)]">
        {sectionImage ? (
          <img
            src={sectionImage}
            alt={section.image?.alt || section.title || "Sección"}
            className="h-[28rem] w-full rounded-[1.75rem] object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid h-[28rem] place-items-center rounded-[1.75rem] bg-surface-accent text-center text-sm font-semibold text-primary">
            Corazón Migrante
          </div>
        )}
      </div>
    </div>
  );
}

export function Section({
  section,
  landing,
}: {
  section: LandingSection;
  landing: NormalizedPublicLanding;
}) {
  if (section.layout === "split" || section.image?.src) {
    return (
      <section id={section.id} className="container scroll-mt-28 py-20">
        <SplitSection section={section} landing={landing} />
      </section>
    );
  }

  if (section.layout === "cta" || section.layout === "quote") {
    return (
      <section id={section.id} className="container scroll-mt-28 py-16">
        <div className="rounded-[2.4rem] border border-line-strong bg-surface-inverse p-8 text-surface-inverse-foreground shadow-[0_30px_90px_rgba(43,27,23,0.18)] md:p-12">
          {section.title ? (
            <h2 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
              {section.title}
            </h2>
          ) : null}
          {section.body || section.subtitle ? (
            <p className="mt-5 max-w-3xl text-lg leading-8 text-surface-inverse-foreground/72">
              {section.body || section.subtitle}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  // Sin tarjetas la sección es solo un encabezado: usamos padding compacto para
  // que no quede un vacío enorme entre secciones.
  const hasItems = Boolean(section.items && section.items.length > 0);
  return (
    <section
      id={section.id}
      className={`container scroll-mt-28 ${hasItems ? "py-20" : "pb-6 pt-16"}`}
    >
      <SectionHeading section={section} />
      <CardGrid section={section} />
    </section>
  );
}
