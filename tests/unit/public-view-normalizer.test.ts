import {
  normalizePublicLandingResponse,
  resolveLandingImage,
} from "@/features/public-view/public-view.normalizer";

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
            image: { id_ui: 7 },
          },
          navbar: { brand: "Corazón Migrante", logo: { id_ui: 1 } },
          sections: {
            confianza: {
              title: "Atención profesional",
              items: [{ title: "Confidencial", body: "Espacios seguros." }],
            },
          },
        },
        uiById: {
          1: { id_elemento: 1, link: "https://cdn.test/logo.png" },
          7: { id_elemento: 7, link: "https://cdn.test/hero.jpg" },
        },
      },
    });

    expect(landing.source).toBe("public-view");
    expect(landing.pageId).toBe("1");
    expect(landing.hero?.title).toBe("Acompañamiento emocional confiable");
    expect(landing.hero?.image?.idUi).toBe("7");
    expect(landing.sections[0]?.title).toBe("Atención profesional");
    expect(resolveLandingImage(landing.hero?.image, landing.uiById)).toBe(
      "https://cdn.test/hero.jpg",
    );
  });

  it("normaliza elementos de endpoint público de CMS con content serializado", () => {
    const landing = normalizePublicLandingResponse({
      id: "page-1",
      slug: "inicio",
      title: "Inicio",
      elements: [
        {
          code: "hero",
          content: JSON.stringify({
            title: "Desde backend",
            subtitle: "Sin mockups",
          }),
        },
        {
          code: "servicios",
          content_json: {
            title: "Servicios",
            cards: [{ title: "Terapia individual" }],
          },
        },
      ],
    });

    expect(landing.hero?.title).toBe("Desde backend");
    expect(landing.sections[0]?.title).toBe("Servicios");
    expect(landing.sections[0]?.items?.[0]?.title).toBe("Terapia individual");
  });

  it("soporta la estructura legacy pagina_1..pagina_4 con imágenes de Google Storage", () => {
    const landing = normalizePublicLandingResponse({
      data: {
        id_vista: 1,
        nombre: "Corazón Migrante",
        content: {
          telefono: "+59170000000",
          pagina_1: {
            titulo_principal: "Acompañamiento para migrantes",
            img: "landing_page/media/hero principal.png",
          },
          pagina_2: {
            titulo_principal: "Atención cercana",
            parrafo_2_0: "Un espacio seguro para hablar.",
            contenedor_2_1: {
              titulo_2_1: "Escucha",
              parrafo_2_1: "Acompañamiento profesional.",
            },
          },
          pagina_3: {
            titulo_principal: "Bienestar emocional",
            contenedor_3_1: {
              titulo_3_1: "Ansiedad",
              parrafo_3_1: "Orientación para ordenar lo que sientes.",
            },
          },
          pagina_4: {
            titulo_principal: "Desde donde estés",
            parrafo_principal: "Atención remota.",
            img: "https://storage.googleapis.com/vistas_publicas_assets/global_assets/media/mapa.png",
          },
        },
      },
    });

    expect(landing.source).toBe("public-view");
    expect(landing.hero?.title).toBe("Acompañamiento para migrantes");
    expect(landing.hero?.image?.src).toContain(
      "/landing_page/media/hero%20principal.png",
    );
    expect(landing.sections).toHaveLength(3);
    expect(landing.sections[0]?.items?.[0]?.title).toBe("Escucha");
    expect(landing.sections[1]?.items?.[0]?.title).toBe("Ansiedad");
    expect(landing.sections[2]?.image?.src).toContain(
      "storage.googleapis.com/vistas_publicas_assets",
    );
    expect(landing.phone).toBe("+59170000000");
  });
});
