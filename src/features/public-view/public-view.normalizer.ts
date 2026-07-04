import { fileServer } from "@/config/file-server";
import type { LandingCard, LandingHero, LandingImage, LandingLink, LandingNavbar, LandingSection, NormalizedPublicLanding, UiElementAsset } from "@/features/public-view/public-view.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapData(value: unknown): unknown {
  if (isRecord(value) && "data" in value) return value.data;
  return value;
}

function parseJsonMaybe(value: unknown): unknown {
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

function asString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function asStringArray(value: unknown): string[] {
  const parsed = parseJsonMaybe(value);
  if (Array.isArray(parsed)) return parsed.map(asString).filter(Boolean) as string[];
  const single = asString(parsed);
  return single ? [single] : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  const parsed = parseJsonMaybe(value);
  return isRecord(parsed) ? parsed : {};
}

function asArray(value: unknown): unknown[] {
  const parsed = parseJsonMaybe(value);
  return Array.isArray(parsed) ? parsed : [];
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeHref(value: unknown): string | undefined {
  const href = asString(value);
  if (!href) return undefined;
  return href;
}

function linkFrom(value: unknown, fallback?: LandingLink): LandingLink | undefined {
  const record = asRecord(value);
  const label = asString(record.label ?? record.text ?? record.titulo ?? record.title ?? fallback?.label);
  if (!label) return fallback;
  return {
    label,
    href: normalizeHref(record.href ?? record.url ?? record.link ?? fallback?.href),
    action: asString(record.action ?? record.accion ?? fallback?.action)
  };
}

function imageFrom(value: unknown, uiById: Record<number, UiElementAsset>): LandingImage | undefined {
  const record = asRecord(value);
  const idUi = record.id_ui ?? record.idUi ?? record.uiId ?? record.ui_id;
  const asset = resolveUiAsset(uiById, idUi);
  const src = asString(record.src ?? record.url ?? record.link ?? record.imageUrl ?? record.fallback_src ?? record.fallbackSrc ?? asset?.url);
  const alt = asString(record.alt ?? record.descripcion ?? record.description ?? asset?.alt);
  const footerText = asString(record.footerText ?? record.footer_text ?? record.caption ?? record.img_footer_text);
  if (!src && !alt && !idUi && !footerText) return undefined;
  return { src, alt, idUi: asString(idUi) ?? toNumber(idUi) ?? null, footerText };
}

function cardFrom(value: unknown, uiById: Record<number, UiElementAsset>): LandingCard | null {
  const record = asRecord(value);
  const title = asString(record.title ?? record.titulo ?? record.name ?? record.nombre);
  const body = asString(record.body ?? record.parrafo ?? record.text ?? record.descripcion ?? record.description);
  const label = asString(record.label ?? record.badge ?? record.etiqueta);
  const image = imageFrom(record.image ?? record.img ?? record.media, uiById);
  if (!title && !body && !label && !image?.src) return null;
  return { label, title, body, description: asString(record.description ?? record.descripcion), image };
}

function sectionFrom(code: string, value: unknown, uiById: Record<number, UiElementAsset>, index = 0): LandingSection | null {
  const record = asRecord(value);
  const title = asString(record.title ?? record.titulo ?? record.titulo_principal ?? record.name ?? record.nombre);
  const subtitle = asString(record.subtitle ?? record.subtitulo ?? record.subtitulo_principal);
  const body = asString(record.body ?? record.parrafo ?? record.parrafo_principal ?? record.description ?? record.descripcion);
  const paragraphs = asStringArray(record.paragraphs ?? record.parrafos ?? record.description);
  const items = asArray(record.items ?? record.cards ?? record.tarjetas ?? record.specialists ?? record.psicologos)
    .map((item) => cardFrom(item, uiById))
    .filter(Boolean) as LandingCard[];
  const image = imageFrom(record.image ?? record.img ?? record.media, uiById);
  const primaryCta = linkFrom(record.primaryCta ?? record.primary_cta ?? record.cta);
  const secondaryCta = linkFrom(record.secondaryCta ?? record.secondary_cta);
  const layout = asString(record.layout) as LandingSection["layout"] | undefined;

  if (!title && !subtitle && !body && paragraphs.length === 0 && items.length === 0 && !image?.src && !primaryCta) return null;

  return {
    id: asString(record.id) ?? code.replace(/_/g, "-") ?? `section-${index + 1}`,
    code,
    label: asString(record.label ?? record.etiqueta),
    badge: asString(record.badge ?? record.kicker),
    title,
    subtitle,
    body,
    paragraphs,
    image,
    items,
    primaryCta,
    secondaryCta,
    layout
  };
}

function normalizeUiById(raw: unknown): Record<number, UiElementAsset> {
  const out: Record<number, UiElementAsset> = {};
  const parsed = parseJsonMaybe(raw);
  const entries = Array.isArray(parsed)
    ? parsed.map((value, index) => [String((value as { id?: unknown; id_elemento?: unknown })?.id ?? (value as { id_elemento?: unknown })?.id_elemento ?? index), value] as [string, unknown])
    : isRecord(parsed) ? Object.entries(parsed) : [];

  for (const [key, value] of entries) {
    const row = asRecord(value);
    const metadata = asRecord(row.metadata);
    const id = toNumber(key) ?? toNumber(row.id_elemento ?? row.id ?? row.uiId ?? row.ui_id ?? row.elementId ?? row.element_id);
    if (!id) continue;
    const url = asString(row.link ?? row.url ?? row.publicUrl ?? row.public_url ?? row.fileUrl ?? row.file_url ?? metadata.url ?? metadata.publicUrl);
    const alt = asString(row.alt ?? metadata.alt);
    out[id] = {
      id,
      type: asString(row.tipo ?? row.type) ?? "",
      value: asString(row.valor ?? row.value),
      url,
      alt,
      metadata
    };
  }

  return out;
}


function phoneFrom(...values: unknown[]) {
  for (const value of values) {
    const record = asRecord(value);
    const phone = asString(value) ?? asString(record.phone ?? record.telefono ?? record.whatsapp ?? record.whatsApp ?? record.contactPhone ?? record.contact_phone ?? record.numero_contacto);
    if (phone) return phone;
  }
  return undefined;
}

function resolveUiAsset(uiById: Record<number, UiElementAsset>, idUi: unknown) {
  const id = toNumber(idUi);
  if (!id) return undefined;
  return uiById[id];
}

function normalizeFooter(raw: unknown): NormalizedPublicLanding["footer"] {
  const record = asRecord(raw);
  const note = asString(record.note ?? record.text ?? record.body ?? record.descripcion ?? record.description);
  const columns = asArray(record.columns ?? record.items).map((item) => {
    const column = asRecord(item);
    const title = asString(column.title ?? column.titulo ?? column.label);
    if (!title) return null;
    const links = asArray(column.links).map((link) => linkFrom(link)).filter(Boolean) as LandingLink[];
    const body = asString(column.body ?? column.text ?? column.description ?? column.descripcion);
    return { title, links: links.length > 0 ? links : undefined, body };
  }).filter(Boolean) as Array<{ title: string; links?: LandingLink[]; body?: string }>;
  if (!note && columns.length === 0) return undefined;
  return { note, columns: columns.length > 0 ? columns : undefined };
}

function normalizeNavbar(raw: unknown, _uiById: Record<number, UiElementAsset>, pageTitle?: string): LandingNavbar {
  const record = asRecord(raw);
  const logo = asRecord(record.logo);
  const links = asArray(record.links ?? record.items)
    .map((item) => linkFrom(item))
    .filter(Boolean) as LandingLink[];

  return {
    brand: asString(record.brand ?? record.title ?? pageTitle) ?? "Corazón Migrante",
    tagline: asString(record.tagline ?? record.subtitle),
    logoIdUi: asString(record.logoIdUi ?? record.logo_id_ui ?? logo.id_ui ?? logo.idUi) ?? null,
    links,
    cta: linkFrom(record.cta ?? record.primaryCta),
    adminCta: linkFrom(record.adminCta ?? record.admin_cta)
  };
}

function normalizeHero(raw: unknown, uiById: Record<number, UiElementAsset>, pageTitle?: string): LandingHero | undefined {
  const record = asRecord(raw);
  const title = asString(record.title ?? record.titulo ?? record.titulo_principal ?? pageTitle);
  const subtitle = asString(record.subtitle ?? record.subtitulo ?? record.parrafo_2_0 ?? record.description ?? record.descripcion);
  const description = record.descriptionList ?? record.description ?? record.descripcion ?? record.bullets;
  const image = imageFrom(record.image ?? record.img ?? record.media, uiById);
  if (!title && !subtitle && !image?.src) return undefined;
  return {
    badge: asString(record.badge ?? record.kicker ?? record.etiqueta),
    eyebrow: asString(record.eyebrow ?? record.preTitulo),
    title,
    subtitle,
    description: Array.isArray(description) ? asStringArray(description) : asString(description),
    primaryCta: linkFrom(record.primaryCta ?? record.primary_cta),
    secondaryCta: linkFrom(record.secondaryCta ?? record.secondary_cta),
    image
  };
}

function normalizeOldPageJson(raw: Record<string, unknown>, uiById: Record<number, UiElementAsset>): NormalizedPublicLanding {
  const p3 = asRecord(raw.pagina_3);
  const p4 = asRecord(raw.pagina_4);

  const emotionsItems = ["1", "2", "3", "4"]
    .map((n) => {
      const c = asRecord(p3[`contenedor_3_${n}`]);
      return cardFrom({ title: c[`titulo_3_${n}`], body: c[`parrafo_3_${n}`] }, uiById);
    })
    .filter(Boolean) as LandingCard[];

  const hero = normalizeHero(
    {
      title: asRecord(raw.pagina_1).titulo_principal,
      subtitle: asRecord(raw.pagina_2).parrafo_2_0,
      image: asRecord(raw.pagina_1).img
    },
    uiById
  );

  const sections: LandingSection[] = [];
  const mapSection = sectionFrom(
    "mapa",
    {
      title: p4.titulo_principal,
      subtitle: p4.subtitulo_principal,
      body: p4.parrafo_principal,
      image: p4.img,
      layout: "split"
    },
    uiById
  );
  if (mapSection) sections.push(mapSection);

  if (emotionsItems.length > 0) {
    sections.push({ id: "emociones", code: "emociones", title: asString(p3.titulo_principal), items: emotionsItems, layout: "cards" });
  }

  return {
    source: "legacy-json",
    navbar: normalizeNavbar(raw.navbar, uiById, asString(asRecord(raw.pagina_1).titulo_principal)),
    hero,
    sections,
    footer: normalizeFooter(raw.footer),
    phone: phoneFrom(raw.telefono, raw.phone, raw.whatsapp, raw.contacto, raw.contact),
    uiById,
    raw
  };
}

function normalizeLegacyContent(content: Record<string, unknown>, uiById: Record<number, UiElementAsset>, raw: unknown): NormalizedPublicLanding {
  const sectionsRecord = asRecord(content.sections);
  const sections: LandingSection[] = [];

  const presentation = sectionFrom("presentation_section", content.presentation_section, uiById);
  if (presentation) sections.push({ ...presentation, layout: presentation.layout ?? "split" });

  for (const [key, value] of Object.entries(sectionsRecord)) {
    const section = sectionFrom(key, value, uiById);
    if (section) sections.push(section);
  }

  const pageTitle = asString(asRecord(content.hero).title ?? content.title);
  return {
    source: "legacy-bundle",
    title: asString(content.title) ?? pageTitle,
    seoDescription: asString(asRecord(content.seo).description),
    navbar: normalizeNavbar(content.navbar, uiById, pageTitle),
    hero: normalizeHero(content.hero, uiById, pageTitle),
    sections,
    footer: normalizeFooter(content.footer),
    phone: phoneFrom(content.telefono, content.phone, content.whatsapp, content.contacto, content.contact, content.navbar, content.footer),
    uiById,
    raw
  };
}

function normalizePublicView(view: Record<string, unknown>, raw: unknown): NormalizedPublicLanding {
  const content = asRecord(view.content ?? view.json ?? view.config ?? view.payload ?? view.dataJson ?? view.data_json);
  const uiById = normalizeUiById(view.uiById ?? view.ui_by_id ?? view.assets ?? view.elementAssets ?? view.element_assets);

  if (Object.keys(content).length > 0) {
    const normalized = normalizeLegacyContent(content, uiById, raw);
    return {
      ...normalized,
      source: "public-view",
      pageId: asString(view.id ?? view.id_vista ?? view.id_vista_publica),
      slug: asString(view.slug ?? view.code ?? view.codigo ?? view.cod_pagina),
      title: normalized.title ?? asString(view.title ?? view.titulo ?? view.name ?? view.nombre),
      raw
    };
  }

  // Algunos endpoints /public-views/:id pueden devolver directamente la misma forma que una página CMS.
  const normalized = normalizeCmsPage(view, raw);
  return {
    ...normalized,
    source: "public-view",
    pageId: normalized.pageId ?? asString(view.id ?? view.id_vista ?? view.id_vista_publica),
    slug: normalized.slug ?? asString(view.slug ?? view.code ?? view.codigo ?? view.cod_pagina),
    title: normalized.title ?? asString(view.title ?? view.titulo ?? view.name ?? view.nombre),
    raw
  };
}

function normalizeCmsPage(page: Record<string, unknown>, raw: unknown): NormalizedPublicLanding {
  const elements = asArray(page.elements);
  const elementByCode = new Map<string, Record<string, unknown>>();
  for (const item of elements) {
    const record = asRecord(item);
    const code = asString(record.code ?? record.codigo ?? record.cod_elemento ?? record.elementCode ?? record.element_code);
    if (!code) continue;
    elementByCode.set(code, record);
  }

  const uiById = normalizeUiById(page.uiById ?? page.ui_by_id);
  const contentOf = (code: string) => {
    const element = elementByCode.get(code);
    return asRecord(element?.content ?? element?.json ?? element?.contentJson ?? element?.content_json ?? element?.value ?? element?.valor ?? element?.payload ?? element?.config);
  };
  const pageTitle = asString(page.title) ?? "Corazón Migrante";
  const seo = asRecord(page.seoMetadata ?? page.seo_metadata);

  const hero = normalizeHero(contentOf("hero"), uiById, pageTitle);
  const navbar = normalizeNavbar(contentOf("navbar"), uiById, pageTitle);
  const footerContent = normalizeFooter(contentOf("footer"));

  const sections: LandingSection[] = [];

  for (const record of elements.map(asRecord)) {
    const code = asString(record.code ?? record.codigo ?? record.cod_elemento ?? record.elementCode ?? record.element_code);
    if (!code || ["navbar", "hero", "footer"].includes(code)) continue;
    const section = sectionFrom(code, record.content ?? record.json ?? record.contentJson ?? record.content_json ?? record.value ?? record.valor ?? record.payload ?? record.config, uiById, sections.length);
    if (section) sections.push(section);
  }

  return {
    source: "cms",
    pageId: asString(page.id),
    slug: asString(page.slug),
    title: pageTitle,
    seoDescription: asString(seo.description),
    navbar,
    hero,
    sections,
    footer: footerContent,
    phone: phoneFrom(page.phone, page.telefono, page.whatsapp, contentOf("navbar"), contentOf("footer"), contentOf("contacto"), contentOf("contact")),
    uiById,
    raw
  };
}

export function normalizePublicLandingResponse(payload: unknown): NormalizedPublicLanding {
  const raw = unwrapData(payload);
  const record = asRecord(raw);

  if (record.publicView || record.public_view) {
    return normalizePublicView(asRecord(record.publicView ?? record.public_view), payload);
  }

  if (record.id_vista || record.id_vista_publica || record.viewId || record.view_id || record.publicViewType || record.public_view_type) {
    return normalizePublicView(record, payload);
  }

  if (isRecord(record.content)) {
    const uiById = normalizeUiById(record.uiById ?? record.ui_by_id ?? record.data);
    return normalizeLegacyContent(record.content, uiById, payload);
  }

  if (isRecord(record.data) && isRecord(record.data.content)) {
    const data = asRecord(record.data);
    const uiById = normalizeUiById(data.uiById ?? data.ui_by_id);
    return normalizeLegacyContent(asRecord(data.content), uiById, payload);
  }

  if (Array.isArray(record.elements) || record.slug || record.seoMetadata || record.seo_metadata) {
    return normalizeCmsPage(record, payload);
  }

  if (record.navbar || record.hero || record.sections || record.footer || record.presentation_section) {
    return normalizeLegacyContent(record, normalizeUiById(record.uiById ?? record.ui_by_id), payload);
  }

  if (record.pagina_1 || record.pagina_2 || record.pagina_3 || record.pagina_4) {
    return normalizeOldPageJson(record, normalizeUiById(record.uiById ?? record.ui_by_id));
  }

  return normalizeCmsPage(record, payload);
}

export function resolveLandingImage(image: LandingImage | undefined, uiById: Record<number, UiElementAsset>, fallback?: string) {
  if (image?.src) return image.src;
  const asset = resolveUiAsset(uiById, image?.idUi);
  if (asset?.url) return asset.url;
  return fallback;
}

export function resolveLogoUrl(navbar: LandingNavbar, uiById: Record<number, UiElementAsset>) {
  const asset = resolveUiAsset(uiById, navbar.logoIdUi);
  return asset?.url ?? fileServer.logoUrl;
}
