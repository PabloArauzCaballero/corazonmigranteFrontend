import { extractLandingV2, resolveV2Image } from "@/features/public-view/landing-v2.mapper";
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
          url: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/media/mapa.png",
        },
      },
    } as unknown as NormalizedPublicLanding;

    expect(resolveV2Image({ id_ui: 7 }, normalized)).toContain("storage.googleapis.com/vistas_publicas_assets");
  });
});
