"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Download, MessageCircle, Quote, Sparkles } from "lucide-react";
import { contactHref, formatContactPhone } from "@/features/landing/contact";
import {
  CAROUSEL_IMAGES,
  cloudImg,
  DOWNLOADABLES,
  MIGRATION_INVITE_IMAGE,
  SPECIALISTS,
} from "@/features/public-view/landing-assets";
import { Reveal } from "@/features/public-view/landing-motion";

/** <img> que carga desde Cloudinary y cae al respaldo local si falla. */
function LandingImg({
  name,
  alt,
  className,
  loading = "lazy",
}: {
  name: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <img
      src={cloudImg(name)}
      alt={alt}
      loading={loading}
      className={className}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

/* ───────────────────────────────────────────────────────────
   Carrusel de doctores — bucle infinito con sus frases
   ─────────────────────────────────────────────────────────── */
function SpecialistCard({ s }: { s: (typeof SPECIALISTS)[number] }) {
  return (
    <figure className="group relative mx-3 w-[19rem] shrink-0 overflow-hidden rounded-[1.75rem] border border-card/60 bg-card shadow-[0_18px_50px_rgba(43,27,23,0.12)]">
      <div className="relative h-72 overflow-hidden">
        <LandingImg
          name={s.image}
          alt={s.name}
          className="h-full w-full object-cover object-[center_18%] transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-surface-inverse via-surface-inverse/60 to-transparent" />
        <figcaption className="absolute inset-x-0 bottom-0 p-5 text-surface-inverse-foreground">
          <p className="font-display text-xl font-semibold leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">{s.name}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-surface-inverse-foreground/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">{s.role}</p>
        </figcaption>
      </div>
      <blockquote className="relative px-5 py-5">
        <Quote className="absolute -top-3 left-4 h-6 w-6 text-primary/25" aria-hidden="true" />
        <p className="font-display text-[15px] italic leading-6 text-ink-soft">“{s.phrase}”</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {s.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-[11px] font-semibold text-brand-clay">
              {t}
            </span>
          ))}
        </div>
      </blockquote>
    </figure>
  );
}

