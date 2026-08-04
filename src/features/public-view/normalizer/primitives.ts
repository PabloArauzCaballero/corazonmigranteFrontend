/**
 * Coerción de valores desconocidos y resolución de URLs de asset.
 * Es la base del normalizador: no depende de ningún otro módulo.
 *
 * Extraído de `public-view.normalizer.ts`, que superaba las 1000 líneas.
 */
import { buildPublicAssetUrl, fileServer } from "@/config/file-server";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function unwrapData(value: unknown): unknown {
  if (isRecord(value) && "data" in value) return value.data;
  return value;
}

export function parseJsonMaybe(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text) return value;
  if (!text.startsWith("{") && !text.startsWith("[")) return value;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return value;
  }
}

export function asString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object") return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

export function asStringArray(value: unknown): string[] {
  const parsed = parseJsonMaybe(value);
  if (Array.isArray(parsed))
    return parsed.map(asString).filter(Boolean) as string[];
  const single = asString(parsed);
  return single ? [single] : [];
}

export function asRecord(value: unknown): Record<string, unknown> {
  const parsed = parseJsonMaybe(value);
  return isRecord(parsed) ? parsed : {};
}

export function asArray(value: unknown): unknown[] {
  const parsed = parseJsonMaybe(value);
  return Array.isArray(parsed) ? parsed : [];
}

export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }
  return undefined;
}

function isLikelyAssetPath(value: string) {
  return (
    /^(global_assets|landing_page|admin_portal|media|text_content)\//i.test(
      value,
    ) || /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(value)
  );
}

function encodeAssetUrl(value: string) {
  try {
    return encodeURI(value).replace(/%25/g, "%");
  } catch {
    return value;
  }
}

export function normalizeAssetUrl(value?: string) {
  if (!value) return undefined;
  const text = value.trim();
  if (!text) return undefined;

  const base = fileServer.publicAssetsBaseUrl;
  if (base && text.replace(/\/$/, "") === base.replace(/\/$/, ""))
    return undefined;

  if (/^https?:\/\//i.test(text)) return encodeAssetUrl(text);
  if (text.startsWith("//")) return `https:${encodeAssetUrl(text)}`;
  if (text.startsWith("/")) {
    const built = buildPublicAssetUrl(text);
    return built ? encodeAssetUrl(built) : encodeAssetUrl(text);
  }
  if (isLikelyAssetPath(text))
    return buildPublicAssetUrl(text) ?? encodeAssetUrl(text);

  return text;
}
