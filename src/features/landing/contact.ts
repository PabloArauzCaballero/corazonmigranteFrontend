import { env } from "@/config/env";

function cleanPhone(value?: string | null) {
  const text = value?.trim();
  if (!text) return undefined;
  const hasPlus = text.startsWith("+");
  const digits = text.replace(/\D/g, "");
  if (!digits) return undefined;
  return `${hasPlus ? "+" : ""}${digits}`;
}

export function resolveContactPhone(
  ...candidates: Array<string | null | undefined>
) {
  for (const candidate of [
    ...candidates,
    env.NEXT_PUBLIC_PUBLIC_CONTACT_PHONE,
  ]) {
    const phone = cleanPhone(candidate);
    if (phone) return phone;
  }
  return undefined;
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
