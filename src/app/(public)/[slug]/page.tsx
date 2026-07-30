import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { EditorialPublicPage } from "@/features/editorial/editorial-public-page";
import { listCmsPages } from "@/features/editorial/editorial.api";

// Con `output: "export"` la ruta /[slug] se genera estáticamente en build. Si
// `generateStaticParams()` devuelve un array vacío, Next.js 15 falla con
// «Page "/[slug]" is missing "generateStaticParams()"». En Cloudflare el backend
// no es accesible durante el build (y NEXT_PUBLIC_API_BASE_URL puede no estar
// definida), así que listCmsPages() devuelve []. Este fallback garantiza que
// SIEMPRE se pre-genere al menos una cáscara HTML; el contenido real lo carga
// EditorialPublicPage en el cliente por slug.
const FALLBACK_PUBLIC_SLUGS = [env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG, "inicio"];

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
  const fromApi = pages
    .map((page) => page.slug)
    .filter((slug): slug is string => Boolean(slug) && !RESERVED_PUBLIC_SLUGS.has(slug));

  // Nunca devolver [] (rompe el build con output: export). Unimos API + fallback.
  const slugs = new Set([...fromApi, ...FALLBACK_PUBLIC_SLUGS.filter((slug) => !RESERVED_PUBLIC_SLUGS.has(slug))]);

  return [...slugs].map((slug) => ({ slug }));
}

export default async function DynamicCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug?.trim();
  if (!slug || RESERVED_PUBLIC_SLUGS.has(slug)) notFound();
  return <EditorialPublicPage slug={slug} />;
}
