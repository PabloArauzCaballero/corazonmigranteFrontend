"use client";

/**
 * Piezas base de la landing v2: iconos, texto enriquecido, listas e imágenes,
 * y las reglas de qué enlaces son públicos.
 *
 * Extraído de `landing-v2-page.tsx`, que superaba las 1000 líneas.
 */
import { contactHref } from "@/features/landing/contact";
import { resolveV2Image } from "@/features/public-view/landing-v2.mapper";
import type { LandingV2Content, LandingV2Image, LandingV2Link } from "@/features/public-view/landing-v2.types";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { CalendarClock, Heart, HeartHandshake, Languages, MapPinned, MessageCircle, Phone, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

type IconName = string | number | undefined;

const hiddenPublicLabels = /^(proceso|agendar|booking|cita|citas)$/i;
const hiddenPublicHrefs = /(booking|paciente|terapeuta|admin|#proceso)/i;

export function iconFor(name: IconName, className = "h-5 w-5") {
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

export function richParts(text: string) {
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

export function TextList({
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
          className="text-base leading-8 text-ink-muted"
          key={item}
          text={item}
        />
      ))}
    </div>
  );
}

export function ImageBlock({
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
      onError={(event) => { event.currentTarget.style.display = "none"; }}
    />
  );
}

export function actionHref(link?: LandingV2Link, phone?: string, fallback = "#contacto") {
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

export function externalTarget(href: string) {
  return /^https?:\/\//i.test(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

function normalizeFooterHref(href?: string) {
  const value = href?.trim();
  if (!value) return "#";
  if (/^#privacidad$/i.test(value)) return "/privacidad";
  if (/^#terminos$/i.test(value)) return "/terminos";
  return value;
}

export function publicLinks(content: LandingV2Content) {
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
  const hasCourses = clean.some((item) => /cursos/i.test(item.label ?? "") || item.href === "/cursos");
  const library = hasLibrary ? [] : [{ label: "Biblioteca", href: "/biblioteca" }];
  const courses = hasCourses ? [] : [{ label: "Cursos", href: "/cursos" }];
  return [...clean, ...library, ...courses];
}

export function footerLegalLinks(content: LandingV2Content) {
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
