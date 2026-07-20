import { NewsPublicPage } from "@/features/newsroom/news-public";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Novedades",
  description: "Artículos, columnas y recursos de acompañamiento emocional para personas migrantes y sus familias.",
  openGraph: {
    title: "Novedades | Corazón Migrante",
    description: "Lecturas, columnas y publicaciones especializadas en bienestar emocional para migrantes.",
  },
  alternates: { canonical: "/novedades" },
};

export default function NovedadesPage() {
  return <NewsPublicPage />;
}
