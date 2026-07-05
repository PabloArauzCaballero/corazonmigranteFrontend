"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Newspaper, UserRound } from "lucide-react";
import { newsroomApi } from "@/features/newsroom/newsroom.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { ErrorState, LoadingState } from "@/shared/ui/state";

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "full" }).format(new Date(value));
}

function blocks(body?: string) {
  return (body ?? "").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
}

export function NewsDetailPage({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ["newsroom-public-detail", slug],
    queryFn: async () => {
      try {
        return await newsroomApi.publicPublication(slug, "news");
      } catch (error) {
        return await newsroomApi.publicPublication(slug, "columns");
      }
    }
  });

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white/70">
        <div className="container py-8 md:py-12">
          <Button asChild className="mb-8 rounded-none" variant="outline"><Link href="/noticias"><ArrowLeft className="h-4 w-4" /> Volver a noticias</Link></Button>
          {query.isLoading ? <LoadingState title="Cargando publicación" /> : null}
          {query.isError ? <ErrorState title="No se pudo abrir la publicación" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
          {query.data ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <article className="space-y-8">
                <div className="space-y-5">
                  <div className="inline-flex w-fit items-center gap-2 border border-teal-900/20 bg-teal-900/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-teal-900">
                    <Newspaper className="h-4 w-4" aria-hidden="true" /> {query.data.category?.name ?? "Editorial"}
                  </div>
                  <h1 className="max-w-5xl font-serif text-5xl font-bold leading-[0.98] tracking-tight text-slate-950 md:text-7xl">{query.data.title}</h1>
                  <p className="max-w-3xl text-lg leading-8 text-slate-600">{query.data.summary}</p>
                </div>
                <Card className="rounded-none border-slate-200 bg-white shadow-none">
                  <CardContent className="p-7 md:p-10">
                    <div className="prose prose-slate max-w-none prose-p:text-base prose-p:leading-8">
                      {blocks(query.data.body).length ? blocks(query.data.body).map((block) => <p key={block}>{block}</p>) : <p>{query.data.summary}</p>}
                    </div>
                  </CardContent>
                </Card>
              </article>
              <aside className="space-y-4">
                <Card className="rounded-none border-slate-200 bg-white shadow-none">
                  <CardContent className="grid gap-5 p-6">
                    <div className="flex items-start gap-3"><CalendarDays className="mt-1 h-5 w-5 text-teal-800" aria-hidden="true" /><div><p className="text-sm font-semibold">Publicado</p><p className="text-sm text-slate-600">{formatDate(query.data.publishedAt)}</p></div></div>
                    <div className="flex items-start gap-3"><UserRound className="mt-1 h-5 w-5 text-teal-800" aria-hidden="true" /><div><p className="text-sm font-semibold">Autor</p><p className="text-sm text-slate-600">{query.data.author?.displayName ?? "Equipo Corazón Migrante"}</p></div></div>
                    <div className="flex flex-wrap gap-2">{(query.data.tags ?? []).map((tag) => <Badge key={tag.id} variant="muted">{tag.name}</Badge>)}</div>
                  </CardContent>
                </Card>
                <Card className="rounded-none border-slate-200 bg-teal-950 text-white shadow-none">
                  <CardContent className="p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/65">Acompañamiento</p>
                    <h2 className="mt-3 font-serif text-2xl font-bold">¿Necesitas hablar con alguien?</h2>
                    <p className="mt-3 text-sm leading-6 text-white/75">Agenda una cita y continúa el proceso con el equipo de Corazón Migrante.</p>
                    <Button asChild className="mt-5 rounded-none bg-white text-teal-950 hover:bg-white/90"><Link href="/booking">Reservar cita</Link></Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
