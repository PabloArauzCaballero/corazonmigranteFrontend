"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, LockKeyhole, UserRound } from "lucide-react";
import { env } from "@/config/env";
import { getHeroFromPage, getPublicCmsPage, getResourcesFromPage } from "@/features/editorial/editorial.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

function formatDate(value?: string) {
  if (!value) return "Publicado desde la biblioteca editorial";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" }).format(date);
}

export function EditorialArticlePage({ slug }: { slug: string }) {
  const librarySlug = env.NEXT_PUBLIC_CMS_LIBRARY_SLUG;
  const pageQuery = useQuery({
    queryKey: ["cms-library-resource", librarySlug, slug],
    queryFn: () => getPublicCmsPage(librarySlug)
  });

  if (pageQuery.isLoading) return <main className="container py-12"><LoadingState title="Cargando recurso editorial" /></main>;
  if (pageQuery.isError) {
    return (
      <main className="container py-12">
        <ErrorState title="No se pudo abrir el recurso" description={humanizeApiError(pageQuery.error)} actionLabel="Reintentar" onAction={() => void pageQuery.refetch()} />
      </main>
    );
  }

  const page = pageQuery.data;
  const resource = page ? getResourcesFromPage(page).find((item) => item.slug === slug || item.sourceElement.code === slug || item.id === slug) : undefined;
  const hero = page ? getHeroFromPage(page) : undefined;

  if (!resource) {
    return (
      <main className="container py-12">
        <Button asChild variant="ghost" className="mb-8"><Link href="/biblioteca"><ArrowLeft className="h-4 w-4" /> Volver a biblioteca</Link></Button>
        <EmptyState title="Recurso no encontrado" description="La biblioteca cargó correctamente, pero no hay un recurso activo con este enlace." />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-slate-950">
      <section className="container py-8 md:py-12">
        <Button asChild variant="ghost" className="mb-8 rounded-none">
          <Link href="/biblioteca"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a biblioteca</Link>
        </Button>
        <article className="mx-auto max-w-6xl border border-slate-200 bg-white">
          <header className="grid gap-0 md:grid-cols-[1fr_0.84fr]">
            <div className="flex flex-col justify-between gap-10 border-b border-slate-200 p-7 md:border-b-0 md:border-r md:p-10">
              <div className="space-y-7">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-teal-800">
                  <span>{resource.category}</span>
                  {resource.isPremium ? <span className="inline-flex items-center gap-1 bg-teal-900 px-2 py-1 text-white"><LockKeyhole className="h-3 w-3" />Premium</span> : null}
                  <span className="h-px w-10 bg-teal-800/50" aria-hidden="true" />
                  <span>{resource.eyebrow}</span>
                </div>
                <div className="space-y-5">
                  <h1 className="font-serif text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">{resource.title}</h1>
                  {resource.summary ? <p className="max-w-3xl text-lg leading-8 text-slate-600">{resource.summary}</p> : null}
                </div>
              </div>
              <div className="grid gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500 sm:grid-cols-3">
                <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4" aria-hidden="true" />{resource.authorLabel}</span>
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" aria-hidden="true" />{formatDate(resource.publishedAt)}</span>
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" aria-hidden="true" />{resource.readTimeLabel}</span>
              </div>
            </div>
            <div className="min-h-[22rem] bg-slate-100 md:min-h-[34rem]">
              {resource.imageUrl ? <img src={resource.imageUrl} alt={resource.imageAlt} className="h-full w-full object-cover" /> : null}
            </div>
          </header>

          {resource.bodyBlocks.length > 0 ? (
            <div className="mx-auto grid max-w-3xl gap-7 px-7 py-10 font-serif text-xl leading-9 text-slate-800 md:px-0 md:py-14">
              {resource.bodyBlocks.map((block, index) => <p key={`${resource.id}-block-${index}`}>{block}</p>)}
            </div>
          ) : (
            <div className="p-7 md:p-12">
              <EmptyState title="Contenido pendiente" description="El elemento existe, pero todavía no incluye cuerpo, bloques o contenido de lectura." />
            </div>
          )}

          {resource.isPremium ? (
            <div className="mx-auto mb-10 max-w-3xl border border-teal-900/20 bg-teal-900/5 p-7">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-teal-900"><LockKeyhole className="h-4 w-4" />Contenido premium</p>
              {resource.premiumSummary ? <p className="mt-4 text-sm leading-7 text-slate-700">{resource.premiumSummary}</p> : null}
              {resource.premiumBodyBlocks.length > 0 ? (
                <div className="mt-6 grid gap-5 font-serif text-lg leading-8 text-slate-800">
                  {resource.premiumBodyBlocks.map((block, index) => <p key={`${resource.id}-premium-${index}`}>{block}</p>)}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-600">Este recurso esta marcado como premium. El contenido adicional puede cargarse desde el administrador editorial.</p>
              )}
            </div>
          ) : null}

          <Card className="m-7 rounded-none border-slate-200 bg-[#f7f4ef] shadow-none md:m-10">
            <CardContent className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-800">{hero?.eyebrow ?? "Acompañamiento"}</p>
                <h2 className="mt-2 font-serif text-2xl font-bold">¿Necesitas acompañamiento personalizado?</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">La reserva se gestiona desde tu cuenta para mantener trazabilidad clínica y seguridad.</p>
              </div>
              <Button asChild className="rounded-none bg-teal-900 hover:bg-teal-950">
                <Link href="/booking">Gestionar reserva</Link>
              </Button>
            </CardContent>
          </Card>
        </article>
      </section>
    </main>
  );
}
