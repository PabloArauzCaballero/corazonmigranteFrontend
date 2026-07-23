import { env } from "@/config/env";

// Números de relleno que a veces llegan del backend/CMS (ej. +591 700 00000).
// Se descartan para no mostrar un teléfono falso en la web.
function looksLikePlaceholder(digits: string) {
  // 4+ ceros seguidos o el mismo dígito repetido son señal de dato de prueba.
  return /0{4,}/.test(digits) || /(\d)\1{6,}/.test(digits);
}

function cleanPhone(value?: string | null) {
  const text = value?.trim();
  if (!text) return undefined;
  const hasPlus = text.startsWith("+");
  const digits = text.replace(/\D/g, "");
  if (!digits) return undefined;
  if (looksLikePlaceholder(digits)) return undefined;
  return `${hasPlus ? "+" : ""}${digits}`;
}

// Número de contacto oficial de Corazón Migrante (fallback garantizado).
const DEFAULT_CONTACT_PHONE = "+59177332178";

export function resolveContactPhone(
  ...candidates: Array<string | null | undefined>
) {
  for (const candidate of [
    ...candidates,
    env.NEXT_PUBLIC_PUBLIC_CONTACT_PHONE,
    DEFAULT_CONTACT_PHONE,
  ]) {
    const phone = cleanPhone(candidate);
    if (phone) return phone;
  }
  return DEFAULT_CONTACT_PHONE;
}

export function formatContactPhone(phone?: string | null) {
  const clean = cleanPhone(phone);
  if (!clean) return undefined;
  if (clean.startsWith("+") && clean.length > 8) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  return clean;
}

export function contactHref(phone?: string | null, message?: string) {
  const clean = cleanPhone(phone);
  if (!clean) return "/registro";
  const base = `https://wa.me/${clean.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
