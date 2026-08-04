/**
 * Formatos heredados del CMS que siguen llegando desde producción.
 *
 * Se conservan porque hay páginas publicadas con esta forma: retirarlos dejaría
 * la landing en blanco para quien aún no haya migrado su contenido.
 *
 * Extraído de `public-view.normalizer.ts`, que superaba las 1000 líneas.
 */
import { asRecord, firstString } from "@/features/public-view/normalizer/primitives";
import { numberedContainers } from "@/features/public-view/normalizer/parts";
import { normalizeFooter, normalizeHero, normalizeNavbar, phoneFrom } from "@/features/public-view/normalizer/blocks";
import { sectionFrom } from "@/features/public-view/normalizer/sections";
import type {
  LandingSection,
  NormalizedPublicLanding,
  UiElementAsset,
} from "@/features/public-view/public-view.types";

export function normalizeOldPageJson(
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

export function normalizeLegacyContent(
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
