/**
 * Piezas reutilizables de una página: enlaces, imágenes y tarjetas.
 *
 * Extraído de `public-view.normalizer.ts`, que superaba las 1000 líneas.
 */
import { buildFileDownloadUrl } from "@/shared/api/files";
import { asRecord, asString, firstString, normalizeAssetUrl, parseJsonMaybe, toNumber } from "@/features/public-view/normalizer/primitives";
import { resolveUiAsset } from "@/features/public-view/normalizer/ui-assets";
import type {
  LandingCard,
  LandingImage,
  LandingLink,
  UiElementAsset,
} from "@/features/public-view/public-view.types";

export function readContentContainer(value: unknown) {
  const record = asRecord(value);
  return asRecord(
    record.content ??
      record.json ??
      record.contentJson ??
      record.content_json ??
      record.value ??
      record.valor ??
      record.payload ??
      record.config ??
      value,
  );
}

function normalizeHref(value: unknown): string | undefined {
  const href = asString(value);
  if (!href) return undefined;
  return href;
}

export function linkFrom(
  value: unknown,
  fallback?: LandingLink,
): LandingLink | undefined {
  const record = asRecord(value);
  const label = asString(
    record.label ??
      record.text ??
      record.titulo ??
      record.title ??
      record.nombre ??
      fallback?.label,
  );
  if (!label) return fallback;
  return {
    label,
    href: normalizeHref(
      record.href ?? record.url ?? record.link ?? record.ruta ?? fallback?.href,
    ),
    action: asString(record.action ?? record.accion ?? fallback?.action),
  };
}

function imageSourceFromRecord(
  record: Record<string, unknown>,
  asset?: UiElementAsset,
) {
  const metadata = asRecord(record.metadata);
  return firstString(
    record.src,
    record.url,
    record.link,
    record.href,
    record.path,
    record.ruta,
    record.objectKey,
    record.object_key,
    record.storagePath,
    record.storage_path,
    record.publicUrl,
    record.public_url,
    record.fileUrl,
    record.file_url,
    record.imageUrl,
    record.image_url,
    record.fallback_src,
    record.fallbackSrc,
    metadata.src,
    metadata.url,
    metadata.publicUrl,
    metadata.public_url,
    metadata.fileUrl,
    metadata.file_url,
    asset?.url,
    asset?.value,
  );
}

export function imageFrom(
  value: unknown,
  uiById: Record<number, UiElementAsset>,
): LandingImage | undefined {
  const parsed = parseJsonMaybe(value);

  if (typeof parsed === "string") {
    const src = normalizeAssetUrl(parsed);
    return src ? { src } : undefined;
  }

  const record = asRecord(parsed);
  const idUi =
    record.id_ui ??
    record.idUi ??
    record.uiId ??
    record.ui_id ??
    record.id_elemento ??
    record.element_id;
  const asset = resolveUiAsset(uiById, idUi);
  const src = normalizeAssetUrl(imageSourceFromRecord(record, asset));
  const alt = asString(
    record.alt ??
      record.descripcion ??
      record.description ??
      record.titulo ??
      asset?.alt,
  );
  const footerText = asString(
    record.footerText ??
      record.footer_text ??
      record.caption ??
      record.pie ??
      record.img_footer_text,
  );

  if (!src && !alt && !idUi && !footerText) return undefined;
  return {
    src,
    alt,
    idUi: asString(idUi) ?? toNumber(idUi) ?? null,
    footerText,
  };
}

export function withFileIdFallback(
  image: LandingImage | undefined,
  fileId: unknown,
): LandingImage | undefined {
  if (image?.src) return image;
  const url = buildFileDownloadUrl(asString(fileId));
  if (!url) return image;
  return { ...(image ?? {}), src: url };
}

export function cardFrom(
  value: unknown,
  uiById: Record<number, UiElementAsset>,
): LandingCard | null {
  const record = readContentContainer(value);
  
  // Helper to find value starting with prefix (for titulo_*, parrafo_*, etc)
  const findWithPrefix = (record: Record<string, unknown>, ...prefixes: string[]) => {
    for (const key of Object.keys(record)) {
      for (const prefix of prefixes) {
        if (key.startsWith(prefix)) {
          const value = record[key];
          if (typeof value === "string" && value.trim().length > 0) {
            return value;
          }
        }
      }
    }
    return undefined;
  };
  
  const title = firstString(
    record.title,
    record.titulo,
    record.titulo_principal,
    record.name,
    record.nombre,
    record.heading,
    findWithPrefix(record, "titulo_"),
  );
  const body = firstString(
    record.body,
    record.parrafo,
    record.text,
    record.texto,
    record.descripcion,
    record.description,
    record.resumen,
    findWithPrefix(record, "parrafo_"),
  );
  const label = firstString(
    record.label,
    record.badge,
    record.etiqueta,
    record.kicker,
  );
  const image = imageFrom(
    record.image ?? record.img ?? record.media ?? record.imagen ?? record.foto,
    uiById,
  );
  if (!title && !body && !label && !image?.src) return null;
  return {
    label,
    title,
    body,
    description: firstString(record.description, record.descripcion),
    image,
  };
}

export function numberedContainers(
  record: Record<string, unknown>,
  prefix: string,
  uiById: Record<number, UiElementAsset>,
) {
  const entries = Object.entries(record)
    .filter(([key]) => key.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, value]) => cardFrom(value, uiById))
    .filter(Boolean) as LandingCard[];

  return entries;
}
