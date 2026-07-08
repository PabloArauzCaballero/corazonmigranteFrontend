import { notFound } from "next/navigation";
import { EditorialPublicPage } from "@/features/editorial/editorial-public-page";
import { listCmsPages } from "@/features/editorial/editorial.api";

const RESERVED_PUBLIC_SLUGS = new Set([
  "admin",
  "api",
  "booking",
  "login",
  "registro",
  "noticias",
  "novedades",
  "biblioteca",
  "privacidad",
  "terminos",
  "403",
]);

export async function generateStaticParams() {
  const pages = await listCmsPages();
  return pages.filter((page) => page.slug && !RESERVED_PUBLIC_SLUGS.has(page.slug)).map((page) => ({ slug: page.slug }));
}

export default async function DynamicCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug?.trim();
  if (!slug || RESERVED_PUBLIC_SLUGS.has(slug)) notFound();
  return <EditorialPublicPage slug={slug} />;
}
