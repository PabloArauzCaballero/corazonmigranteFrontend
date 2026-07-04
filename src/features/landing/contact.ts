export function normalizeContactPhone(phone?: string) {
  const value = phone?.trim();
  return value ? value : undefined;
}

export function phoneDigits(phone?: string) {
  const normalized = normalizeContactPhone(phone);
  if (!normalized) return undefined;
  const digits = normalized.replace(/[^\d]/g, "");
  return digits.length >= 7 ? digits : undefined;
}

export function whatsappHref(phone?: string) {
  const digits = phoneDigits(phone);
  return digits ? `https://wa.me/${digits}` : undefined;
}

export function telHref(phone?: string) {
  const normalized = normalizeContactPhone(phone);
  return normalized ? `tel:${normalized.replace(/[^\d+]/g, "")}` : undefined;
}

export function contactHref(phone?: string) {
  return whatsappHref(phone) ?? telHref(phone);
}
