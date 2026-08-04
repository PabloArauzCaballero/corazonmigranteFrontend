/**
 * Bloques de página con forma propia: pie, barra de navegación y hero.
 *
 * Extraído de `public-view.normalizer.ts`, que superaba las 1000 líneas.
 */
import { asArray, asRecord, asString, asStringArray, firstString, parseJsonMaybe } from "@/features/public-view/normalizer/primitives";
import { imageFrom, linkFrom, readContentContainer, withFileIdFallback } from "@/features/public-view/normalizer/parts";
import type {
  LandingHero,
  LandingLink,
  LandingNavbar,
  NormalizedPublicLanding,
  UiElementAsset,
} from "@/features/public-view/public-view.types";

export function normalizeFooter(raw: unknown): NormalizedPublicLanding["footer"] {
  const record = readContentContainer(raw);
  const note = firstString(
    record.note,
    record.text,
    record.texto,
    record.body,
    record.descripcion,
    record.description,
  );
  const columns = asArray(record.columns ?? record.items)
    .map((item) => {
      const column = asRecord(item);
      const title = firstString(column.title, column.titulo, column.label);
      if (!title) return null;
      const links = asArray(column.links)
        .map((link) => linkFrom(link))
        .filter(Boolean) as LandingLink[];
      const body = firstString(
        column.body,
        column.text,
        column.description,
        column.descripcion,
      );
      return { title, links: links.length > 0 ? links : undefined, body };
    })
    .filter(Boolean) as Array<{
    title: string;
    links?: LandingLink[];
    body?: string;
  }>;
  if (!note && columns.length === 0) return undefined;
  return { note, columns: columns.length > 0 ? columns : undefined };
}

export function textFromIconText(value: unknown): string | undefined {
  const direct = asString(value);
  if (direct) return direct;
  const record = asRecord(value);
  return firstString(record.text, record.label, record.title, record.titulo);
}

export function normalizeNavbar(
  raw: unknown,
  _uiById: Record<number, UiElementAsset>,
  pageTitle?: string,
): LandingNavbar {
  const record = readContentContainer(raw);
  const brandRecord = asRecord(record.brand);
  const logo = asRecord(record.logo);
  const links = asArray(record.links ?? record.items ?? record.menu)
    .map((item) => linkFrom(item))
    .filter(Boolean) as LandingLink[];

  return {
    brand:
      firstString(
        brandRecord.label,
        brandRecord.title,
        brandRecord.name,
        record.brand,
        record.title,
        record.titulo,
        record.nombre,
        pageTitle,
      ) ?? "Corazón Migrante",
    tagline: firstString(record.tagline, record.subtitle, record.subtitulo),
    logoIdUi:
      firstString(
        record.logoIdUi,
        record.logo_id_ui,
        logo.id_ui,
        logo.idUi,
        brandRecord.icon,
      ) ?? null,
    links,
    cta: linkFrom(
      record.cta_sign_up ??
        record.ctaSignUp ??
        record.cta ??
        record.primaryCta ??
        record.primary_cta,
    ),
    adminCta: linkFrom(
      record.cta_login ??
        record.ctaLogin ??
        record.adminCta ??
        record.admin_cta,
    ),
  };
}

export function normalizeHero(
  raw: unknown,
  uiById: Record<number, UiElementAsset>,
  pageTitle?: string,
  fileId?: unknown,
): LandingHero | undefined {
  const record = readContentContainer(raw);
  const title = firstString(
    record.title,
    record.titulo,
    record.titulo_principal,
    record.title_line_1,
    record.heading,
    pageTitle,
  );
  const subtitle = firstString(
    record.subtitle,
    record.subtitulo,
    record.subtitulo_principal,
    record.title_line_2,
    record.parrafo_2_0,
    record.text,
  );
  const description =
    record.lead ??
    record.descriptionList ??
    record.description_list ??
    record.descripcion_lista ??
    record.description ??
    record.descripcion ??
    record.bullets ??
    record.lista ??
    record.puntos;
  const image = withFileIdFallback(
    imageFrom(
      record.image ?? record.img ?? record.media ?? record.imagen ?? record.foto,
      uiById,
    ),
    fileId,
  );
  if (!title && !subtitle && !image?.src) return undefined;
  return {
    badge: textFromIconText(record.badge ?? record.kicker ?? record.etiqueta),
    eyebrow: firstString(record.eyebrow, record.preTitulo, record.pretitulo),
    title,
    subtitle,
    description: Array.isArray(parseJsonMaybe(description))
      ? asStringArray(description)
      : asString(description),
    primaryCta: linkFrom(
      record.primaryCta ?? record.primary_cta ?? record.cta_primario,
    ),
    secondaryCta: linkFrom(
      record.secondaryCta ?? record.secondary_cta ?? record.cta_secundario,
    ),
    image,
  };
}

export function phoneFrom(...sources: unknown[]) {
  for (const source of sources) {
    const record = asRecord(source);
    const phone = firstString(
      record.telefono,
      record.phone,
      record.whatsapp,
      record.numero_contacto,
      record.contactPhone,
      record.contact_phone,
      record.celular,
    );
    if (phone) return phone;
  }
  return undefined;
}
