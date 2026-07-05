import { NewsDetailPage } from "@/features/newsroom/news-detail";

export const metadata = {
  title: "Publicación | Corazón Migrante"
};

export default async function PublicacionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <NewsDetailPage slug={slug} />;
}
