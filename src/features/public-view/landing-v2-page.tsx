"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Heart,
  HeartHandshake,
  Languages,
  LockKeyhole,
  MapPinned,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  contactHref,
  formatContactPhone,
} from "@/features/landing/contact";
import { ScrollProgress } from "@/features/landing/scroll-progress";
import {
  humanizeTitle,
  linkKey,
  resolveV2Image,
  textFromValue,
} from "@/features/public-view/landing-v2.mapper";
import type {
  LandingV2Content,
  LandingV2IconText,
  LandingV2Image,
  LandingV2Link,
} from "@/features/public-view/landing-v2.types";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  AnimatedChatBubbles,
  Parallax,
  Reveal,
  useScrollNavbar,
} from "@/features/public-view/landing-motion";
import {
  DoctorPhrasesStrip,
  DoctorsCarousel,
  DownloadsHotmart,
  MigrationInvite,
} from "@/features/public-view/landing-sections";

type IconName = string | number | undefined;

const hiddenPublicLabels = /^(proceso|agendar|booking|cita|citas)$/i;
const hiddenPublicHrefs = /(booking|paciente|terapeuta|admin|#proceso)/i;

function iconFor(name: IconName, className = "h-5 w-5") {
  const key = String(name ?? "").toLowerCase();
  if (["lock", "shield", "verified", "check_circle"].includes(key)) {
    return <ShieldCheck className={className} aria-hidden="true" />;
  }
  if (["language", "globe"].includes(key)) {
    return <Languages className={className} aria-hidden="true" />;
  }
  if (["chat", "message", "message_circle"].includes(key)) {
    return <MessageCircle className={className} aria-hidden="true" />;
  }
  if (["map", "location"].includes(key)) {
    return <MapPinned className={className} aria-hidden="true" />;
  }
  if (["handshake", "groups"].includes(key)) {
    return <HeartHandshake className={className} aria-hidden="true" />;
  }
  if (["schedule", "event", "calendar"].includes(key)) {
    return <CalendarClock className={className} aria-hidden="true" />;
  }
  if (["users", "groups"].includes(key)) {
    return <UsersRound className={className} aria-hidden="true" />;
  }
  if (["phone", "contact"].includes(key)) {
    return <Phone className={className} aria-hidden="true" />;
  }
  if (["favorite", "heart"].includes(key)) {
    return <Heart className={className} aria-hidden="true" />;
  }
  return <Sparkles className={className} aria-hidden="true" />;
}

function richParts(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong className="font-black text-inherit" key={`${part}-${index}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function RichText({ text, className }: { text?: string; className?: string }) {
  if (!text) return null;
  return <p className={className}>{richParts(text)}</p>;
}

function TextList({
  items,
  className,
}: {
  items?: string[];
  className?: string;
}) {
  const clean = items?.filter(Boolean) ?? [];
  if (clean.length === 0) return null;
  return (
    <div className={className ?? "grid gap-4"}>
      {clean.map((item) => (
        <RichText
          className="text-base leading-8 text-[#625e57]"
          key={item}
          text={item}
        />
      ))}
    </div>
  );
}

function ImageBlock({
  image,
  landing,
  className,
  alt,
}: {
  image?: LandingV2Image;
  landing: NormalizedPublicLanding;
  className?: string;
  alt?: string;
}) {
  const src = resolveV2Image(image, landing);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={image?.alt || alt || "Imagen de Corazón Migrante"}
      className={className ?? "h-full w-full object-cover"}
      onError={(event) => {
        const target = event.currentTarget;
        // Respaldo: si falla la URL de Cloudinary, intenta la copia local por nombre.
        const cloudMatch = /\/landing_page\/media\/([^/?#]+)$/.exec(src);
        if (cloudMatch && !target.dataset.fallback) {
          target.dataset.fallback = "1";
          target.src = `/landing/${cloudMatch[1]}`;
          return;
        }
        target.style.display = "none";
      }}
    />
  );
}

function actionHref(link?: LandingV2Link, phone?: string, fallback = "#contacto") {
  const action = `${link?.action ?? ""} ${link?.label ?? ""} ${link?.href ?? ""}`;
  const href = link?.href?.trim();
  if (/scroll_to_/i.test(action) && href) return href;
  if (/login|acceder|ingresar|sesion|sesión/i.test(action)) return "/login";
  if (/sign_up|registr|cuenta|signup/i.test(action)) return "/registro";
  if (/contact|contacto|whatsapp|telefono|teléfono/i.test(action)) {
    return phone ? contactHref(phone) : href || fallback;
  }
  if (/especialistas|psicologos|psicólogos/i.test(action)) return href || "#psicologos";
  if (/availability|disponibilidad|booking|agendar|cita/i.test(action)) {
    return href && href !== "#" ? href : phone ? contactHref(phone) : "#contacto";
  }
  return href || fallback;
}

function externalTarget(href: string) {
  return /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

function normalizeFooterHref(href?: string) {
  const value = href?.trim();
  if (!value) return "#";
  if (/^#privacidad$/i.test(value)) return "/privacidad";
  if (/^#terminos$/i.test(value)) return "/terminos";
  return value;
}

function publicLinks(content: LandingV2Content) {
  const configured = content.navbar?.links ?? [];
  const clean = configured.filter((item) => {
    const label = item.label?.trim();
    const href = item.href?.trim() ?? "";
    if (!label) return false;
    if (hiddenPublicLabels.test(label)) return false;
    if (hiddenPublicHrefs.test(href)) return false;
    return true;
  });
  const hasLibrary = clean.some(
    (item) => /biblioteca|recursos/i.test(item.label ?? "") || item.href === "/biblioteca",
  );
  const library = hasLibrary ? [] : [{ label: "Biblioteca", href: "/biblioteca" }];
  const hasDownloads = clean.some((item) => /descarg/i.test(item.label ?? "") || item.href === "#descargables");
  const downloads = hasDownloads ? [] : [{ label: "Descargables", href: "#descargables" }];
  return [...clean, ...downloads, ...library];
}

function footerLegalLinks(content: LandingV2Content) {
  const configured = content.footer?.legal?.links ?? [];
  const normalized = configured
    .filter((item) => item.label?.trim())
    .map((item) => ({ ...item, href: normalizeFooterHref(item.href) }));
  const hasPrivacy = normalized.some((item) => /privacidad/i.test(item.label ?? "") || item.href === "/privacidad");
  const hasTerms = normalized.some((item) => /terminos/i.test(item.label ?? "") || item.href === "/terminos");
  return [
    ...normalized,
    ...(hasPrivacy ? [] : [{ label: "Privacidad", href: "/privacidad" }]),
    ...(hasTerms ? [] : [{ label: "Terminos", href: "/terminos" }]),
  ];
}

function SectionBadge({ badge }: { badge?: LandingV2IconText }) {
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

function Navbar({
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
          ? "border-[#361d17]/10 bg-[#fbf8f3]/95 shadow-[0_8px_30px_rgba(43,27,23,0.08)] backdrop-blur-2xl"
          : "border-transparent bg-[#fbf8f3]/70 backdrop-blur-xl"
      }`}
    >
      <div className={`container flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? "min-h-[4.25rem] py-2" : "min-h-20 py-3"}`}>
        <Link
          href={content.navbar?.brand?.href || "#inicio"}
          className="group flex min-w-0 items-center gap-3 font-bold"
          aria-label="Ir al inicio"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#361d17]/10 bg-white text-primary shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
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
          <span className="truncate leading-tight text-[#2b1b17]">
            {brand}
            <span className="block truncate text-xs font-medium text-[#6d675f]">
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
                  isActive ? "text-primary after:w-full" : "text-[#625e57] after:w-0 hover:after:w-full"
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
              className="hidden items-center gap-2 rounded-2xl border border-[#d9cec2] bg-white/75 px-4 py-2 text-sm font-semibold text-[#625e57] transition hover:bg-white 2xl:inline-flex"
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
        className="container flex gap-2 overflow-x-auto pb-3 xl:hidden"
        aria-label="Navegación pública móvil"
      >
        {links.map((item) => {
          const id = (item.href || "").replace(/^#/, "");
          const isActive = Boolean(id) && id === active;
          return (
            <Link
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                isActive ? "border-primary bg-primary text-white" : "border-[#361d17]/10 bg-white/76 text-[#625e57]"
              }`}
              href={item.href || "#"}
              key={linkKey(item, "mobile")}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
          href={actionHref(login, phone, "/login")}
        >
          {login?.label || "Acceder"}
        </Link>
        {signUp?.label ? (
          <Link
            className="shrink-0 rounded-full border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-primary"
            href={actionHref(signUp, phone, "/registro")}
          >
            {signUp.label}
          </Link>
        ) : null}
        {formattedPhone ? (
          <a
            className="shrink-0 rounded-full border border-[#361d17]/10 bg-white/76 px-4 py-2 text-xs font-semibold text-[#625e57]"
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

function HeroVisual({ hero }: { hero: LandingV2Content["hero"] }) {
  const visual = hero?.visual;
  const bubbles = visual?.bubbles?.filter((item) => item.text) ?? [];
  const stats = visual?.stats?.filter((item) => item.label || item.value) ?? [];
  const trustCards = hero?.trust_cards?.filter((item) => item.title || item.body) ?? [];

  return (
    <div className="relative mx-auto w-full max-w-[39rem] lg:max-w-none">
      <div className="absolute -left-5 top-8 z-10 hidden rounded-[1.7rem] border border-white/80 bg-white/88 p-4 shadow-[0_20px_55px_rgba(43,27,23,0.14)] backdrop-blur md:block">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f1e7e5] text-primary">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#2b1b17]">Espacio seguro</p>
            <p className="text-xs text-[#6d675f]">Escucha profesional</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2.6rem] border border-white/80 bg-white/68 p-3 shadow-[0_38px_95px_rgba(43,27,23,0.18)] backdrop-blur">
        <div className="overflow-hidden rounded-[2.15rem] border border-[#361d17]/10 bg-[#2e1610]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white">
                {iconFor(visual?.header?.icon || "chat", "h-5 w-5")}
              </span>
              <div>
                <p className="text-sm font-semibold text-white/60">Acompañamiento</p>
                <p className="font-black">{visual?.header?.title || "Tu bienestar, paso a paso"}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-100">
              Online
            </span>
          </div>

          <AnimatedChatBubbles bubbles={bubbles} />

          <div className="grid gap-3 bg-white px-5 py-5 sm:grid-cols-2">
            {stats.map((stat) => (
              <div
                className="rounded-2xl border border-[#361d17]/10 bg-[#fbf8f3] p-4"
                key={`${stat.label}-${stat.value}`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a746c]">
                  {stat.label}
                </p>
                <p className="mt-1 text-lg font-black text-[#2b1b17]">{stat.value}</p>
              </div>
            ))}
          </div>

          {textFromValue(visual?.note) ? (
            <div className="flex items-center gap-2 border-t border-[#361d17]/10 bg-white px-5 py-4 text-sm font-semibold text-[#625e57]">
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
              className="rounded-[1.35rem] border border-[#361d17]/10 bg-white/84 p-4 shadow-sm"
              key={`${card.title}-${card.body}`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                {iconFor(card.icon, "h-5 w-5")}
              </span>
              <p className="mt-3 font-black text-[#2b1b17]">{card.title}</p>
              <p className="mt-1 text-xs leading-5 text-[#625e57]">{card.body}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}


function PresentationSection({
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
    <section className="bg-white py-16">
      <div className="container grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <Reveal variant="right">
          <div>
            <SectionBadge badge={section.badge} />
            {section.title ? (
              <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] text-[#2b1b17] md:text-6xl">
                {section.title}
              </h2>
            ) : null}
            {section.subtitle ? (
              <p className="mt-5 text-xl leading-8 text-[#625e57]">{section.subtitle}</p>
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
                <Button asChild className="rounded-2xl border-[#cfc4b8] bg-white/78 transition-transform hover:-translate-y-1" variant="outline">
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
            <div className="group overflow-hidden rounded-[2.35rem] border border-[#e3d8cb] bg-[#fbf8f3] p-3 shadow-[0_28px_80px_rgba(43,27,23,0.13)]">
              <div className="relative min-h-[28rem] overflow-hidden rounded-[1.9rem] bg-[#e8ded3]">
                <ImageBlock
                  image={image}
                  landing={landing}
                  alt={section.title}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                {section.img_footer_text ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2e1610]/88 to-transparent p-7 text-white">
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

function Hero({ content, phone }: { content: LandingV2Content; phone?: string }) {
  const hero = content.hero;
  const titleLine1 = hero?.title_line_1 || hero?.title;
  const titleLine2 = hero?.title_line_2 || hero?.subtitle;
  const lead = hero?.lead?.length ? hero.lead : hero?.description;
  const primaryHref = actionHref(hero?.primary_cta, phone, "#contacto");
  const secondaryHref = actionHref(hero?.secondary_cta, phone, "#psicologos");

  return (
    <section id="inicio" className="relative isolate overflow-hidden bg-[#fbf8f3]">
      {/* Animated aurora background */}
      <div className="animate-aurora absolute left-[-20rem] top-[-18rem] -z-10 h-[42rem] w-[42rem] rounded-full bg-primary/14 blur-3xl" />
      <div className="animate-blob absolute bottom-[-20rem] right-[-16rem] -z-10 h-[44rem] w-[44rem] rounded-full bg-[#8c4a62]/12 blur-3xl" />
      <div className="animate-blob absolute left-[30%] top-[40%] -z-10 h-[26rem] w-[26rem] rounded-full bg-[#c98a4b]/8 blur-3xl" style={{ animationDelay: "3s" }} />

      <div className="container grid min-h-[calc(100vh-5rem)] gap-12 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-20">
        <div className="max-w-3xl">
          <Reveal variant="up">
            <SectionBadge badge={hero?.badge} />
          </Reveal>

          <Reveal variant="up" delay={120}>
            <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black tracking-[-0.055em] text-[#2b1b17] md:text-7xl">
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
                  className="h-[3.35rem] rounded-2xl border-[#cfc4b8] bg-white/78 px-7 text-base transition-transform hover:-translate-y-1 hover:bg-white"
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
      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[#8a8176] lg:flex">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em]">Desliza</span>
        <svg className="animate-scroll-cue h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}

function HistorySection({
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
    <section id={section.id || "mapa"} className="scroll-mt-28 bg-white py-20">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SectionBadge badge={section.badge} />
            <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] text-[#2b1b17] md:text-6xl">
              {section.title}
            </h2>
            {section.subtitle ? (
              <p className="mt-5 text-xl leading-8 text-[#625e57]">{section.subtitle}</p>
            ) : null}
            <div className="mt-8 overflow-hidden rounded-[2.2rem] border border-[#e3d8cb] bg-[#eee4da] shadow-[0_28px_80px_rgba(43,27,23,0.12)]">
              <ImageBlock
                image={section.image ?? rootImage}
                landing={landing}
                alt={section.title}
                className="h-[26rem] w-full object-cover"
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
              <div className="rounded-[2rem] border border-[#e3d8cb] bg-[#fbf8f3] p-7 md:p-9">
                <TextList items={main} />
              </div>
            ) : null}

            {additional.length > 0 ? (
              <div className="rounded-[2rem] border border-[#e3d8cb] bg-white p-7 shadow-sm md:p-9">
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
              <h3 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#2b1b17] md:text-5xl">
                Historias que explican lo que muchas veces no se dice
              </h3>
            </div>
            <div className="mt-9 grid gap-6">
              {testimonios.map(([title, item], index) => {
                const image = item.image;
                const text = item.paragraph ?? item.paragraphs ?? [];
                return (
                  <article
                    className="grid overflow-hidden rounded-[2.2rem] border border-[#e3d8cb] bg-[#fbf8f3] shadow-sm lg:grid-cols-[0.36fr_0.64fr]"
                    key={title}
                  >
                    <div className="min-h-[18rem] bg-[#e8ded3]">
                      <ImageBlock
                        image={image}
                        landing={landing}
                        alt={title}
                        className="h-full min-h-[18rem] w-full object-cover"
                      />
                    </div>
                    <div className="p-7 md:p-9">
                      <p className="text-sm font-bold text-primary">Historia {index + 1}</p>
                      <h4 className="mt-2 text-2xl font-black tracking-tight text-[#2b1b17]">
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
                className="rounded-[2rem] border border-[#d8ccc0] bg-[#2e1610] p-7 text-white shadow-[0_25px_70px_rgba(43,27,23,0.14)]"
                key={title}
              >
                <h4 className="text-2xl font-black tracking-tight">{title}</h4>
                <div className="mt-5 grid gap-4">
                  {items.map((item) => (
                    <p className="text-sm leading-7 text-white/75" key={item}>
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

function MissionSection({
  content,
  landing,
}: {
  content: LandingV2Content;
  landing: NormalizedPublicLanding;
}) {
  const section = content.sections?.mission;
  if (!section) return null;
  return (
    <section id={section.id || "mision"} className="scroll-mt-28 bg-[#fbf8f3] py-20">
      <div className="container grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <Reveal variant="right">
          <div>
            <SectionBadge badge={section.badge} />
            <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] text-[#2b1b17] md:text-6xl">
              {section.title}
            </h2>
            <TextList items={section.paragraphs} className="mt-7 grid gap-5" />
            {section.feature_cards?.length ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {section.feature_cards.map((card, i) => (
                  <Reveal variant="up" delay={i * 120} key={`${card.title}-${card.body}`}>
                    <div className="group h-full rounded-[1.5rem] border border-[#e3d8cb] bg-white/86 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(43,27,23,0.10)]">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        {iconFor(card.icon, "h-5 w-5")}
                      </span>
                      <h3 className="mt-4 text-lg font-black text-[#2b1b17]">{card.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#625e57]">{card.body}</p>
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
            <div className="overflow-hidden rounded-[2.35rem] border border-white/80 bg-white/72 p-3 shadow-[0_28px_80px_rgba(43,27,23,0.13)]">
              <ImageBlock
                image={section.image}
                landing={landing}
                alt={section.title}
                className="h-[34rem] w-full rounded-[1.9rem] object-cover"
              />
            </div>
          </Parallax>
        </Reveal>
      </div>
    </section>
  );
}

function EmotionsSection({
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
    <section id={section.id || "emociones"} className="scroll-mt-28 bg-white py-20">
      <div className="container">
        <Reveal variant="up">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">
              Salud emocional
            </p>
            <h2 className="mt-4 text-balance text-4xl font-black tracking-[-0.04em] text-[#2b1b17] md:text-6xl">
              {section.title}
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item, i) => (
            <Reveal variant="up" delay={i * 110} key={`${item.title}-${item.body}`}>
              <Card
                className="group h-full overflow-hidden border-[#e3d8cb] bg-[#fbf8f3] transition duration-300 hover:-translate-y-2 hover:shadow-[0_26px_70px_rgba(43,27,23,0.13)]"
              >
                <div className="h-52 overflow-hidden bg-[#e8ded3]">
                  <ImageBlock
                    image={item.image}
                    landing={landing}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-black tracking-tight text-[#2b1b17]">
                    {humanizeTitle(item.title)}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#625e57]">{item.body}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({
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
    <section id={section.id || "contacto"} className="scroll-mt-28 bg-white py-20">
      <div className="container">
        <Reveal variant="zoom">
        <div className="relative grid overflow-hidden rounded-[2.6rem] border border-[#361d17]/10 bg-[#2e1610] text-white shadow-[0_36px_95px_rgba(43,27,23,0.2)] lg:grid-cols-[0.62fr_0.38fr]">
          {/* animated glow inside dark card */}
          <div className="animate-blob pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="animate-blob pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-[#8c4a62]/25 blur-3xl" style={{ animationDelay: "2.5s" }} />
          <div className="relative p-8 md:p-12">
            <SectionBadge badge={section.badge} />
            <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] md:text-6xl">
              {section.title}
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">{section.body}</p>
            {section.bullets?.length ? (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {section.bullets.map((bullet, i) => (
                  <Reveal variant="up" delay={i * 90} key={textFromValue(bullet)}>
                    <div className="flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm leading-6 text-white/76 transition duration-300 hover:border-emerald-200/40 hover:bg-white/12">
                      {iconFor(bullet.icon, "mt-0.5 h-5 w-5 shrink-0 text-emerald-200")}
                      {textFromValue(bullet)}
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative border-t border-white/10 bg-white/8 p-8 md:p-10 lg:border-l lg:border-t-0">
            <div className="rounded-[2rem] bg-white p-7 text-[#2b1b17] shadow-[0_22px_70px_rgba(0,0,0,0.18)]">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
                Contacto
              </p>
              <h3 className="mt-3 text-2xl font-black">{section.card_body || "Reserva tu cita cuando estés listo."}</h3>
              {formattedPhone ? (
                <a
                  href={contactHref(phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 flex items-center gap-3 rounded-2xl border border-[#d8ccc0] bg-[#fbf8f3] px-4 py-3 font-black text-primary transition hover:bg-[#f4ece2]"
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
                <p className="mt-5 flex items-center gap-2 text-xs font-semibold leading-5 text-[#625e57]">
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

function Footer({ content, phone }: { content: LandingV2Content; phone?: string }) {
  const footer = content.footer;
  const year = new Date().getFullYear();
  const copyright = footer?.legal?.copyright_template?.replace("{year}", String(year));
  const links = footer?.quick_links?.length ? footer.quick_links : publicLinks(content);
  const legalLinks = footerLegalLinks(content);
  const formattedPhone = formatContactPhone(phone);
  return (
    <footer className="border-t border-[#331f1a]/10 bg-[#2e1610] text-white">
      <div className="container grid gap-10 py-14 lg:grid-cols-[1.15fr_0.75fr_1.1fr]">
        <div>
          <div className="flex items-center gap-3 text-lg font-black">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
              {iconFor(footer?.brand?.icon || "favorite", "h-5 w-5")}
            </span>
            {footer?.brand?.label || content.navbar?.brand?.label || "Corazón Migrante"}
          </div>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-white/64">
            {footer?.tagline?.map((item) => <p key={item}>{item}</p>)}
          </div>
          {formattedPhone ? (
            <a
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 py-2 text-sm font-bold text-white/85 transition hover:bg-white/12 hover:text-white"
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
          <div className="mt-3 grid gap-2 text-sm text-white/64">
            {links.map((item) => (
              <Link
                className="transition hover:text-white"
                href={item.href || "#"}
                key={linkKey(item, "footer")}
              >
                {item.label}
              </Link>
            ))}
            {links.some((item) => item.href === "/biblioteca" || /biblioteca/i.test(item.label ?? "")) ? null : (
              <Link className="transition hover:text-white" href="/biblioteca">
                Biblioteca
              </Link>
            )}
          </div>
        </div>

        <div>
          <p className="font-semibold">{footer?.notice?.title || "Aviso"}</p>
          <p className="mt-3 text-sm leading-6 text-white/64">{footer?.notice?.body}</p>
          {textFromValue(footer?.notice?.note) ? (
            <p className="mt-4 flex items-center gap-2 text-sm leading-6 text-white/64">
              {iconFor(footer?.notice?.note?.icon, "h-4 w-4")}
              {textFromValue(footer?.notice?.note)}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/50">
            {legalLinks.map((item) => (
              <Link className="transition hover:text-white" href={item.href || "#"} key={linkKey(item, "legal")}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        {copyright || `© ${year} Corazón Migrante. Todos los derechos reservados.`}
      </div>
    </footer>
  );
}

function FloatingContact({ phone }: { phone?: string }) {
  return (
    <a
      className="group fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(99,48,35,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-[#50251b]"
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

export function LandingV2Page({
  content,
  landing,
  phone,
}: {
  content: LandingV2Content;
  landing: NormalizedPublicLanding;
  phone?: string;
}) {
  return (
    <div className="landing-root min-h-screen bg-[#fbf8f3] text-[#2b1b17]">
      <ScrollProgress />
      <Navbar content={content} landing={landing} phone={phone} />
      <main>
        <Hero content={content} phone={phone} />
        <DoctorPhrasesStrip phone={phone} />
        <PresentationSection content={content} landing={landing} phone={phone} />
        <HistorySection content={content} landing={landing} />
        <MissionSection content={content} landing={landing} />
        <EmotionsSection content={content} landing={landing} />
        <DoctorsCarousel />
        <MigrationInvite />
        <DownloadsHotmart />
        <ContactSection content={content} phone={phone} />
      </main>
      <Footer content={content} phone={phone} />
      <FloatingContact phone={phone} />
    </div>
  );
}
