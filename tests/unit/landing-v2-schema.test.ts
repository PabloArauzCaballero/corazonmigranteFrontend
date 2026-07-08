import { extractLandingV2, resolveV2Image } from "@/features/public-view/landing-v2.mapper";
import { normalizePublicLandingResponse } from "@/features/public-view/public-view.normalizer";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";

describe("landing_v2 real schema", () => {
  it("extrae el contrato real aunque venga envuelto en data.content", () => {
    const landing = extractLandingV2({
      data: {
        content: {
          meta: { schema: "landing_v2" },
          navbar: { links: [{ label: "Historia", href: "#mapa" }] },
          hero: {
            visual: {
              bubbles: [
                { variant: "user", text: "Me siento culpable." },
                { variant: "assistant", text: "Lo que sentís es válido." },
              ],
            },
            trust_cards: [{ title: "Confidencial", body: "Tu historia se cuida." }],
          },
          sections: {
            map: {
              paragraphs: {
                main: ["Texto principal"],
                aditional: ["Texto adicional"],
                testimonios: {
                  "María": { paragraph: ["Historia completa"], image: { id_ui: 2 } },
                },
                conclusion_phrase: {
                  "Ser de dos mundos no es una pérdida.": ["Conclusión"],
                },
              },
            },
            mission: { paragraphs: ["Misión completa"] },
            emotions: { items: [{ title: "intense_nostalgia", body: "Nostalgia" }] },
            psicologists: { items: [{ name: "Marlene", story: ["Historia profesional"] }] },
            cta: { bullets: [{ text: "Confidencialidad" }] },
          },
          footer: { tagline: ["Acompañamiento emocional"] },
          telefono: "+591 77026706",
        },
      },
    });

    expect(landing?.meta?.schema).toBe("landing_v2");
    expect(landing?.hero?.visual?.bubbles).toHaveLength(2);
    expect(landing?.sections?.map?.paragraphs?.aditional).toHaveLength(1);
    expect(Object.keys(landing?.sections?.map?.paragraphs?.testimonios ?? {})).toContain("María");
    expect(landing?.sections?.psicologists?.items?.[0]?.name).toBe("Marlene");
    expect(landing?.telefono).toBe("+591 77026706");
  });

  it("resuelve imágenes por id_ui sin depender de mocks locales", () => {
    const normalized = {
      uiById: {
        7: {
          id: 7,
          type: "image",
          url: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/landing_page/media/mapa.png",
        },
      },
    } as unknown as NormalizedPublicLanding;

    expect(resolveV2Image({ id_ui: 7 }, normalized)).toContain("res.cloudinary.com/demo/image/upload/corazon-migrante");
  });
  it("preserva el landing_v2 completo desde el payload publico del backend", () => {
    const payload = {
      data: {
        id_vista: 1,
        content: {
          meta: { schema: "landing_v2", key: "landing.public.es" },
          navbar: {
            brand: { label: "Corazon Migrante", icon: 1, href: "#inicio" },
            links: [{ label: "Historia", href: "#mapa" }],
          },
          hero: {
            title_line_1: "Lejos de tu hogar?",
            title_line_2: "Calma. Ahora ira todo mejor.",
            visual: {
              bubbles: [
                { variant: "user", text: "Me siento culpable por estar bien aca." },
                { variant: "assistant", text: "Lo que sentis es comun y valido." },
              ],
            },
            trust_cards: [{ icon: "lock", title: "Confidencial", body: "Tu historia se cuida." }],
          },
          sections: {
            map: {
              id: "mapa",
              paragraphs: {
                main: ["**Suelen empezar con noches de insomnio**."],
                aditional: ["Migrar no es solo cambiar de lugar."],
                testimonios: {
                  "Maria, 47 anos": {
                    paragraph: ["Trabaja limpiando casas. Tres por dia."],
                    image: { id_ui: 2 },
                  },
                },
                conclusion_phrase: {
                  "Ser de dos mundos no es una perdida.": ["No estas dividido: estas expandido."],
                },
              },
            },
            mission: { paragraphs: ["Acompanamos a personas migrantes."] },
            emotions: { items: [{ title: "Culpa Migratoria", body: "Por haberte ido." }] },
            psicologists: {
              items: [
                {
                  name: "Marlene Cossio",
                  role: "Psicologa Clinica",
                  story: ["Soy psicologa clinica y tambien soy madre de cinco hijos."],
                  image: { src: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/landing_page/media/Marlene_optimized.jpg" },
                },
              ],
            },
            cta: { title: "No tienes que cargar esto solo.", bullets: [{ text: "Confidencialidad y calidez." }] },
          },
          footer: { tagline: ["Acompanamiento emocional para quienes viven lejos de casa."] },
          telefono: "+591 77026706",
        },
        uiById: {
          1: { id_elemento: 1, link: "https://cdn.test/logo.png" },
          2: { id_elemento: 2, link: "https://cdn.test/maria.png" },
        },
      },
    };

    const normalized = normalizePublicLandingResponse(payload);
    const landing = extractLandingV2(normalized.raw);

    expect(landing?.meta?.schema).toBe("landing_v2");
    expect(landing?.hero?.visual?.bubbles).toHaveLength(2);
    expect(landing?.sections?.map?.paragraphs?.testimonios?.["Maria, 47 anos"]?.paragraph).toHaveLength(1);
    expect(Object.keys(landing?.sections?.map?.paragraphs?.conclusion_phrase ?? {})).toContain("Ser de dos mundos no es una perdida.");
    expect(landing?.sections?.psicologists?.items?.[0]?.name).toBe("Marlene Cossio");
    expect(resolveV2Image({ id_ui: 2 }, normalized)).toBe("https://cdn.test/maria.png");
    expect(landing?.telefono).toBe("+591 77026706");
  });
});