export function DoctorsCarousel() {
  // Duplicamos la lista para lograr el bucle continuo sin cortes.
  const loop = [...SPECIALISTS, ...SPECIALISTS, ...SPECIALISTS, ...SPECIALISTS];
  return (
    <section id="psicologos" className="scroll-mt-28 overflow-hidden bg-background py-20">
      <div className="container">
        <Reveal variant="up">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Equipo profesional
            </span>
            <h2 className="mt-5 text-balance text-4xl font-black tracking-tight text-ink md:text-6xl">
              Quienes te acompañan
            </h2>
            <p className="mt-4 text-lg leading-8 text-ink-muted">
              No son solo profesionales: también han migrado, extrañado y vuelto a empezar. Entienden por dentro lo que estás viviendo.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Marquee infinito */}
      <div className="marquee-pause relative mt-12 flex w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <div className="animate-marquee flex w-max" style={{ ["--marquee-duration" as string]: "48s" }}>
          {loop.map((s, i) => (
            <SpecialistCard key={`${s.name}-${i}`} s={s} />
          ))}
        </div>
      </div>

      <div className="container mt-10 flex justify-center">
        <Link
          href="/registro"
          className="cta-shine inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-surface-inverse-foreground shadow-[0_16px_40px_rgba(99,48,35,0.22)] transition-transform hover:-translate-y-1"
        >
          Quiero hablar con alguien <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────
   Frases de los doctores en el inicio + contáctanos
   ─────────────────────────────────────────────────────────── */
export function DoctorPhrasesStrip({ phone }: { phone?: string }) {
  const formatted = formatContactPhone(phone);
  return (
    <section className="border-y border-line bg-card py-16">
      <div className="container">
        <Reveal variant="up">
          <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-primary">
            En sus propias palabras
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-balance text-center text-3xl font-black tracking-tight text-ink md:text-5xl">
            Frases que quizá también son tuyas
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {SPECIALISTS.map((s, i) => (
            <Reveal key={s.name} variant="up" delay={i * 90}>
              <article className="group flex h-full items-start gap-4 rounded-[1.5rem] border border-line bg-background p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_50px_rgba(43,27,23,0.10)]">
                <LandingImg
                  name={s.image}
                  alt={s.name}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm"
                />
                <div>
                  <Quote className="h-5 w-5 text-primary/30" aria-hidden="true" />
                  <p className="mt-1 font-display text-lg italic leading-7 text-ink-soft">“{s.phrase}”</p>
                  <p className="mt-3 text-sm font-bold text-ink">{s.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">{s.role}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Contáctanos */}
        <Reveal variant="up">
          <div className="mt-12 flex flex-col items-center gap-4 rounded-[2rem] border border-primary/15 bg-gradient-to-br from-surface-accent to-surface-sunken px-8 py-10 text-center">
            <h3 className="font-display text-2xl font-bold text-ink md:text-3xl">
              ¿Y si hoy es un buen día para empezar?
            </h3>
            <p className="max-w-xl text-ink-muted">
              Escríbenos por WhatsApp cuando te sientas listo. No hace falta tener las palabras perfectas: empezamos por donde estés, sin apuros y sin juicios.
            </p>
            <a
              href={phone ? contactHref(phone) : "#contacto"}
              target={phone ? "_blank" : undefined}
              rel={phone ? "noreferrer" : undefined}
              className="cta-shine inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-bold text-surface-inverse-foreground shadow-[0_16px_40px_rgba(37,211,102,0.3)] transition-transform hover:-translate-y-1"
            >
              <MessageCircle className="h-5 w-5" />
              {formatted ? `Contáctanos: ${formatted}` : "Contáctanos por WhatsApp"}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────
   Imagen impactante de migración → invita a biblioteca
   ─────────────────────────────────────────────────────────── */
export function MigrationInvite() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <LandingImg
          name={MIGRATION_INVITE_IMAGE}
          alt="Personas migrando a través del paisaje"
          loading="eager"
          className="animate-ken-burns h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-inverse/94 via-surface-inverse/75 to-surface-inverse/35" />
      </div>

      <div className="container flex min-h-[20rem] items-center py-14 sm:py-20 md:min-h-[30rem] md:py-24">
        <div className="max-w-2xl text-surface-inverse-foreground">
          <Reveal variant="up">
            <span className="inline-flex items-center gap-2 rounded-full border border-surface-inverse-foreground/25 bg-surface-inverse-foreground/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-surface-inverse-foreground/85 backdrop-blur">
              <BookOpen className="h-3.5 w-3.5" /> Biblioteca emocional
            </span>
          </Reveal>
          <Reveal variant="up" delay={120}>
            <blockquote className="mt-6 font-display text-3xl font-medium italic leading-tight md:text-5xl">
              “Cuando migras, no te vas solo: te llevas tu gente, tu idioma y tu historia.”
            </blockquote>
          </Reveal>
          <Reveal variant="up" delay={240}>
            <p className="mt-6 max-w-xl text-lg leading-8 text-surface-inverse-foreground/75">
              Historias reales, guías y columnas para esos días en que cuesta explicar lo que sientes. Léelas a tu ritmo; aquí nadie te apura.
            </p>
          </Reveal>
          <Reveal variant="up" delay={340}>
            <Link
              href="/biblioteca"
              className="cta-shine mt-8 inline-flex items-center gap-2 rounded-full bg-card px-7 py-3.5 text-sm font-bold text-ink shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-1"
            >
              Entrar a la biblioteca <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────
   Descargables + integración Hotmart
   ─────────────────────────────────────────────────────────── */
export function DownloadsHotmart() {
  return (
    <section id="descargables" className="scroll-mt-28 bg-background py-20">
      <div className="container">
        <Reveal variant="up">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Download className="h-3.5 w-3.5" /> Recursos descargables
            </span>
            <h2 className="mt-5 text-balance text-4xl font-black tracking-tight text-ink md:text-6xl">
              Recursos para llevarte contigo
            </h2>
            <p className="mt-4 text-lg leading-8 text-ink-muted">
              Guías, audios y ejercicios sencillos para practicar en casa. Descárgalos y avanza a tu propio ritmo, sin presión.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {DOWNLOADABLES.map((d, i) => (
            <Reveal key={d.title} variant="up" delay={i * 110}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-card shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-[0_26px_70px_rgba(43,27,23,0.14)]">
                <div className="relative h-44 overflow-hidden">
                  <LandingImg
                    name={d.cover}
                    alt={d.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-clay backdrop-blur">
                    {d.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-bold text-ink">{d.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-ink-muted">{d.description}</p>
                  <a
                    href={d.hotmartUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-surface-inverse px-4 py-3 text-sm font-bold text-surface-inverse-foreground transition-transform hover:-translate-y-0.5 hover:bg-surface-inverse"
                  >
                    <Download className="h-4 w-4" /> Descargar en Hotmart
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────
   Banda de imágenes (hero) — tira superior con movimiento
   ─────────────────────────────────────────────────────────── */
export function ImageMarqueeStrip() {
  const loop = [...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES];
  return (
    <div className="marquee-pause relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
      <div className="animate-marquee-reverse flex w-max gap-4" style={{ ["--marquee-duration" as string]: "55s" }}>
        {loop.map((name, i) => (
          <div key={`${name}-${i}`} className="h-40 w-64 shrink-0 overflow-hidden rounded-2xl border border-card/50 shadow-sm md:h-48 md:w-80">
            <LandingImg name={name} alt="Historias de migración" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
