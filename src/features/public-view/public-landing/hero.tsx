/**
 * Cabecera de la landing genérica.
 *
 * Extraído de `public-landing-page.tsx`, que superaba las 700 líneas.
 */
import Link from "next/link";
import { fileServer } from "@/config/file-server";
import { contactHref } from "@/features/landing/contact";
import { SPECIALISTS, cloudImg } from "@/features/public-view/landing-assets";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { TUTORIAL_TARGETS } from "@/features/tutorial/model/tutorial-targets";
import { Button } from "@/shared/ui/button";
import { SmartImage } from "@/shared/ui/smart-image";
import { ArrowRight, Globe, Heart, Lock, MessageCircle, ShieldCheck } from "lucide-react";
import { TextBlock, actionHref, imageUrl } from "@/features/public-view/public-landing/primitives";

export function Hero({
  landing,
  phone,
}: {
  landing: NormalizedPublicLanding;
  phone?: string;
}) {
  const hero = landing.hero;
  const heroImage = imageUrl(
    hero?.image,
    landing,
    fileServer.landingHeroImageUrl || fileServer.authImageUrl,
  );
  const title = hero?.title || landing.title || "Corazón Migrante";
  const contactUrl = contactHref(phone);

  const lead =
    hero?.subtitle ||
    "Migrar cansa por dentro. Aquí encuentras un lugar tranquilo para hablar de la ansiedad, la culpa y la nostalgia, con alguien que de verdad entiende lo que estás viviendo.";

  return (
    <section className="landing-root relative isolate overflow-hidden bg-background">
      {/* Fondos aurora animados */}
      <div className="animate-aurora absolute left-[-20rem] top-[-18rem] -z-10 h-[42rem] w-[42rem] rounded-full bg-primary/14 blur-3xl" />
      <div className="animate-blob absolute bottom-[-20rem] right-[-16rem] -z-10 h-[44rem] w-[44rem] rounded-full bg-brand-plum/12 blur-3xl" />
      <div className="animate-blob absolute left-[28%] top-[38%] -z-10 h-[26rem] w-[26rem] rounded-full bg-brand-gold/8 blur-3xl" style={{ animationDelay: "3s" }} />

      <div className="container grid gap-12 py-14 lg:grid-cols-[0.94fr_1.06fr] lg:items-center lg:py-20">
        <div className="max-w-3xl">
          <div className="animate-soft-float inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
            <Heart className="h-4 w-4" aria-hidden="true" />
            {hero?.badge || hero?.eyebrow || "Acompañamiento emocional para migrantes"}
          </div>

          <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black leading-[1.02] tracking-[-0.05em] text-ink md:text-7xl">
            {title}
            <span className="mt-2 block text-gradient-migrant">Calma. Ahora irá mejor.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-ink-soft md:text-xl">{lead}</p>
          <TextBlock value={hero?.description} />

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="cta-shine h-[3.35rem] rounded-2xl px-7 text-base shadow-[0_18px_45px_rgba(99,48,35,0.22)] transition-transform hover:-translate-y-1" size="lg">
              <Link href={actionHref(hero?.primaryCta, "/registro")} data-tutorial-id={TUTORIAL_TARGETS.landingEmpezar}>
                {hero?.primaryCta?.label || "Dar el primer paso"} <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild className="h-[3.35rem] rounded-2xl border-line-strong bg-card/78 px-7 text-base transition-transform hover:-translate-y-1 hover:bg-card" size="lg" variant="outline">
              <a href={contactUrl} target={phone ? "_blank" : undefined} rel={phone ? "noreferrer" : undefined}>
                <MessageCircle className="h-5 w-5" aria-hidden="true" /> Escríbenos
              </a>
            </Button>
          </div>

          {/* Prueba social: equipo + confianza */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {SPECIALISTS.map((s) => (
                  <img
                    key={s.name}
                    src={cloudImg(s.image)}
                    alt={s.name}
                    loading="eager"
                    className="h-10 w-10 rounded-full border-2 border-card object-cover shadow-sm"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ))}
              </div>
              <p className="text-sm leading-5 text-ink-muted"><strong className="text-ink">Psicólogos y psiquiatras</strong><br />que también han migrado.</p>
            </div>
          </div>

          {/* Chips de confianza */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: ShieldCheck, label: "Enfoque clínico y humano" },
              { icon: Lock, label: "Confidencial" },
              { icon: Globe, label: "Online y presencial" },
            ].map((chip) => (
              <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/70 px-3 py-1.5 text-xs font-semibold text-ink-muted backdrop-blur">
                <chip.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> {chip.label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[38rem] lg:max-w-none">
          {/* Tarjeta flotante superior */}
          <div className="animate-soft-float absolute -left-5 top-8 z-10 hidden w-[16.5rem] rounded-[1.75rem] border border-card/70 bg-card/90 p-4 shadow-[0_20px_55px_rgba(43,27,23,0.13)] backdrop-blur md:block">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-accent text-primary"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-bold text-ink">Espacio seguro</p>
                <p className="text-xs leading-5 text-ink-muted">Tu historia se queda contigo.</p>
              </div>
            </div>
          </div>

          {/* Tarjeta flotante superior derecha (no debe tapar la frase inferior) */}
          <div className="absolute -right-4 top-8 z-10 hidden rounded-[1.6rem] border border-card/70 bg-card/90 px-5 py-4 shadow-[0_20px_55px_rgba(43,27,23,0.14)] backdrop-blur md:block" style={{ animation: "soft-float 5s ease-in-out infinite", animationDelay: "1.5s" }}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-subtle">Cada sesión</p>
            <p className="mt-1 text-lg font-black text-ink">60 min · a tu ritmo</p>
          </div>

          <div className="overflow-hidden rounded-[2.75rem] border border-card/80 bg-card/60 p-3 shadow-[0_38px_100px_rgba(43,27,23,0.18)] backdrop-blur transition duration-500 hover:-translate-y-1 hover:shadow-[0_46px_120px_rgba(43,27,23,0.22)]">
            <div className="relative min-h-[18rem] overflow-hidden rounded-[2.2rem] bg-line-strong sm:min-h-[24rem] md:min-h-[38rem]">
              <SmartImage
                src={heroImage}
                fallbackSrc={cloudImg("carrusel-2.webp")}
                alt={hero?.image?.alt || title}
                priority
                className="absolute inset-0 h-full w-full"
                imgClassName="animate-ken-burns"
                rounded="rounded-[2.2rem]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-inverse/92 via-surface-inverse/28 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7 text-surface-inverse-foreground md:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-surface-inverse-foreground/70">{landing.navbar.brand || "Corazón Migrante"}</p>
                <h2 className="mt-3 max-w-md font-display text-3xl font-medium italic leading-tight md:text-4xl">
                  {hero?.image?.footerText || "“Cuando migras, no te vas solo: te llevas tu gente, tu idioma y tu historia.”"}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banda de confianza inferior */}
      <div className="border-t border-line bg-card/60 backdrop-blur">
        <div className="container grid gap-6 py-6 text-center sm:grid-cols-3">
          {[
            { k: "Ansiedad · culpa · nostalgia", v: "Lo que trabajamos" },
            { k: "Sin juicios, sin apuros", v: "Cómo te acompañamos" },
            { k: "Desde donde estés", v: "Atención online" },
          ].map((item) => (
            <div key={item.v}>
              <p className="text-sm font-black text-ink">{item.k}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">{item.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
