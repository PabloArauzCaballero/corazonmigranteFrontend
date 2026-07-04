import { EditorialArticlePage } from "@/features/editorial/editorial-article-page";

export const metadata = {
  title: "Recurso | Corazón Migrante",
  description: "Lectura y orientación de Corazón Migrante."
};

export default async function BibliotecaDetallePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditorialArticlePage slug={slug} />;
}
