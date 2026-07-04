import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, HeartHandshake, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { env } from "@/config/env";
import { fileServer } from "@/config/file-server";
import { contactHref, normalizeContactPhone } from "@/features/landing/contact";
import type { LandingLink, LandingSection, NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { resolveLandingImage, resolveLogoUrl } from "@/features/public-view/public-view.normalizer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

const forbiddenPublicNav = /proceso|process|agendar|booking|cita/i;

function safeHref(link?: LandingLink, fallback = "#") {
  return link?.href || fallback;
}

function actionHref(link?: LandingLink, fallback = "/login") {
  if (!link?.action) return safeHref(link, fallback);
  if (/login|ingresar|agendar|booking/i.test(link.action)) return "/login";
  if (/register|registro|signup/i.test(link.action)) return "/registro";
  if (/admin/i.test(link.action)) return "/admin/login";
  return safeHref(link, fallback);
}

function isExternal(href?: string) {
  return !!href && /^https?:\/\//i.test(href);
}

function publicNavLinks(landing: NormalizedPublicLanding) {
  const configured = landing.navbar.links
    .filter((link) => !forbiddenPublicNav.test(`${link.label} ${link.href ?? ""} ${link.action ?? ""}`))
    .slice(0, 4);

  const hasLibrary = configured.some((link) => /biblioteca/i.test(`${link.label} ${link.href ?? ""}`));
  return hasLibrary ? configured : [...configured, { label: "Biblioteca", href: "/biblioteca" }];
}

function ContactLink({ phone, compact = false }: { phone?: string; compact?: boolean }) {
  const normalizedPhone = normalizeContactPhone(phone);
  const href = contactHref(normalizedPhone);
  if (!normalizedPhone || !href) return null;

  return (
    <a
      className={compact
        ? "inline-flex shrink-0 items-center gap-2 rounded-full border border-[#173c35]/10 bg-white/76 px-4 py-2 text-xs font-bold text-[#173c35]"
        : "inline-flex items-center gap-2 rounded-full border border-[#173c35]/10 bg-white/78 px-3 py-2 text-xs font-bold text-[#173c35] shadow-sm"}
      href={href}
      target={isExternal(href) ? "_blank" : undefined}
      rel={isExternal(href) ? "noreferrer" : undefined}
    >
      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
      {normalizedPhone}
    </a>
  );
}

function ContactButton({ phone, className = "" }: { phone?: string; className?: string }) {
  const href = contactHref(phone);
  if (!href) return null;

  return (
    <Button asChild className={`rounded-full ${className}`} variant="outline">
      <a href={href} target={isExternal(href) ? "_blank" : undefined} rel={isExternal(href) ? "noreferrer" : undefined}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" /> Contactar
      </a>
    </Button>
  );
}

function PublicNavbar({ landing }: { landing: NormalizedPublicLanding }) {
  const logo = resolveLogoUrl(landing.navbar, landing.uiById);
  const links = publicNavLinks(landing);
  const brand = landing.navbar.brand || landing.title || "Corazón Migrante";

  return (
    <header className="sticky top-0 z-40 border-b border-[#173c35]/10 bg-[#fbf8f3]/92 backdrop-blur-2xl">
      <div className="container flex min-h-[4.75rem] items-center justify-between gap-4 py-3">
        <Link href="/" className="group flex min-w-0 items-center gap-3 transition-transform duration-200 motion-reduce:transition-none md:hover:-translate-y-0.5" aria-label="Ir al inicio">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-[#173c35]/10 bg-white shadow-sm transition group-hover:shadow-md">
            {logo ? <img src={logo} alt={brand} className="h-full w-full object-contain p-1.5" /> : <HeartHandshake className="h-5 w-5 text-primary" aria-hidden="true" />}
          </span>
          <span className="truncate leading-tight">
            <span className="block truncate text-[1.05rem] font-black tracking-[-0.02em] text-[#172b27]">{brand}</span>
            {landing.navbar.tagline ? <span className="block truncate text-xs font-semibold text-[#766f66]">{landing.navbar.tagline}</span> : null}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navegación pública">
          {links.map((item) => (
            <Link className="inline-flex rounded-full px-1 text-sm font-semibold text-[#625e57] transition duration-200 hover:-translate-y-0.5 hover:text-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0" href={safeHref(item)} key={`${item.label}-${item.href}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ContactLink phone={landing.phone} />
          <ContactButton phone={landing.phone} className="px-4" />
          <Button asChild className="rounded-full" variant="ghost">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild className="rounded-full px-5 shadow-[0_16px_40px_rgba(35,99,89,0.18)]">
            <Link href={actionHref(landing.navbar.cta, "/registro")}>{landing.navbar.cta?.label || "Crear cuenta"}</Link>
          </Button>
        </div>
      </div>

      <nav className="container flex gap-2 overflow-x-auto pb-3 md:hidden" aria-label="Navegación pública móvil">
        {links.map((item) => (
          <Link className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#173c35]/10 bg-white/76 px-4 py-2 text-xs font-bold text-[#625e57] transition duration-200 active:scale-[0.98] motion-reduce:transition-none" href={safeHref(item)} key={`${item.label}-${item.href}-mobile`}>
            {/biblioteca/i.test(`${item.label} ${item.href ?? ""}`) ? <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {item.label}
          </Link>
        ))}
        <ContactButton phone={landing.phone} className="h-8 px-4 text-xs" />
        <Link className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white" href="/login">
          Ingresar
        </Link>
      </nav>
    </header>
  );
}

function TextBlock({ value }: { value?: string | string[] }) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    if (items.length === 0) return null;
    return (
      <ul className="mt-7 grid gap-3 text-sm text-[#5f5b54] sm:grid-cols-2">
        {items.map((item) => (
          <li className="inline-flex items-center gap-2 rounded-full border border-[#173c35]/10 bg-white/72 px-4 py-2 shadow-sm backdrop-blur" key={item}>
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-[#625e57] md:text-lg">{value}</p>;
}

function EmptyPublicContent() {
  return (
    <section className="container py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#e3d8cb] bg-white/82 p-8 text-center shadow-soft">
        <ShieldCheck className="mx-auto h-9 w-9 text-primary" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-black tracking-tight text-[#172b27]">Corazón Migrante</h1>
        <p className="mt-3 text-sm leading-6 text-[#625e57]">La página pública estará disponible pronto.</p>
      </div>
    </section>
  );
}

function HeroImage({ landing }: { landing: NormalizedPublicLanding }) {
  const hero = landing.hero;
  const title = hero?.title || landing.title || "Corazón Migrante";
  const imageSrc = resolveLandingImage(hero?.image, landing.uiById, fileServer.landingHeroImageUrl || fileServer.authImageUrl);

  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
      <div className="absolute -inset-3 rounded-[2.4rem] bg-[#173c35]/5" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[2.2rem] border border-white/80 bg-white/70 p-2 shadow-[0_28px_80px_rgba(23,43,39,0.13)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-[#ded8cf] lg:aspect-[5/6]">
          {imageSrc ? <img alt={hero?.image?.alt || title} className="absolute inset-0 h-full w-full object-cover" src={imageSrc} /> : null}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#102f2a]/82 via-[#102f2a]/20 to-transparent p-6 text-white md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">{landing.navbar.brand || landing.title || "Corazón Migrante"}</p>
            {hero?.image?.footerText ? <p className="mt-3 max-w-sm text-2xl font-black leading-tight tracking-tight md:text-3xl">{hero.image.footerText}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ landing }: { landing: NormalizedPublicLanding }) {
  const hero = landing.hero;
  const title = hero?.title || landing.title;
  const contact = contactHref(landing.phone);

  if (!title && !hero?.subtitle) return <EmptyPublicContent />;

  return (
    <section className="relative overflow-hidden bg-[#fbf8f3]">
      <div className="pointer-events-none absolute left-[-18rem] top-[-20rem] h-[42rem] w-[42rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="container relative grid min-h-[calc(100vh-4.75rem)] gap-12 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-20">
        <div className="max-w-3xl">
          {hero?.badge || hero?.eyebrow ? (
            <Badge variant="secondary" className="border border-[#173c35]/10 bg-white/76 px-4 py-2 text-primary shadow-sm">
              {hero.badge || hero.eyebrow}
            </Badge>
          ) : null}

          <h1 className="mt-6 text-balance text-5xl font-black tracking-[-0.055em] text-[#172b27] md:text-7xl lg:text-[5.35rem] lg:leading-[0.93]">{title}</h1>
          {hero?.subtitle ? <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-[#625e57] md:text-xl">{hero.subtitle}</p> : null}
          <TextBlock value={hero?.description} />

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-[3.25rem] rounded-full px-7 shadow-[0_18px_45px_rgba(35,99,89,0.20)]" size="lg">
              <Link href={actionHref(hero?.primaryCta, "/registro")}>
                {hero?.primaryCta?.label || "Crear cuenta"} <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild className="h-[3.25rem] rounded-full border-[#cfc4b8] bg-white/80 px-7 hover:bg-white" size="lg" variant="outline">
              <Link href={actionHref(hero?.secondaryCta, "/login")}>{hero?.secondaryCta?.label || "Ingresar"}</Link>
            </Button>
            {contact ? <ContactButton phone={landing.phone} className="h-[3.25rem] px-7" /> : null}
          </div>

          {landing.phone ? (
            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-[#625e57]">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a8176]">Contacto</span>
              <ContactLink phone={landing.phone} />
            </div>
          ) : null}
        </div>

        <HeroImage landing={landing} />
      </div>
    </section>
  );
}

function CardGrid({ section }: { section: LandingSection }) {
  if (!section.items || section.items.length === 0) return null;

  return (
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      {section.items.map((item, index) => (
        <Card className="overflow-hidden border-[#e3d8cb] bg-white/[0.86] shadow-[0_18px_55px_rgba(23,43,39,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(23,43,39,0.13)]" key={`${item.title}-${index}`}>
          {item.image?.src ? <img src={item.image.src} alt={item.image.alt || item.title || "Imagen"} className="h-48 w-full object-cover" /> : null}
          <CardContent className="p-7">
            {item.label ? <Badge variant="secondary" className="border border-[#173c35]/10 bg-[#edf3f0] text-primary">{item.label}</Badge> : null}
            {item.title ? <h3 className="mt-5 text-xl font-black tracking-tight text-[#172b27]">{item.title}</h3> : null}
            {item.body || item.description ? <p className="mt-3 text-sm leading-6 text-[#6d675f]">{item.body || item.description}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SplitSection({ section, landing }: { section: LandingSection; landing: NormalizedPublicLanding }) {
  const imageSrc = resolveLandingImage(section.image, landing.uiById);

  return (
    <section className="container py-16" id={section.id}>
      <div className="grid gap-10 rounded-[2.25rem] border border-[#e5dbcf] bg-white/64 p-6 shadow-[0_20px_70px_rgba(23,43,39,0.07)] md:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          {section.badge || section.label ? <Badge variant="secondary" className="border border-[#173c35]/10 bg-white/74 text-primary">{section.badge || section.label}</Badge> : null}
          {section.title ? <h2 className="mt-4 text-balance text-4xl font-black tracking-tight text-[#172b27] md:text-5xl">{section.title}</h2> : null}
          {section.subtitle ? <p className="mt-5 text-lg leading-8 text-[#625e57]">{section.subtitle}</p> : null}
          {section.body ? <p className="mt-5 text-base leading-8 text-[#625e57]">{section.body}</p> : null}
          {section.paragraphs?.map((paragraph) => <p className="mt-4 text-base leading-8 text-[#625e57]" key={paragraph}>{paragraph}</p>)}
          {(section.primaryCta || section.secondaryCta) ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {section.primaryCta ? <Button asChild className="rounded-full"><Link href={actionHref(section.primaryCta)}>{section.primaryCta.label}</Link></Button> : null}
              {section.secondaryCta ? <Button asChild className="rounded-full" variant="outline"><Link href={actionHref(section.secondaryCta)}>{section.secondaryCta.label}</Link></Button> : null}
            </div>
          ) : null}
        </div>

        {imageSrc ? (
          <div className="overflow-hidden rounded-[1.85rem] bg-[#ded8cf] shadow-[0_18px_55px_rgba(23,43,39,0.11)]">
            <img src={imageSrc} alt={section.image?.alt || section.title || "Sección"} className="h-[27rem] w-full object-cover" />
          </div>
        ) : null}
      </div>
      <CardGrid section={section} />
    </section>
  );
}

function StandardSection({ section, landing }: { section: LandingSection; landing: NormalizedPublicLanding }) {
  if (section.layout === "split" || section.image?.src || section.image?.idUi) return <SplitSection section={section} landing={landing} />;
  if (section.layout === "cta") return <CtaSection section={section} phone={landing.phone} />;

  return (
    <section className="container py-16" id={section.id}>
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
        <div>
          {section.badge || section.label ? <Badge variant="secondary" className="border border-[#173c35]/10 bg-white/74 text-primary">{section.badge || section.label}</Badge> : null}
          {section.title ? <h2 className="mt-4 text-balance text-4xl font-black tracking-tight text-[#172b27] md:text-5xl">{section.title}</h2> : null}
        </div>
        <div>
          {section.subtitle ? <p className="max-w-3xl text-lg leading-8 text-[#625e57]">{section.subtitle}</p> : null}
          {section.body ? <p className="mt-3 max-w-3xl text-base leading-8 text-[#625e57]">{section.body}</p> : null}
        </div>
      </div>
      <CardGrid section={section} />
    </section>
  );
}

function CtaSection({ section, phone }: { section: LandingSection; phone?: string }) {
  return (
    <section className="container py-16" id={section.id}>
      <div className="relative overflow-hidden rounded-[2.35rem] bg-[#102f2a] p-8 text-white shadow-[0_35px_90px_rgba(16,47,42,0.18)] md:p-12">
        <div className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-3xl">
          {section.badge || section.label ? <Badge className="border border-white/15 bg-white/10 text-white">{section.badge || section.label}</Badge> : null}
          {section.title ? <h2 className="mt-5 text-balance text-4xl font-black tracking-tight md:text-5xl">{section.title}</h2> : null}
          {section.subtitle || section.body ? <p className="mt-5 text-lg leading-8 text-white/72">{section.subtitle || section.body}</p> : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {section.primaryCta ? <Button asChild className="rounded-full bg-white text-[#102f2a] hover:bg-white/90"><Link href={actionHref(section.primaryCta)}>{section.primaryCta.label}</Link></Button> : null}
            {section.secondaryCta ? <Button asChild className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10" variant="outline"><Link href={actionHref(section.secondaryCta)}>{section.secondaryCta.label}</Link></Button> : null}
            <ContactButton phone={phone} className="border-white/25 bg-transparent text-white hover:bg-white/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ landing }: { landing: NormalizedPublicLanding }) {
  const brand = landing.navbar.brand || landing.title || "Corazón Migrante";

  return (
    <footer className="border-t border-[#173c35]/10 bg-[#102f2a] text-white">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.15fr_0.85fr_1fr]">
        <div>
          <p className="text-lg font-black">{brand}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/64">{landing.footer?.note || landing.seoDescription || "Acompañamiento emocional con una experiencia clara, privada y humana."}</p>
        </div>
        <div>
          <p className="font-semibold">Accesos</p>
          <div className="mt-3 grid gap-2 text-sm text-white/64">
            <Link className="transition hover:text-white" href="/biblioteca">Biblioteca</Link>
            <Link className="transition hover:text-white" href="/login">Ingresar</Link>
            <Link className="transition hover:text-white" href="/registro">Crear cuenta</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Atención responsable</p>
          <p className="mt-3 text-sm leading-6 text-white/64">Este sitio no reemplaza servicios de emergencia ni ofrece diagnósticos automáticos.</p>
          {landing.phone ? <div className="mt-4"><ContactLink phone={landing.phone} compact /></div> : null}
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFab({ phone }: { phone?: string }) {
  const href = contactHref(phone);
  if (!href) return null;

  return (
    <a href={href} target={isExternal(href) ? "_blank" : undefined} rel={isExternal(href) ? "noreferrer" : undefined} className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#1f6f5f] text-white shadow-[0_18px_45px_rgba(31,111,95,0.28)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(31,111,95,0.34)] active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0" aria-label="Contactar">
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}

export function PublicLandingPage({ landing }: { landing: NormalizedPublicLanding }) {
  const landingWithPublicDefaults = {
    ...landing,
    phone: landing.phone ?? env.NEXT_PUBLIC_PUBLIC_CONTACT_PHONE
  };

  return (
    <div className="min-h-screen bg-[#fbf8f3]">
      <PublicNavbar landing={landingWithPublicDefaults} />
      <main id="contenido">
        <Hero landing={landingWithPublicDefaults} />
        {landingWithPublicDefaults.sections.map((section) => (
          <StandardSection section={section} landing={landingWithPublicDefaults} key={`${section.code}-${section.id}`} />
        ))}
      </main>
      <Footer landing={landingWithPublicDefaults} />
      <WhatsAppFab phone={landingWithPublicDefaults.phone} />
    </div>
  );
}
