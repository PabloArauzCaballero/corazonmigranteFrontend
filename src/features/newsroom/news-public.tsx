"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, BookOpen, Newspaper, Search, ShieldCheck, Sparkles } from "lucide-react";
import { newsroomApi } from "@/features/newsroom/newsroom.api";
import type { Category, Publication } from "@/features/newsroom/newsroom.types";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";
import { Input } from "@/shared/ui/input";

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" }).format(new Date(value));
}

function categoryOptions(categories?: Category[]) {
  return [{ slug: "", name: "Todas" }, ...(categories ?? []).map((category) => ({ slug: category.slug, name: category.name }))];
}

function PublicationCard({ item, featured = false }: { item: Publication; featured?: boolean }) {
  return (
    <Card className={featured ? "overflow-hidden rounded-none border-slate-200 bg-white shadow-none lg:col-span-2" : "overflow-hidden rounded-none border-slate-200 bg-white shadow-none"}>
      <CardContent className="flex h-full flex-col p-0">
        <div className="border-b border-slate-200 bg-[#f7f4ef] p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-900">
            <span>{item.category?.name ?? "Editorial"}</span>
            <span className="text-slate-300">/</span>
            <span>{formatDate(item.publishedAt)}</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-5 p-6 md:p-7">
          <div className="space-y-3">
            <h2 className={featured ? "font-serif text-3xl font-bold leading-tight text-slate-950 md:text-5xl" : "font-serif text-2xl font-bold leading-tight text-slate-950"}>{item.title}</h2>
            <p className="line-clamp-4 text-sm leading-7 text-slate-600 md:text-base">{item.summary}</p>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(item.tags ?? []).slice(0, 3).map((tag) => <Badge key={tag.id} variant="muted">{tag.name}</Badge>)}
            </div>
            <Button asChild className="rounded-none bg-teal-900 hover:bg-teal-950">
              <Link href={`/noticias/${item.slug}`}>Leer <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NewsPublicPage() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [mode, setMode] = useState<"news" | "columns">("news");
  const [categorySlug, setCategorySlug] = useState("");
  const categories = useQuery({ queryKey: ["newsroom-public-categories"], queryFn: () => newsroomApi.categories(true) });
  const list = useQuery({
    queryKey: ["newsroom-public-list", mode, submittedSearch, categorySlug],
    queryFn: () => mode === "news"
      ? newsroomApi.publicNews({ page: 1, pageSize: 18, search: submittedSearch, categorySlug })
      : newsroomApi.publicColumns({ page: 1, pageSize: 18, search: submittedSearch, categorySlug })
  });

  const items = list.data?.items ?? [];
  const featured = items[0];
  const rest = useMemo(() => items.slice(1), [items]);

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white/70">
        <div className="container grid gap-10 py-10 md:grid-cols-[1fr_0.72fr] md:py-16">
          <div className="space-y-8">
            <div className="inline-flex w-fit items-center gap-2 border border-teal-900/20 bg-teal-900/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-teal-900">
              <Newspaper className="h-4 w-4" aria-hidden="true" /> Noticias y columnas
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl font-serif text-5xl font-bold leading-[0.98] tracking-tight text-slate-950 md:text-7xl">Actualidad migrante con mirada humana.</h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">Vista pública absorbida del módulo editorial: noticias, columnas y reportes publicados desde el backend unificado de Corazón Migrante.</p>
            </div>
            <form className="grid max-w-2xl gap-3 border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_auto]" onSubmit={(event) => { event.preventDefault(); setSubmittedSearch(search.trim()); }}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por titular" className="rounded-none border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0" />
              </div>
              <Button type="submit" className="rounded-none bg-teal-900 hover:bg-teal-950">Buscar</Button>
            </form>
          </div>
          <div className="relative min-h-[28rem] overflow-hidden border border-slate-200 bg-teal-950 p-8 text-white">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <Sparkles className="h-10 w-10 text-white/80" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Corazón Migrante</p>
                <h2 className="mt-4 font-serif text-4xl font-bold leading-tight">Contenido claro, confiable y conectado con la comunidad.</h2>
                <p className="mt-4 text-sm leading-7 text-white/75">La estética se mantiene sobria, editorial y cálida para que no parezca una pantalla heredada de otro sistema.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-4 border-b border-slate-200 py-6 md:grid-cols-3">
        <button className={`flex items-start gap-3 border bg-white p-4 text-left transition ${mode === "news" ? "border-teal-900 text-teal-950" : "border-slate-200 text-slate-600 hover:border-teal-900/40"}`} onClick={() => setMode("news")} type="button">
          <Newspaper className="mt-1 h-5 w-5" aria-hidden="true" /> <span><b className="block">Noticias</b><span className="text-sm">Titulares y reportes publicados.</span></span>
        </button>
        <button className={`flex items-start gap-3 border bg-white p-4 text-left transition ${mode === "columns" ? "border-teal-900 text-teal-950" : "border-slate-200 text-slate-600 hover:border-teal-900/40"}`} onClick={() => setMode("columns")} type="button">
          <BookOpen className="mt-1 h-5 w-5" aria-hidden="true" /> <span><b className="block">Columnas</b><span className="text-sm">Opinión y lectura editorial.</span></span>
        </button>
        <div className="flex items-start gap-3 border border-slate-200 bg-white p-4 text-slate-600">
          <ShieldCheck className="mt-1 h-5 w-5 text-teal-800" aria-hidden="true" /> <span><b className="block text-slate-950">Publicación controlada</b><span className="text-sm">Solo aparecen contenidos publicados.</span></span>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="mb-6 flex flex-wrap gap-2">
          {categoryOptions(categories.data).map((category) => (
            <button key={category.slug || "all"} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${categorySlug === category.slug ? "border-teal-900 bg-teal-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-900/40"}`} type="button" onClick={() => setCategorySlug(category.slug)}>{category.name}</button>
          ))}
        </div>
        {list.isLoading ? <LoadingState title="Cargando publicaciones" /> : null}
        {list.isError ? <ErrorState title="No se pudo cargar el contenido" description={humanizeApiError(list.error)} actionLabel="Reintentar" onAction={() => void list.refetch()} /> : null}
        {list.isSuccess && items.length === 0 ? <EmptyState title="No hay publicaciones para este filtro" description="Prueba otra categoría o limpia la búsqueda." /> : null}
        {items.length > 0 ? <div className="grid gap-6 lg:grid-cols-3">{featured ? <PublicationCard item={featured} featured /> : null}{rest.map((item) => <PublicationCard key={item.id} item={item} />)}</div> : null}
      </section>
    </main>
  );
}
