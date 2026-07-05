import { buildPublicAssetUrl, fileServer } from "@/config/file-server";
import type {
  LandingCard,
  LandingHero,
  LandingImage,
  LandingLink,
  LandingNavbar,
  LandingSection,
  NormalizedPublicLanding,
  UiElementAsset,
} from "@/features/public-view/public-view.types";

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
  if (typeof value === "object") return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function asStringArray(value: unknown): string[] {
  const parsed = parseJsonMaybe(value);
  if (Array.isArray(parsed))
    return parsed.map(asString).filter(Boolean) as string[];
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

function firstString(...values: unknown[]) {
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

function normalizeAssetUrl(value?: string) {
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

function readContentContainer(value: unknown) {
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

function linkFrom(
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

function imageFrom(
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

function cardFrom(
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

function numberedContainers(
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

function sectionFrom(
  code: string,
  value: unknown,
  uiById: Record<number, UiElementAsset>,
  index = 0,
): LandingSection | null {
  const record = readContentContainer(value);
  const title = firstString(
    record.title,
    record.titulo,
    record.titulo_principal,
    record.name,
    record.nombre,
    record.heading,
  );
  const subtitle = firstString(
    record.subtitle,
    record.subtitulo,
    record.subtitulo_principal,
    record.entradilla,
  );
  const body = firstString(
    record.body,
    record.parrafo,
    record.parrafo_principal,
    record.description,
    record.descripcion,
    record.text,
    record.texto,
  );
  const paragraphs = asStringArray(
    record.paragraphs ??
      record.parrafos ??
      record.descriptionList ??
      record.lista_descripcion,
  );
  const explicitItems = asArray(
    record.items ??
      record.cards ??
      record.tarjetas ??
      record.specialists ??
      record.psicologos ??
      record.features,
  )
    .map((item) => cardFrom(item, uiById))
    .filter(Boolean) as LandingCard[];
  const inferredItems = numberedContainers(record, "contenedor_", uiById);
  const items = explicitItems.length > 0 ? explicitItems : inferredItems;
  const image = imageFrom(
    record.image ?? record.img ?? record.media ?? record.imagen ?? record.foto,
    uiById,
  );
  const primaryCta = linkFrom(
    record.primaryCta ?? record.primary_cta ?? record.cta,
  );
  const secondaryCta = linkFrom(record.secondaryCta ?? record.secondary_cta);
  const layout = asString(record.layout) as
    LandingSection["layout"] | undefined;

  if (
    !title &&
    !subtitle &&
    !body &&
    paragraphs.length === 0 &&
    items.length === 0 &&
    !image?.src &&
    !primaryCta
  )
    return null;

  return {
    id:
      firstString(record.id, record.slug, record.anchor) ??
      code.replace(/_/g, "-") ??
      `section-${index + 1}`,
    code,
    label: firstString(record.label, record.etiqueta),
    badge: textFromIconText(record.badge ?? record.kicker),
    title,
    subtitle,
    body,
    paragraphs,
    image,
    items,
    primaryCta,
    secondaryCta,
    layout,
  };
}

function normalizeUiById(raw: unknown): Record<number, UiElementAsset> {
  const out: Record<number, UiElementAsset> = {};
  const parsed = parseJsonMaybe(raw);
  const entries = Array.isArray(parsed)
    ? parsed.map(
        (value, index) =>
          [
            String(
              (value as { id?: unknown; id_elemento?: unknown })?.id ??
                (value as { id_elemento?: unknown })?.id_elemento ??
                index,
            ),
            value,
          ] as [string, unknown],
      )
    : isRecord(parsed)
      ? Object.entries(parsed)
      : [];

  for (const [key, value] of entries) {
    const row = asRecord(value);
    const metadata = asRecord(row.metadata);
    const id =
      toNumber(key) ??
      toNumber(
        row.id_elemento ??
          row.id ??
          row.uiId ??
          row.ui_id ??
          row.elementId ??
          row.element_id,
      );
    if (!id) continue;
    const url = normalizeAssetUrl(
      firstString(
        row.link,
        row.url,
        row.publicUrl,
        row.public_url,
        row.fileUrl,
        row.file_url,
        row.path,
        row.objectKey,
        row.object_key,
        metadata.url,
        metadata.publicUrl,
        metadata.public_url,
        metadata.fileUrl,
        metadata.file_url,
        metadata.path,
        metadata.objectKey,
        metadata.object_key,
      ),
    );
    const alt = asString(
      row.alt ?? metadata.alt ?? row.descripcion ?? row.description,
    );
    out[id] = {
      id,
      type: asString(row.tipo ?? row.type) ?? "",
      value: asString(row.valor ?? row.value),
      url,
      alt,
      metadata,
    };
  }

  return out;
}

function resolveUiAsset(uiById: Record<number, UiElementAsset>, idUi: unknown) {
  const id = toNumber(idUi);
  if (!id) return undefined;
  return uiById[id];
}

function normalizeFooter(raw: unknown): NormalizedPublicLanding["footer"] {
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

function textFromIconText(value: unknown): string | undefined {
  const direct = asString(value);
  if (direct) return direct;
  const record = asRecord(value);
  return firstString(record.text, record.label, record.title, record.titulo);
}

function normalizeNavbar(
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

function normalizeHero(
  raw: unknown,
  uiById: Record<number, UiElementAsset>,
  pageTitle?: string,
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
  const image = imageFrom(
    record.image ?? record.img ?? record.media ?? record.imagen ?? record.foto,
    uiById,
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

function phoneFrom(...sources: unknown[]) {
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

function normalizeOldPageJson(
  raw: Record<string, unknown>,
  uiById: Record<number, UiElementAsset>,
): NormalizedPublicLanding {
  const p1 = asRecord(raw.pagina_1);
  const p2 = asRecord(raw.pagina_2);
  const p3 = asRecord(raw.pagina_3);
  const p4 = asRecord(raw.pagina_4);

  const hero = normalizeHero(
    {
      title: p1.titulo_principal ?? p1.titulo ?? raw.titulo,
      subtitle: p1.subtitulo_principal ?? p1.subtitulo ?? p2.parrafo_2_0,
      description: p1.parrafo_principal ?? p1.descripcion,
      image: p1.img ?? p1.imagen ?? p1.image,
      badge: p1.etiqueta ?? p1.badge,
      primaryCta: p1.cta_primario ?? p1.primaryCta,
      secondaryCta: p1.cta_secundario ?? p1.secondaryCta,
    },
    uiById,
    firstString(p1.titulo_principal, raw.titulo),
  );

  const sections: LandingSection[] = [];
  const p2Items = numberedContainers(p2, "contenedor_2_", uiById);
  const intro = sectionFrom(
    "acompanamiento",
    {
      id: "acompanamiento",
      title: p2.titulo_principal ?? p2.titulo,
      subtitle: p2.subtitulo_principal ?? p2.subtitulo,
      body: p2.parrafo_principal ?? p2.parrafo_2_0,
      image: p2.img ?? p2.imagen,
      items: p2Items,
      layout: p2Items.length > 0 ? "cards" : "compact",
    },
    uiById,
  );
  if (intro) sections.push(intro);

  const emotionsItems = numberedContainers(p3, "contenedor_3_", uiById);
  const emotions = sectionFrom(
    "bienestar",
    {
      id: "bienestar",
      title: p3.titulo_principal ?? p3.titulo,
      subtitle: p3.subtitulo_principal ?? p3.subtitulo,
      body: p3.parrafo_principal ?? p3.parrafo,
      image: p3.img ?? p3.imagen,
      items: emotionsItems,
      layout: "cards",
    },
    uiById,
  );
  if (emotions) sections.push(emotions);

  const mapSection = sectionFrom(
    "encuentro",
    {
      id: "encuentro",
      title: p4.titulo_principal ?? p4.titulo,
      subtitle: p4.subtitulo_principal ?? p4.subtitulo,
      body: p4.parrafo_principal ?? p4.parrafo,
      image: p4.img ?? p4.imagen,
      primaryCta: p4.cta,
      layout: "split",
    },
    uiById,
  );
  if (mapSection) sections.push(mapSection);

  return {
    source: "legacy-json",
    title: firstString(raw.titulo, p1.titulo_principal),
    seoDescription: firstString(raw.descripcion, p2.parrafo_2_0),
    navbar: normalizeNavbar(
      raw.navbar,
      uiById,
      firstString(raw.titulo, p1.titulo_principal),
    ),
    hero,
    sections,
    footer: normalizeFooter(raw.footer),
    phone: phoneFrom(raw, p1, p2, p3, p4),
    uiById,
    raw,
  };
}

function normalizeLegacyContent(
  content: Record<string, unknown>,
  uiById: Record<number, UiElementAsset>,
  raw: unknown,
): NormalizedPublicLanding {
  if (
    content.pagina_1 ||
    content.pagina_2 ||
    content.pagina_3 ||
    content.pagina_4
  ) {
    return {
      ...normalizeOldPageJson(content, uiById),
      raw,
      source: "legacy-bundle",
    };
  }

  const sectionsRecord = asRecord(content.sections);
  const sections: LandingSection[] = [];

  const presentation = sectionFrom(
    "presentation_section",
    content.presentation_section,
    uiById,
  );
  if (presentation)
    sections.push({ ...presentation, layout: presentation.layout ?? "split" });

  for (const [key, value] of Object.entries(sectionsRecord)) {
    const section = sectionFrom(key, value, uiById, sections.length);
    if (section) sections.push(section);
  }

  for (const [key, value] of Object.entries(content)) {
    if (
      [
        "hero",
        "navbar",
        "footer",
        "sections",
        "seo",
        "title",
        "titulo",
        "phone",
        "telefono",
        "presentation_section",
      ].includes(key)
    )
      continue;
    if (!/(section|seccion|bloque|pagina_)/i.test(key)) continue;
    const section = sectionFrom(key, value, uiById, sections.length);
    if (section && !sections.some((item) => item.id === section.id))
      sections.push(section);
  }

  const pageTitle = firstString(
    asRecord(content.hero).title,
    content.title,
    content.titulo,
  );
  return {
    source: "legacy-bundle",
    title: firstString(content.title, content.titulo, pageTitle),
    seoDescription: firstString(
      asRecord(content.seo).description,
      content.descripcion,
    ),
    navbar: normalizeNavbar(content.navbar, uiById, pageTitle),
    hero: normalizeHero(content.hero, uiById, pageTitle),
    sections,
    footer: normalizeFooter(content.footer),
    phone: phoneFrom(content),
    uiById,
    raw,
  };
}

function normalizePublicView(
  view: Record<string, unknown>,
  raw: unknown,
): NormalizedPublicLanding {
  const content = asRecord(
    view.content ??
      view.json ??
      view.config ??
      view.payload ??
      view.dataJson ??
      view.data_json,
  );
  const uiById = normalizeUiById(
    view.uiById ??
      view.ui_by_id ??
      view.assets ??
      view.elementAssets ??
      view.element_assets ??
      view.ui,
  );

  if (Object.keys(content).length > 0) {
    const normalized = normalizeLegacyContent(content, uiById, raw);
    return {
      ...normalized,
      source: "public-view",
      pageId: firstString(view.id, view.id_vista, view.id_vista_publica),
      slug: firstString(view.slug, view.code, view.codigo, view.cod_pagina),
      title:
        normalized.title ??
        firstString(view.title, view.titulo, view.name, view.nombre),
      phone: normalized.phone ?? phoneFrom(view),
      raw,
    };
  }

  const normalized = normalizeCmsPage(view, raw);
  return {
    ...normalized,
    source: "public-view",
    pageId:
      normalized.pageId ??
      firstString(view.id, view.id_vista, view.id_vista_publica),
    slug:
      normalized.slug ??
      firstString(view.slug, view.code, view.codigo, view.cod_pagina),
    title:
      normalized.title ??
      firstString(view.title, view.titulo, view.name, view.nombre),
    phone: normalized.phone ?? phoneFrom(view),
    raw,
  };
}

function normalizeCmsPage(
  page: Record<string, unknown>,
  raw: unknown,
): NormalizedPublicLanding {
  const elements = asArray(
    page.elements ?? page.elementos ?? page.pageElements ?? page.page_elements,
  );
  const elementByCode = new Map<string, Record<string, unknown>>();
  for (const item of elements) {
    const record = asRecord(item);
    const code = firstString(
      record.code,
      record.codigo,
      record.cod_elemento,
      record.elementCode,
      record.element_code,
      record.nombre,
    );
    if (!code) continue;
    elementByCode.set(code, record);
  }

  const uiById = normalizeUiById(
    page.uiById ??
      page.ui_by_id ??
      page.assets ??
      page.elementAssets ??
      page.element_assets,
  );
  const contentOf = (code: string) => {
    const element = elementByCode.get(code);
    return readContentContainer(element ?? {});
  };
  const pageTitle =
    firstString(page.title, page.titulo, page.name, page.nombre) ??
    "Corazón Migrante";
  const seo = asRecord(page.seoMetadata ?? page.seo_metadata ?? page.seo);

  const hero =
    normalizeHero(contentOf("hero"), uiById, pageTitle) ??
    normalizeHero(page, uiById, pageTitle);
  const navbar = normalizeNavbar(contentOf("navbar"), uiById, pageTitle);
  const footerContent = normalizeFooter(contentOf("footer"));

  const sections: LandingSection[] = [];

  for (const record of elements.map(asRecord)) {
    const code = firstString(
      record.code,
      record.codigo,
      record.cod_elemento,
      record.elementCode,
      record.element_code,
      record.nombre,
    );
    if (!code || ["navbar", "hero", "footer"].includes(code)) continue;
    const section = sectionFrom(code, record, uiById, sections.length);
    if (section) sections.push(section);
  }

  return {
    source: "cms",
    pageId: firstString(page.id, page.pageId, page.page_id),
    slug: firstString(page.slug, page.codigo, page.code),
    title: pageTitle,
    seoDescription: firstString(seo.description, seo.descripcion),
    navbar,
    hero,
    sections,
    footer: footerContent,
    phone: phoneFrom(
      page,
      contentOf("footer"),
      contentOf("contacto"),
      contentOf("contact"),
    ),
    uiById,
    raw,
  };
}

export function normalizePublicLandingResponse(
  payload: unknown,
): NormalizedPublicLanding {
  const raw = unwrapData(payload);
  const record = asRecord(raw);
  const rootContent = asRecord(record.content);
  const nestedData = asRecord(record.data);
  const nestedContent = asRecord(nestedData.content);

  if (record.publicView || record.public_view) {
    return normalizePublicView(
      asRecord(record.publicView ?? record.public_view),
      payload,
    );
  }

  if (
    record.id_vista ||
    record.id_vista_publica ||
    record.viewId ||
    record.view_id ||
    record.publicViewType ||
    record.public_view_type
  ) {
    return normalizePublicView(record, payload);
  }

  if (Object.keys(rootContent).length > 0) {
    const uiById = normalizeUiById(
      record.uiById ?? record.ui_by_id ?? record.data ?? record.assets,
    );
    return normalizeLegacyContent(rootContent, uiById, payload);
  }

  if (Object.keys(nestedContent).length > 0) {
    const uiById = normalizeUiById(
      nestedData.uiById ?? nestedData.ui_by_id ?? nestedData.assets,
    );
    return normalizeLegacyContent(nestedContent, uiById, payload);
  }

  if (
    record.pagina_1 ||
    record.pagina_2 ||
    record.pagina_3 ||
    record.pagina_4
  ) {
    return normalizeOldPageJson(
      record,
      normalizeUiById(record.uiById ?? record.ui_by_id ?? record.assets),
    );
  }

  if (
    Array.isArray(record.elements) ||
    Array.isArray(record.elementos) ||
    record.slug ||
    record.seoMetadata ||
    record.seo_metadata
  ) {
    return normalizeCmsPage(record, payload);
  }

  if (
    record.navbar ||
    record.hero ||
    record.sections ||
    record.footer ||
    record.presentation_section
  ) {
    return normalizeLegacyContent(
      record,
      normalizeUiById(record.uiById ?? record.ui_by_id ?? record.assets),
      payload,
    );
  }

  return normalizeCmsPage(record, payload);
}

export function resolveLandingImage(
  image: LandingImage | undefined,
  uiById: Record<number, UiElementAsset>,
  fallback?: string,
) {
  const direct = normalizeAssetUrl(image?.src);
  if (direct) return direct;
  const asset = resolveUiAsset(uiById, image?.idUi);
  if (asset?.url) return asset.url;
  return normalizeAssetUrl(fallback);
}

export function resolveLogoUrl(
  navbar: LandingNavbar,
  uiById: Record<number, UiElementAsset>,
) {
  const asset = resolveUiAsset(uiById, navbar.logoIdUi);
  return asset?.url ?? normalizeAssetUrl(fileServer.logoUrl);
}
