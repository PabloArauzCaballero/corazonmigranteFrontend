/**
 * Utilidades de la landing genérica: enlaces seguros, filtrado de navegación
 * pública, resolución de imágenes y bloques de texto.
 *
 * Extraído de `public-landing-page.tsx`, que superaba las 700 líneas.
 */
import { resolveLandingImage } from "@/features/public-view/public-view.normalizer";
import type { LandingImage, LandingLink, NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { CheckCircle2 } from "lucide-react";

const hiddenPublicLabels = /^(proceso|agendar|booking|cita|citas)$/i;
const hiddenPublicHrefs = /(booking|paciente|terapeuta|admin|#proceso)/i;
export const sectionTone = [
  "bg-surface-accent text-primary",
  "bg-surface-accent text-brand-plum",
  "bg-background text-brand-gold",
];

export function safeHref(link?: LandingLink, fallback = "#") {
  return link?.href || fallback;
}

export function actionHref(link?: LandingLink, fallback = "/registro") {
  const action = `${link?.action ?? ""} ${link?.label ?? ""} ${link?.href ?? ""}`;
  if (/login|ingresar|sesion|sesión/i.test(action)) return "/login";
  if (/register|registro|signup|cuenta/i.test(action)) return "/registro";
  if (/biblioteca|blog|recurso/i.test(action)) return "/biblioteca";
  if (/contact|contacto|whatsapp|telefono|teléfono/i.test(action))
    return link?.href || fallback;
  if (/agendar|booking|cita/i.test(action)) return "/login";
  return safeHref(link, fallback);
}

export function cleanNavLinks(landing: NormalizedPublicLanding) {
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
  const hasCourses = links.some((item) => /cursos/i.test(item.label));
  return [
    ...links.slice(0, 3),
    ...(hasLibrary ? [] : [{ label: "Biblioteca", href: "/biblioteca" }]),
    ...(hasCourses ? [] : [{ label: "Cursos", href: "/cursos" }]),
  ];
}

export function imageUrl(
  image: LandingImage | undefined,
  landing: NormalizedPublicLanding,
  fallback?: string,
) {
  return resolveLandingImage(image, landing.uiById, fallback);
}

export function TextBlock({ value }: { value?: string | string[] }) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    if (items.length === 0) return null;
    return (
      <ul className="mt-7 grid gap-3 text-sm text-ink-soft sm:grid-cols-2">
        {items.map((item) => (
          <li
            className="flex items-start gap-2 rounded-2xl border border-line bg-card/78 px-4 py-3 shadow-sm"
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
    <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-ink-muted md:text-xl">
      {value}
    </p>
  );
}
