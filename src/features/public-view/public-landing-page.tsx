import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, HeartHandshake, LockKeyhole, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { fileServer } from "@/config/file-server";
import type { LandingLink, LandingSection, NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { resolveLandingImage, resolveLogoUrl } from "@/features/public-view/public-view.normalizer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

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

function textBlock(value?: string | string[]) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    if (items.length === 0) return null;
    return (
      <ul className="mt-7 grid gap-3 text-sm text-[#5f5b54] sm:grid-cols-2">
        {items.map((item) => (
          <li className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm backdrop-blur" key={item}>
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-[#625e57] md:text-xl">{value}</p>;
}

function PublicNavbar({ landing }: { landing: NormalizedPublicLanding }) {
  const logo = resolveLogoUrl(landing.navbar, landing.uiById);
  const links = landing.navbar.links.length > 0 ? landing.navbar.links : landing.sections.map((section) => ({ label: section.title || section.label || section.id, href: `#${section.id}` })).slice(0, 4);
  const brand = landing.navbar.brand || landing.title || "Corazón Migrante";

  return (
    <header className="sticky top-0 z-40 border-b border-[#1a342f]/10 bg-[#fbf8f3]/90 backdrop-blur-2xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3 font-bold" aria-label="Ir al inicio">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-[#1a342f]/10 bg-white shadow-sm transition group-hover:shadow-md">
            {logo ? <img src={logo} alt={brand} className="h-full w-full object-contain p-1.5" /> : <HeartHandshake className="h-6 w-6 text-primary" aria-hidden="true" />}
          </span>
          <span className="leading-tight text-[#172b27]">
            {brand}
            {landing.navbar.tagline ? <span className="block text-xs font-medium text-[#6d675f]">{landing.navbar.tagline}</span> : null}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegación pública">
          {links.map((item) => (
            <Link className="text-sm font-semibold text-[#625e57] transition hover:text-primary" href={safeHref(item)} key={`${item.label}-${item.href}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild className="rounded-2xl" variant="ghost">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild className="rounded-2xl shadow-[0_16px_40px_rgba(35,99,89,0.20)]">
            <Link href={actionHref(landing.navbar.cta, "/registro")}>{landing.navbar.cta?.label || "Crear cuenta"}</Link>
          </Button>
        </div>
      </div>

      <nav className="container flex gap-2 overflow-x-auto pb-3 md:hidden" aria-label="Navegación pública móvil">
        {links.map((item) => (
          <Link className="shrink-0 rounded-full border border-[#1a342f]/10 bg-white/72 px-4 py-2 text-xs font-semibold text-[#625e57]" href={safeHref(item)} key={`${item.label}-${item.href}-mobile`}>
            {item.label}
          </Link>
        ))}
        <Link className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white" href="/login">
          Ingresar
        </Link>
      </nav>
    </header>
  );
}

function Hero({ landing }: { landing: NormalizedPublicLanding }) {
  const hero = landing.hero;
  const imageSrc = resolveLandingImage(hero?.image, landing.uiById, fileServer.landingHeroImageUrl || fileServer.authImageUrl);
  const title = hero?.title || landing.title;

  if (!title && !hero?.subtitle) {
    return (
      <section className="container py-16">
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5" aria-hidden="true" />
            <div>
              <h1 className="text-2xl font-black">La vista pública está publicada, pero no tiene contenido de inicio.</h1>
              <p className="mt-2 text-sm leading-6">Configura al menos un elemento con código <strong>hero</strong> desde Vistas públicas. No se renderiza contenido falso.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-[#1a342f]/10 bg-[#fbf8f3]">
      <div className="pointer-events-none absolute left-[-12rem] top-[-14rem] h-[40rem] w-[40rem] rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-18rem] right-[-12rem] h-[42rem] w-[42rem] rounded-full bg-[#8c4a62]/12 blur-3xl" />

      <div className="container relative grid min-h-[calc(100vh-5rem)] gap-12 py-12 lg:grid-cols-[0.96fr_1.04fr] lg:items-center lg:py-20">
        <div className="max-w-3xl">
          {hero?.badge || hero?.eyebrow ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/76 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> {hero.badge || hero.eyebrow}
            </div>
          ) : null}

          <h1 className="mt-7 text-balance text-5xl font-black tracking-[-0.055em] text-[#172b27] md:text-7xl">{title}</h1>
          {hero?.subtitle ? <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-[#625e57] md:text-xl">{hero.subtitle}</p> : null}
          {textBlock(hero?.description)}

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-[3.35rem] rounded-2xl px-7 shadow-[0_18px_45px_rgba(35,99,89,0.22)]" size="lg">
              <Link href={actionHref(hero?.primaryCta, "/login")}>
                {hero?.primaryCta?.label || "Ingresar para agendar"} <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            {hero?.secondaryCta ? (
              <Button asChild className="h-[3.35rem] rounded-2xl border-[#cfc4b8] bg-white/78 px-7 hover:bg-white" size="lg" variant="outline">
                <Link href={actionHref(hero.secondaryCta, "#contenido")}>{hero.secondaryCta.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[36rem] lg:max-w-none">
          <div className="absolute -left-4 top-8 z-10 hidden rounded-[1.75rem] border border-white/70 bg-white/86 p-4 shadow-[0_20px_55px_rgba(23,43,39,0.13)] backdrop-blur md:block">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4f0ec] text-primary">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#172b27]">Flujo protegido</p>
                <p className="text-xs text-[#6d675f]">La agenda se realiza con sesión</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2.75rem] border border-white/75 bg-white/60 p-3 shadow-[0_36px_95px_rgba(23,43,39,0.18)] backdrop-blur">
            <div className="relative min-h-[35rem] overflow-hidden rounded-[2.2rem] bg-[#d8d0c4]">
              {imageSrc ? <img alt={hero?.image?.alt || title || "Imagen principal"} className="absolute inset-0 h-full w-full object-cover" src={imageSrc} /> : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#102f2a]/86 via-[#102f2a]/22 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/68">{landing.navbar.brand || landing.title}</p>
                {hero?.image?.footerText ? <h2 className="mt-3 max-w-md text-3xl font-black tracking-tight md:text-4xl">{hero.image.footerText}</h2> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CardGrid({ section }: { section: LandingSection }) {
  if (!section.items || section.items.length === 0) return null;
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      {section.items.map((item, index) => (
        <Card className="group overflow-hidden border-[#e3d8cb] bg-white/[0.84] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(23,43,39,0.13)]" key={`${item.title}-${index}`}>
          {item.image?.src ? <img src={item.image.src} alt={item.image.alt || item.title || "Imagen"} className="h-48 w-full object-cover" /> : null}
          <CardContent className="p-7">
            {item.label ? <Badge variant="secondary" className="border border-[#1a342f]/10 bg-[#e4f0ec] text-primary">{item.label}</Badge> : null}
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
      <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          {section.badge || section.label ? <Badge variant="secondary" className="border border-[#1a342f]/10 bg-white/70 text-primary">{section.badge || section.label}</Badge> : null}
          {section.title ? <h2 className="mt-4 text-balance text-4xl font-black tracking-tight text-[#172b27] md:text-5xl">{section.title}</h2> : null}
          {section.subtitle ? <p className="mt-5 text-lg leading-8 text-[#625e57]">{section.subtitle}</p> : null}
          {section.body ? <p className="mt-5 text-base leading-8 text-[#625e57]">{section.body}</p> : null}
          {section.paragraphs?.map((paragraph) => <p className="mt-4 text-base leading-8 text-[#625e57]" key={paragraph}>{paragraph}</p>)}
          {(section.primaryCta || section.secondaryCta) ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {section.primaryCta ? <Button asChild className="rounded-2xl"><Link href={actionHref(section.primaryCta)}>{section.primaryCta.label}</Link></Button> : null}
              {section.secondaryCta ? <Button asChild className="rounded-2xl" variant="outline"><Link href={actionHref(section.secondaryCta)}>{section.secondaryCta.label}</Link></Button> : null}
            </div>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-[2.25rem] border border-white/75 bg-white/70 p-3 shadow-[0_28px_80px_rgba(23,43,39,0.13)]">
          {imageSrc ? (
            <img src={imageSrc} alt={section.image?.alt || section.title || "Sección"} className="h-[28rem] w-full rounded-[1.75rem] object-cover" />
          ) : (
            <div className="grid h-[28rem] place-items-center rounded-[1.75rem] bg-[#e4f0ec] text-center text-sm font-semibold text-primary">
              Imagen configurable pendiente en Vistas públicas
            </div>
          )}
        </div>
      </div>
      <CardGrid section={section} />
    </section>
  );
}

function StandardSection({ section, landing }: { section: LandingSection; landing: NormalizedPublicLanding }) {
  if (section.layout === "split" || section.image?.src || section.image?.idUi) return <SplitSection section={section} landing={landing} />;
  if (section.layout === "cta") return <CtaSection section={section} />;

  return (
    <section className="container py-16" id={section.id}>
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
        <div>
          {section.badge || section.label ? <Badge variant="secondary" className="border border-[#1a342f]/10 bg-white/70 text-primary">{section.badge || section.label}</Badge> : null}
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

function CtaSection({ section }: { section: LandingSection }) {
  return (
    <section className="container py-16" id={section.id}>
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#102f2a] p-8 text-white shadow-[0_35px_90px_rgba(16,47,42,0.20)] md:p-12">
        <div className="pointer-events-none absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-3xl">
          {section.badge || section.label ? <Badge className="border border-white/15 bg-white/10 text-white">{section.badge || section.label}</Badge> : null}
          {section.title ? <h2 className="mt-5 text-balance text-4xl font-black tracking-tight md:text-5xl">{section.title}</h2> : null}
          {section.subtitle || section.body ? <p className="mt-5 text-lg leading-8 text-white/70">{section.subtitle || section.body}</p> : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {section.primaryCta ? <Button asChild className="bg-white text-[#102f2a] hover:bg-white/90"><Link href={actionHref(section.primaryCta)}>{section.primaryCta.label}</Link></Button> : null}
            {section.secondaryCta ? <Button asChild className="border-white/25 text-white hover:bg-white/10" variant="outline"><Link href={actionHref(section.secondaryCta)}>{section.secondaryCta.label}</Link></Button> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ landing }: { landing: NormalizedPublicLanding }) {
  const brand = landing.navbar.brand || landing.title || "Corazón Migrante";
  return (
    <footer className="border-t border-[#1a342f]/10 bg-[#102f2a] text-white">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.15fr_0.85fr_1fr]">
        <div>
          <p className="text-lg font-black">{brand}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/64">{landing.footer?.note || landing.seoDescription || "Contenido público administrado desde Vistas públicas."}</p>
        </div>
        <div>
          <p className="font-semibold">Accesos</p>
          <div className="mt-3 grid gap-2 text-sm text-white/64">
            <Link className="transition hover:text-white" href="/login">Ingresar</Link>
            <Link className="transition hover:text-white" href="/registro">Crear cuenta</Link>
            <Link className="transition hover:text-white" href="/admin/login">Portal administrativo</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Atención responsable</p>
          <p className="mt-3 text-sm leading-6 text-white/64">La información de esta página se carga desde el backend público configurado. No reemplaza servicios de emergencia.</p>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFab({ phone }: { phone?: string }) {
  if (!phone) return null;
  const clean = phone.replace(/[^\d+]/g, "");
  return (
    <Link href={`https://wa.me/${clean.replace(/^\+/, "")}`} className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_18px_45px_rgba(37,211,102,0.30)]" aria-label="Escribir por WhatsApp">
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </Link>
  );
}

export function PublicLandingPage({ landing }: { landing: NormalizedPublicLanding }) {
  return (
    <div className="min-h-screen bg-[#fbf8f3]">
      <PublicNavbar landing={landing} />
      <main id="contenido">
        <Hero landing={landing} />
        {landing.sections.map((section) => (
          <StandardSection section={section} landing={landing} key={`${section.code}-${section.id}`} />
        ))}
        {landing.sections.length === 0 ? (
          <section className="container py-16">
            <div className="rounded-[2rem] border border-[#e3d8cb] bg-white/76 p-8 text-[#625e57] shadow-soft">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-2xl font-black text-[#172b27]">Vista conectada, contenido pendiente</h2>
                  <p className="mt-2 leading-7">El backend respondió, pero todavía no hay secciones activas adicionales para renderizar. Configúralas desde el panel de Vistas públicas.</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer landing={landing} />
      <WhatsAppFab phone={landing.phone} />
    </div>
  );
}
