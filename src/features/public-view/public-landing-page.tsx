import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  HeartHandshake,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { fileServer } from "@/config/file-server";
import {
  contactHref,
  formatContactPhone,
  resolveContactPhone,
} from "@/features/landing/contact";
import type {
  LandingImage,
  LandingLink,
  LandingSection,
  NormalizedPublicLanding,
} from "@/features/public-view/public-view.types";
import {
  resolveLandingImage,
  resolveLogoUrl,
} from "@/features/public-view/public-view.normalizer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

const hiddenPublicLabels = /^(proceso|agendar|booking|cita|citas)$/i;
const hiddenPublicHrefs = /(booking|paciente|terapeuta|admin|#proceso)/i;
const sectionTone = [
  "bg-[#eef6f3] text-primary",
  "bg-[#f6edf0] text-[#87485e]",
  "bg-[#f5efe4] text-[#7a5830]",
];

function safeHref(link?: LandingLink, fallback = "#") {
  return link?.href || fallback;
}

function actionHref(link?: LandingLink, fallback = "/registro") {
  const action = `${link?.action ?? ""} ${link?.label ?? ""} ${link?.href ?? ""}`;
  if (/login|ingresar|sesion|sesión/i.test(action)) return "/login";
  if (/register|registro|signup|cuenta/i.test(action)) return "/registro";
  if (/biblioteca|blog|recurso/i.test(action)) return "/biblioteca";
  if (/contact|contacto|whatsapp|telefono|teléfono/i.test(action))
    return link?.href || fallback;
  if (/agendar|booking|cita/i.test(action)) return "/login";
  return safeHref(link, fallback);
}

function cleanNavLinks(landing: NormalizedPublicLanding) {
  const configured = landing.navbar.links.filter((item) => {
    const label = item.label?.trim();
    const href = item.href?.trim() ?? "";
    if (!label) return false;
    if (hiddenPublicLabels.test(label)) return false;
    if (hiddenPublicHrefs.test(href)) return false;
    return true;
  });

  const inferred = landing.sections
    .filter((section) => section.title || section.label)
    .map((section) => ({
      label: section.label || section.title || section.id,
      href: `#${section.id}`,
    }))
    .filter((item) => !hiddenPublicLabels.test(item.label));

  const links = configured.length > 0 ? configured : inferred;
  const hasLibrary = links.some(
    (item) =>
      /biblioteca|recursos/i.test(item.label) || item.href === "/biblioteca",
  );
  return [
    ...links.slice(0, 3),
    ...(hasLibrary ? [] : [{ label: "Biblioteca", href: "/biblioteca" }]),
  ];
}

function imageUrl(
  image: LandingImage | undefined,
  landing: NormalizedPublicLanding,
  fallback?: string,
) {
  return resolveLandingImage(image, landing.uiById, fallback);
}

function TextBlock({ value }: { value?: string | string[] }) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    if (items.length === 0) return null;
    return (
      <ul className="mt-7 grid gap-3 text-sm text-[#5f5b54] sm:grid-cols-2">
        {items.map((item) => (
          <li
            className="flex items-start gap-2 rounded-2xl border border-[#eadfd4] bg-white/78 px-4 py-3 shadow-sm"
            key={item}
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-[#625e57] md:text-xl">
      {value}
    </p>
  );
}

function PublicNavbar({
  landing,
  phone,
}: {
  landing: NormalizedPublicLanding;
  phone?: string;
}) {
  const logo = resolveLogoUrl(landing.navbar, landing.uiById);
  const links = cleanNavLinks(landing);
  const brand = landing.navbar.brand || landing.title || "Corazón Migrante";
  const formattedPhone = formatContactPhone(phone);

  return (
    <header className="sticky top-0 z-50 border-b border-[#17372f]/10 bg-[#fbf8f3]/88 backdrop-blur-2xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 font-bold"
          aria-label="Ir al inicio"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#17372f]/10 bg-white shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
            {logo ? (
              <img
                src={logo}
                alt={brand}
                className="h-full w-full object-contain p-1.5"
              />
            ) : (
              <HeartHandshake
                className="h-6 w-6 text-primary"
                aria-hidden="true"
              />
            )}
          </span>
          <span className="truncate leading-tight text-[#172b27]">
            {brand}
            {landing.navbar.tagline ? (
              <span className="block truncate text-xs font-medium text-[#6d675f]">
                {landing.navbar.tagline}
              </span>
            ) : null}
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label="Navegación pública"
        >
          {links.map((item) => (
            <Link
              className="relative text-sm font-semibold text-[#625e57] transition duration-300 hover:text-primary after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
              href={safeHref(item)}
              key={`${item.label}-${item.href}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {formattedPhone ? (
            <a
              className="hidden items-center gap-2 rounded-2xl border border-[#d9cec2] bg-white/70 px-4 py-2 text-sm font-semibold text-[#625e57] transition hover:bg-white xl:inline-flex"
              href={contactHref(phone)}
              target="_blank"
              rel="noreferrer"
            >
              <Phone className="h-4 w-4 text-primary" aria-hidden="true" />{" "}
              {formattedPhone}
            </a>
          ) : null}
          <Button asChild className="rounded-2xl" variant="ghost">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button
            asChild
            className="rounded-2xl shadow-[0_16px_40px_rgba(35,99,89,0.18)]"
          >
            <Link href={actionHref(landing.navbar.cta, "/registro")}>
              {landing.navbar.cta?.label || "Crear cuenta"}
            </Link>
          </Button>
        </div>
      </div>

      <nav
        className="container flex gap-2 overflow-x-auto pb-3 md:hidden"
        aria-label="Navegación pública móvil"
      >
        {links.map((item) => (
          <Link
            className="shrink-0 rounded-full border border-[#17372f]/10 bg-white/76 px-4 py-2 text-xs font-semibold text-[#625e57]"
            href={safeHref(item)}
            key={`${item.label}-${item.href}-mobile`}
          >
            {item.label}
          </Link>
        ))}
        <Link
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
          href="/login"
        >
          Ingresar
        </Link>
      </nav>
    </header>
  );
}

function Hero({
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
  const formattedPhone = formatContactPhone(phone);
  const contactUrl = contactHref(phone);

  return (
    <section className="relative isolate overflow-hidden bg-[#fbf8f3]">
      <div className="absolute left-[-20rem] top-[-18rem] -z-10 h-[42rem] w-[42rem] rounded-full bg-primary/14 blur-3xl" />
      <div className="absolute bottom-[-20rem] right-[-16rem] -z-10 h-[44rem] w-[44rem] rounded-full bg-[#8c4a62]/12 blur-3xl" />

      <div className="container grid min-h-[calc(100vh-5rem)] gap-12 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" aria-hidden="true" />{" "}
            {hero?.badge || hero?.eyebrow || "Acompañamiento emocional"}
          </div>

          <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black tracking-[-0.055em] text-[#172b27] md:text-7xl">
            {title}
          </h1>
          {hero?.subtitle ? (
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-[#625e57] md:text-xl">
              {hero.subtitle}
            </p>
          ) : null}
          <TextBlock value={hero?.description} />

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-[3.35rem] rounded-2xl px-7 shadow-[0_18px_45px_rgba(35,99,89,0.22)]"
              size="lg"
            >
              <Link href={actionHref(hero?.primaryCta, "/registro")}>
                {hero?.primaryCta?.label || "Crear cuenta"}{" "}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              className="h-[3.35rem] rounded-2xl border-[#cfc4b8] bg-white/78 px-7 hover:bg-white"
              size="lg"
              variant="outline"
            >
              <a
                href={contactUrl}
                target={phone ? "_blank" : undefined}
                rel={phone ? "noreferrer" : undefined}
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />{" "}
                Contactar
              </a>
            </Button>
          </div>

          {formattedPhone ? (
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#625e57]">
              <Phone className="h-4 w-4 text-primary" aria-hidden="true" />{" "}
              Atención por WhatsApp: {formattedPhone}
            </p>
          ) : null}
        </div>

        <div className="relative mx-auto w-full max-w-[38rem] lg:max-w-none">
          <div className="absolute -left-5 top-8 z-10 hidden max-w-[15rem] rounded-[1.75rem] border border-white/70 bg-white/88 p-4 shadow-[0_20px_55px_rgba(23,43,39,0.13)] backdrop-blur md:block">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4f0ec] text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#172b27]">
                  Atención segura
                </p>
                <p className="text-xs leading-5 text-[#6d675f]">
                  Ingreso protegido para pacientes
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2.75rem] border border-white/80 bg-white/60 p-3 shadow-[0_38px_100px_rgba(23,43,39,0.18)] backdrop-blur transition duration-500 hover:-translate-y-1 hover:shadow-[0_46px_120px_rgba(23,43,39,0.22)]">
            <div className="relative min-h-[32rem] overflow-hidden rounded-[2.2rem] bg-[#d8d0c4] md:min-h-[38rem]">
              {heroImage ? (
                <img
                  alt={hero?.image?.alt || title}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={heroImage}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#102f2a]/90 via-[#102f2a]/24 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7 text-white md:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/68">
                  {landing.navbar.brand || "Corazón Migrante"}
                </p>
                <h2 className="mt-3 max-w-md text-3xl font-black tracking-tight md:text-4xl">
                  {hero?.image?.footerText ||
                    "Un espacio humano para ordenar lo que sientes."}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
        <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.035em] text-[#172b27] md:text-5xl">
          {section.title}
        </h2>
      ) : null}
      {section.subtitle ? (
        <p className="mt-4 text-lg leading-8 text-[#625e57]">
          {section.subtitle}
        </p>
      ) : null}
      {section.body ? (
        <p className="mt-4 text-base leading-8 text-[#625e57]">
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
          className="group overflow-hidden border-[#e3d8cb] bg-white/86 transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(23,43,39,0.13)]"
          key={`${item.title}-${index}`}
        >
          {item.image?.src ? (
            <img
              src={item.image.src}
              alt={item.image.alt || item.title || "Imagen"}
              className="h-48 w-full object-cover"
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
              <h3 className="mt-3 text-xl font-black tracking-tight text-[#172b27]">
                {item.title}
              </h3>
            ) : null}
            {item.body || item.description ? (
              <p className="mt-3 text-sm leading-7 text-[#625e57]">
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
          <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.035em] text-[#172b27] md:text-5xl">
            {section.title}
          </h2>
        ) : null}
        {section.subtitle ? (
          <p className="mt-5 text-lg leading-8 text-[#625e57]">
            {section.subtitle}
          </p>
        ) : null}
        {section.body ? (
          <p className="mt-5 text-base leading-8 text-[#625e57]">
            {section.body}
          </p>
        ) : null}
        {section.paragraphs?.map((paragraph) => (
          <p
            className="mt-4 text-base leading-8 text-[#625e57]"
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
      <div className="rounded-[2.2rem] border border-white/80 bg-white/72 p-3 shadow-[0_28px_80px_rgba(23,43,39,0.13)]">
        {sectionImage ? (
          <img
            src={sectionImage}
            alt={section.image?.alt || section.title || "Sección"}
            className="h-[28rem] w-full rounded-[1.75rem] object-cover"
          />
        ) : (
          <div className="grid h-[28rem] place-items-center rounded-[1.75rem] bg-[#e4f0ec] text-center text-sm font-semibold text-primary">
            Corazón Migrante
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
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
        <div className="rounded-[2.4rem] border border-[#d7ccc0] bg-[#102f2a] p-8 text-white shadow-[0_30px_90px_rgba(23,43,39,0.18)] md:p-12">
          {section.title ? (
            <h2 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
              {section.title}
            </h2>
          ) : null}
          {section.body || section.subtitle ? (
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
              {section.body || section.subtitle}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section id={section.id} className="container scroll-mt-28 py-20">
      <SectionHeading section={section} />
      <CardGrid section={section} />
    </section>
  );
}

function FloatingContact({ phone }: { phone?: string }) {
  return (
    <a
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(35,99,89,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-[#1b5148]"
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

function Footer({
  landing,
  phone,
}: {
  landing: NormalizedPublicLanding;
  phone?: string;
}) {
  const brand = landing.navbar.brand || landing.title || "Corazón Migrante";
  const formattedPhone = formatContactPhone(phone);
  return (
    <footer className="border-t border-[#1a342f]/10 bg-[#102f2a] text-white">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.15fr_0.85fr_1fr]">
        <div>
          <p className="text-lg font-black">{brand}</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/64">
            {landing.footer?.note ||
              landing.seoDescription ||
              "Acompañamiento emocional con atención clara, humana y responsable."}
          </p>
        </div>
        <div>
          <p className="font-semibold">Accesos</p>
          <div className="mt-3 grid gap-2 text-sm text-white/64">
            <Link className="transition hover:text-white" href="/biblioteca">
              Biblioteca
            </Link>
            <Link className="transition hover:text-white" href="/privacidad">
              Política de privacidad
            </Link>
            <Link className="transition hover:text-white" href="/terminos">
              Términos y condiciones
            </Link>
          </div>
        </div>
        <div>
          <p className="font-semibold">Contacto</p>
          {formattedPhone ? (
            <a
              className="mt-3 inline-flex text-sm font-semibold text-white/74 transition hover:text-white"
              href={contactHref(phone)}
              target="_blank"
              rel="noreferrer"
            >
              {formattedPhone}
            </a>
          ) : (
            <p className="mt-3 text-sm leading-6 text-white/64">
              Completa tu registro para recibir orientación inicial.
            </p>
          )}
          <p className="mt-4 text-sm leading-6 text-white/64">
            La información publicada es orientativa y no reemplaza servicios de
            emergencia.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLandingPage({
  landing,
}: {
  landing: NormalizedPublicLanding;
}) {
  const phone = resolveContactPhone(landing.phone);
  const sections = landing.sections.filter(
    (section) =>
      section.title ||
      section.subtitle ||
      section.body ||
      section.image?.src ||
      (section.items && section.items.length > 0),
  );

  return (
    <div className="min-h-screen bg-[#fbf8f3] text-[#172b27]">
      <PublicNavbar landing={landing} phone={phone} />
      <main>
        <Hero landing={landing} phone={phone} />
        {sections.length > 0 ? (
          sections.map((section) => (
            <Section section={section} landing={landing} key={section.id} />
          ))
        ) : (
          <section className="container py-16">
            <div className="rounded-[2rem] border border-[#e3d8cb] bg-white/82 p-8 shadow-[0_26px_80px_rgba(23,43,39,0.10)]">
              <div className="flex items-start gap-3">
                <BookOpenText
                  className="mt-1 h-5 w-5 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-2xl font-black text-[#172b27]">
                    Contenido en preparación
                  </h2>
                  <p className="mt-2 leading-7 text-[#625e57]">
                    Estamos preparando nuevas secciones para explicar mejor los
                    servicios de Corazón Migrante.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer landing={landing} phone={phone} />
      <FloatingContact phone={phone} />
    </div>
  );
}
