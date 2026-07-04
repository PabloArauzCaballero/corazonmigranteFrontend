import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { resolveLandingImage } from "@/features/public-view/public-view.normalizer";
import type {
  LandingV2Content,
  LandingV2Image,
  LandingV2Link,
} from "@/features/public-view/landing-v2.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object") return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function unwrapJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text || (!text.startsWith("{") && !text.startsWith("["))) return value;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return value;
  }
}

function candidateChildren(record: Record<string, unknown>) {
  return [
    record.data,
    record.publicView,
    record.public_view,
    record.view,
    record.content,
    record.json,
    record.contentJson,
    record.content_json,
    record.payload,
    record.config,
    record.value,
    record.valor,
    record.dataJson,
    record.data_json,
  ];
}

function looksLikeLandingV2(record: Record<string, unknown>) {
  const meta = isRecord(record.meta) ? record.meta : {};
  return (
    asString(meta.schema) === "landing_v2" ||
    Boolean(record.navbar && record.hero && record.sections && record.footer)
  );
}

export function extractLandingV2(raw: unknown): LandingV2Content | null {
  const queue: unknown[] = [raw];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = unwrapJson(queue.shift());
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (isRecord(current)) {
      if (looksLikeLandingV2(current)) return current as LandingV2Content;
      for (const child of candidateChildren(current)) {
        if (child !== undefined) queue.push(child);
      }
    }
  }

  return null;
}

export function textFromValue(value: unknown): string | undefined {
  if (!isRecord(value)) return asString(value);
  return asString(value.text ?? value.label ?? value.title ?? value.titulo);
}

export function resolveV2Image(
  image: LandingV2Image | undefined,
  landing: NormalizedPublicLanding,
  fallback?: string,
) {
  if (!image) return resolveLandingImage(undefined, landing.uiById, fallback);
  return resolveLandingImage(
    {
      src: image.src ?? image.fallback_src ?? image.fallbackSrc,
      alt: image.alt,
      idUi: image.id_ui ?? image.idUi ?? null,
    },
    landing.uiById,
    fallback,
  );
}

export function linkKey(link: LandingV2Link | undefined, fallback: string) {
  return `${link?.label ?? fallback}-${link?.href ?? "#"}-${link?.action ?? ""}`;
}

export function humanizeTitle(value?: string) {
  if (!value) return undefined;
  const directMap: Record<string, string> = {
    intense_nostalgia: "Nostalgia intensa",
  };
  const mapped = directMap[value.trim()];
  if (mapped) return mapped;
  const clean = value.replace(/[_-]+/g, " ").trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : undefined;
}
