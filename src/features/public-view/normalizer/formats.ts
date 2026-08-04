/**
 * Formatos vigentes del backend: vista pública y página de CMS.
 *
 * Extraído de `public-view.normalizer.ts`, que superaba las 1000 líneas.
 */
import { asArray, asRecord, firstString } from "@/features/public-view/normalizer/primitives";
import { normalizeUiById } from "@/features/public-view/normalizer/ui-assets";
import { readContentContainer } from "@/features/public-view/normalizer/parts";
import { normalizeFooter, normalizeHero, normalizeNavbar, phoneFrom } from "@/features/public-view/normalizer/blocks";
import { sectionFrom } from "@/features/public-view/normalizer/sections";
import { normalizeLegacyContent } from "@/features/public-view/normalizer/legacy-formats";
import type {
  LandingSection,
  NormalizedPublicLanding,
} from "@/features/public-view/public-view.types";

export function normalizePublicView(
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

export function normalizeCmsPage(
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

  const heroFileId = asRecord(elementByCode.get("hero")).fileId;
  const hero =
    normalizeHero(contentOf("hero"), uiById, pageTitle, heroFileId) ??
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
