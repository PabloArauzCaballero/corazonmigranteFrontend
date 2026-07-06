"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Lock, Newspaper, UserRound } from "lucide-react";
import { newsroomApi } from "@/features/newsroom/newsroom.api";
import { getMyContentSubscription, getPremiumPublication } from "@/features/newsroom/premium-content.api";
import { useSession } from "@/shared/auth/use-session";
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

export function NewsDetailPage({ slug, kind = "news" }: { slug: string; kind?: "news" | "columns" }) {
  const { session } = useSession();
  const query = useQuery({
    queryKey: ["newsroom-public-detail", slug, kind],
    queryFn: async () => {
      try {
        return await newsroomApi.publicPublication(slug, kind);
      } catch {
        return await newsroomApi.publicPublication(slug, kind === "news" ? "columns" : "news");
      }
    }
  });
  const isPremium = query.data?.accessType === "PREMIUM";
  const subscription = useQuery({
    queryKey: ["newsroom-my-subscription", slug],
    queryFn: getMyContentSubscription,
    enabled: isPremium && Boolean(session),
    retry: false
  });
  const isEntitled = subscription.data?.isPremiumActive === true;
  const premiumDetail = useQuery({
    queryKey: ["newsroom-premium-detail", slug, kind],
    queryFn: () => getPremiumPublication(slug, kind),
    enabled: isPremium && isEntitled,
    retry: false
  });
  const publication = premiumDetail.data ?? query.data;
  const showPaywall = isPremium && !premiumDetail.data;
  const bodyBlocks = blocks(publication?.body);
  const previewBlocks = showPaywall ? bodyBlocks.slice(0, 2) : bodyBlocks;

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white/70">
        <div className="container py-8 md:py-12">
          <Button asChild className="mb-8 rounded-none" variant="outline"><Link href="/novedades"><ArrowLeft className="h-4 w-4" /> Volver a novedades</Link></Button>
          {query.isLoading ? <LoadingState title="Cargando publicación" /> : null}
          {query.isError ? <ErrorState title="No se pudo abrir la publicación" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
          {publication ? (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <article className="space-y-8">
                <div className="space-y-5">
                  <div className="inline-flex w-fit items-center gap-2 border border-teal-900/20 bg-teal-900/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-teal-900">
                    <Newspaper className="h-4 w-4" aria-hidden="true" /> {publication.category?.name ?? "Editorial"}
                  </div>
                  <h1 className="max-w-5xl font-serif text-5xl font-bold leading-[0.98] tracking-tight text-slate-950 md:text-7xl">{publication.title}</h1>
                  <p className="max-w-3xl text-lg leading-8 text-slate-600">{publication.summary}</p>
                  {showPaywall ? (
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
                      <Lock className="h-4 w-4" aria-hidden="true" /> Contenido premium
                    </div>
                  ) : null}
                </div>
                <Card className="relative rounded-none border-slate-200 bg-white shadow-none">
                  <CardContent className="p-7 md:p-10">
                    <div className="prose prose-slate max-w-none prose-p:text-base prose-p:leading-8">
                      {previewBlocks.length ? previewBlocks.map((block) => <p key={block}>{block}</p>) : <p>{publication.summary}</p>}
                    </div>
                  </CardContent>
                  {showPaywall ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/90 to-transparent" aria-hidden="true" />
                  ) : null}
                </Card>
                {showPaywall ? (
                  <Card className="rounded-none border-teal-900/20 bg-teal-900/5 shadow-none">
                    <CardContent className="flex flex-col items-start gap-4 p-7 md:flex-row md:items-center md:justify-between md:p-8">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-900">Suscripción premium</p>
                        <h2 className="mt-2 font-serif text-2xl font-bold text-slate-950">Sigue leyendo esta publicación</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Este contenido es exclusivo para suscriptores premium de Corazón Migrante. {session ? "Tu cuenta aún no tiene una suscripción premium activa." : "Inicia sesión para verificar tu acceso o contáctanos para suscribirte."}</p>
                      </div>
                      <Button asChild className="shrink-0 bg-teal-900 hover:bg-teal-950"><Link href={session ? "/booking" : "/login"}>{session ? "Contactar al equipo" : "Iniciar sesión"}</Link></Button>
                    </CardContent>
                  </Card>
                ) : null}
              </article>
              <aside className="space-y-4">
                <Card className="rounded-none border-slate-200 bg-white shadow-none">
                  <CardContent className="grid gap-5 p-6">
                    <div className="flex items-start gap-3"><CalendarDays className="mt-1 h-5 w-5 text-teal-800" aria-hidden="true" /><div><p className="text-sm font-semibold">Publicado</p><p className="text-sm text-slate-600">{formatDate(publication.publishedAt)}</p></div></div>
                    <div className="flex items-start gap-3"><UserRound className="mt-1 h-5 w-5 text-teal-800" aria-hidden="true" /><div><p className="text-sm font-semibold">Autor</p><p className="text-sm text-slate-600">{publication.author?.displayName ?? "Equipo Corazón Migrante"}</p></div></div>
                    <div className="flex flex-wrap gap-2">{(publication.tags ?? []).map((tag) => <Badge key={tag.id} variant="muted">{tag.name}</Badge>)}</div>
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
