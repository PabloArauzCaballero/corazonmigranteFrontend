export function mapLandingJson(raw) {
    const safe = raw || {};

    const p3 = safe.pagina_3 || {};
    const emotionsItems = [
        { title: p3?.contenedor_3_1?.titulo_3_1, body: p3?.contenedor_3_1?.parrafo_3_1 },
        { title: p3?.contenedor_3_2?.titulo_3_2, body: p3?.contenedor_3_2?.parrafo_3_2 },
        { title: p3?.contenedor_3_3?.titulo_3_3, body: p3?.contenedor_3_3?.parrafo_3_3 },
        { title: p3?.contenedor_3_4?.titulo_3_4, body: p3?.contenedor_3_4?.parrafo_3_4 },
    ].filter(it => (it.title || it.body));


    const p4 = safe.pagina_4 || {};

    return {
        navbar: {
            brand: "Corazón Migrante",
            links: [
                { label: "Inicio", href: "#inicio" },
                { label: "Historia", href: "#mapa" },
                { label: "Misión", href: "#mision" },
                { label: "Emociones", href: "#emociones" },
            ],
            cta_admin_label: "Portal Admin",
        },

        hero: {
            title: safe?.pagina_1?.titulo_principal || "",
            subtitle: safe?.pagina_2?.parrafo_2_0 || "",
            badge: "Acompañamiento emocional para migrantes",
            primaryCtaLabel: "Agendar evaluación",
            secondaryCtaLabel: "Conocer la historia",
        },

        sections: {
            emotions: {
                title: "¿Qué sentimos al migrar?",
                items: emotionsItems.map((it) => ({
                    title: it.title || "",
                    body: it.body || "",
                    image: null,
                })),
            },

            map: {
                title: p4?.titulo_principal || "",
                subtitle: p4?.subtitulo_principal || "",
                paragraphs: p4?.parrafo_principal ? [p4.parrafo_principal] : [],
                link: { label: "Leer la historia completa", href: "#mision" },
                image: null,
            },

            mission: null,
        },

        footer: {
            note: "© Corazón Migrante. Todos los derechos reservados.",
        },
    };
}
