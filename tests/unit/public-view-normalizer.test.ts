import { normalizePublicLandingResponse } from "@/features/public-view/public-view.normalizer";

describe("public view configurable landing", () => {
  it("normaliza vista pública por id con content JSON y uiById", () => {
    const landing = normalizePublicLandingResponse({
      data: {
        id_vista: 1,
        nombre: "Landing principal",
        content: {
          hero: {
            title: "Acompañamiento emocional confiable",
            subtitle: "Terapia online para migrantes",
            image: { id_ui: 7 }
          },
          navbar: { brand: "Corazón Migrante", logo: { id_ui: 1 } },
          sections: {
            confianza: {
              title: "Atención profesional",
              items: [{ title: "Confidencial", body: "Espacios seguros." }]
            }
          }
        },
        uiById: {
          1: { id_elemento: 1, link: "https://cdn.test/logo.png" },
          7: { id_elemento: 7, link: "https://cdn.test/hero.jpg" }
        }
      }
    });

    expect(landing.source).toBe("public-view");
    expect(landing.pageId).toBe("1");
    expect(landing.hero?.title).toBe("Acompañamiento emocional confiable");
    expect(landing.hero?.image?.idUi).toBe("7");
    expect(landing.sections[0]?.title).toBe("Atención profesional");
  });

  it("normaliza elementos de endpoint público de CMS con content serializado", () => {
    const landing = normalizePublicLandingResponse({
      id: "page-1",
      slug: "inicio",
      title: "Inicio",
      elements: [
        { code: "hero", content: JSON.stringify({ title: "Desde backend", subtitle: "Sin mockups" }) },
        { code: "servicios", content_json: { title: "Servicios", cards: [{ title: "Terapia individual" }] } }
      ]
    });

    expect(landing.hero?.title).toBe("Desde backend");
    expect(landing.sections[0]?.title).toBe("Servicios");
    expect(landing.sections[0]?.items?.[0]?.title).toBe("Terapia individual");
  });
});
