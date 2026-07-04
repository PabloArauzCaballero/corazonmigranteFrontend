import { fileServer, buildPublicAssetUrl } from "@/config/file-server";
import { getHeroFromPage, getResourcesFromPage, mapCmsPage } from "@/features/editorial/editorial.api";

describe("CMS editorial real", () => {
  it("normaliza la página y elementos del contrato GET /api/v1/public/pages/:slug", () => {
    const page = mapCmsPage({
      id: "page-1",
      slug: "biblioteca",
      title: "Biblioteca emocional",
      status: "PUBLISHED",
      seoMetadata: { description: "Recursos" },
      elements: [
        { id: "hero-1", code: "hero", type: "HERO", sortOrder: 0, status: "ACTIVE", content: { title: "Acompañamiento confiable", subtitle: "Lecturas clínicas", imageUrl: "https://cdn.test/hero.webp" } },
        { id: "res-1", code: "resource-duelo", type: "RESOURCE_CARD", sortOrder: 1, status: "ACTIVE", content: { title: "Duelo migratorio", slug: "duelo-migratorio", summary: "Guía breve", bodyBlocks: ["Primer párrafo.", "Segundo párrafo."], imageUrl: "https://cdn.test/recurso.webp" } }
      ]
    });

    const hero = getHeroFromPage(page);
    const resources = getResourcesFromPage(page);

    expect(hero).toMatchObject({ title: "Acompañamiento confiable", subtitle: "Lecturas clínicas", imageUrl: "https://cdn.test/hero.webp" });
    expect(resources[0]).toMatchObject({ title: "Duelo migratorio", slug: "duelo-migratorio", summary: "Guía breve", bodyBlocks: ["Primer párrafo.", "Segundo párrafo."] });
  });

  it("mantiene imagen por defecto desde servidor de archivos cuando CMS no envía imagen", () => {
    const page = mapCmsPage({ id: "page-1", slug: "biblioteca", title: "Biblioteca", status: "PUBLISHED", elements: [] });
    const hero = getHeroFromPage(page);
    expect(hero.imageUrl).toBe(fileServer.editorialHeroImageUrl);
  });

  it("construye URL pública a partir de objectKey cuando existe base pública", () => {
    expect(buildPublicAssetUrl("public/cms/file.webp")).toContain("public/cms/file.webp");
  });
});
