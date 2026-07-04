"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, HeartHandshake, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { env } from "@/config/env";
import { getHeroFromPage, getPublicCmsPage, getResourcesFromPage } from "@/features/editorial/editorial.api";
import { EditorialArticleCard } from "@/features/editorial/editorial-card";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";
import { Input } from "@/shared/ui/input";

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function EditorialPublicPage() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const pageSlug = env.NEXT_PUBLIC_CMS_LIBRARY_SLUG;
  const pageQuery = useQuery({
    queryKey: ["cms-public-page", pageSlug],
    queryFn: () => getPublicCmsPage(pageSlug)
  });

  const resources = useMemo(() => {
    const page = pageQuery.data;
    if (!page) return [];
    const allResources = getResourcesFromPage(page);
    const term = normalize(submittedSearch.trim());
    if (!term) return allResources;
    return allResources.filter((resource) => normalize(`${resource.title} ${resource.summary} ${resource.category}`).includes(term));
  }, [pageQuery.data, submittedSearch]);

  const hero = pageQuery.data ? getHeroFromPage(pageQuery.data) : undefined;
  const lead = resources[0];
  const rest = resources.slice(1);

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white/70">
        <div className="container grid gap-10 py-10 md:grid-cols-[1fr_0.82fr] md:py-16">
          <div className="flex flex-col justify-between gap-10">
            <div className="space-y-7">
              <div className="inline-flex w-fit items-center gap-2 border border-teal-900/20 bg-teal-900/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-teal-900">
                <BookOpen className="h-4 w-4" aria-hidden="true" /> {hero?.eyebrow ?? "Biblioteca emocional"}
              </div>
              <div className="space-y-5">
                <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[0.98] tracking-tight text-slate-950 md:text-7xl">
                  {hero?.title ?? "Recursos para acompañar procesos migrantes con humanidad."}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">{hero?.subtitle}</p>
              </div>
            </div>

            <form
              className="grid max-w-2xl gap-3 border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedSearch(search.trim());
              }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar guías, temas o categorías" className="rounded-none border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0" />
              </div>
              <Button type="submit" className="rounded-none bg-teal-900 hover:bg-teal-950">Buscar</Button>
            </form>
          </div>

          <div className="relative min-h-[32rem] overflow-hidden border border-slate-200 bg-slate-100">
            {hero?.imageUrl ? <img src={hero.imageUrl} alt={hero.imageAlt} className="h-full w-full object-cover" loading="eager" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Confianza clínica
              </div>
              <h2 className="max-w-md font-serif text-3xl font-bold leading-tight md:text-4xl">Contenido administrado desde CMS y archivos del servidor.</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/80">Sin contenido local de negocio: si el backend no publica bloques, la biblioteca lo informa de forma transparente.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-4 border-b border-slate-200 py-6 md:grid-cols-3">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 text-teal-800" aria-hidden="true" />
          <div><p className="font-semibold">Minimalista y profesional</p><p className="text-sm leading-6 text-slate-600">Jerarquía editorial, aire visual y contraste confiable.</p></div>
        </div>
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-5 w-5 text-teal-800" aria-hidden="true" />
          <div><p className="font-semibold">CMS real</p><p className="text-sm leading-6 text-slate-600">Lee `/api/v1/public/pages/{pageSlug}` del backend.</p></div>
        </div>
        <div className="flex items-start gap-3">
          <HeartHandshake className="mt-1 h-5 w-5 text-teal-800" aria-hidden="true" />
          <div><p className="font-semibold">Acción clara</p><p className="text-sm leading-6 text-slate-600">Reserva protegida para paciente autenticado.</p></div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        {pageQuery.isLoading ? <LoadingState title="Consultando biblioteca en el backend" /> : null}
        {pageQuery.isError ? (
          <ErrorState title="No se pudo cargar la biblioteca" description={humanizeApiError(pageQuery.error)} actionLabel="Reintentar" onAction={() => void pageQuery.refetch()} />
        ) : null}
        {pageQuery.isSuccess && resources.length === 0 ? (
          <Card className="overflow-hidden rounded-none border-slate-200 bg-white shadow-none">
            <CardContent className="grid gap-8 p-0 md:grid-cols-[0.8fr_1fr]">
              {hero?.imageUrl ? <img src={hero.imageUrl} alt="Biblioteca sin contenidos publicados" className="h-full min-h-80 w-full object-cover" /> : null}
              <div className="flex flex-col justify-center p-8 md:p-12">
                <EmptyState title="Todavía no hay recursos publicados" description="Crea la página CMS y agrega elementos activos desde el panel administrativo. La vista no usa datos locales ni contenidos falsos." />
                <div className="mt-6">
                  <Button asChild variant="outline" className="rounded-none">
                    <Link href="/admin/contenido/editorial">Configurar CMS</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
        {resources.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {lead ? <EditorialArticleCard resource={lead} priority /> : null}
            {rest.map((resource) => <EditorialArticleCard key={resource.id} resource={resource} />)}
          </div>
        ) : null}
      </section>
    </main>
  );
}
