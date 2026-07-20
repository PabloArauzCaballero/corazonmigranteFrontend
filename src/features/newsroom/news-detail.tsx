"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Lock, Megaphone, Newspaper, UserRound } from "lucide-react";
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


type PublicAdSlot = {
  creativeId: string;
  title: string;
  assetUrl: string;
  destinationUrl: string;
  altText: string;
  sponsorLabel?: string;
  company?: string;
};

function normalizeAdSlots(payload: unknown): PublicAdSlot[] {
  const source = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null
      ? ((payload as Record<string, unknown>).items ?? (payload as Record<string, unknown>).data ?? (payload as Record<string, unknown>).slots)
      : [];
  if (!Array.isArray(source)) return [];
  return source
    .map((item, index) => {
      const record = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
      const assetUrl = String(record.assetUrl ?? record.asset_url ?? record.imageUrl ?? record.url ?? "").trim();
      const destinationUrl = String(record.destinationUrl ?? record.destination_url ?? record.href ?? "#").trim();
      if (!assetUrl) return null;
      return {
        creativeId: String(record.creativeId ?? record.id ?? `ad-${index}`),
        title: String(record.title ?? record.name ?? "Publicidad"),
        assetUrl,
        destinationUrl,
        altText: String(record.altText ?? record.alt ?? record.title ?? "Publicidad"),
        sponsorLabel: String(record.sponsorLabel ?? record.sponsor_label ?? "Contenido patrocinado"),
        company: record.company ? String(record.company) : undefined
      } satisfies PublicAdSlot;
    })
    .filter(Boolean) as PublicAdSlot[];
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
  const resolvedKind: "news" | "columns" = ["COLUMN", "OPINION"].includes(query.data?.publicationType ?? "") ? "columns" : kind;
  const premiumDetail = useQuery({
    queryKey: ["newsroom-premium-detail", slug, resolvedKind],
    queryFn: () => getPremiumPublication(slug, resolvedKind),
    enabled: isPremium && isEntitled,
    retry: false
  });
  const publication = premiumDetail.data ?? query.data;
  const adsQuery = useQuery({
    queryKey: ["newsroom-public-ads", slug, publication?.id],
    queryFn: async () => {
      // /advertising/slots puede fallar (bug confirmado del servidor); la publicidad es
      // decorativa, así que cada intento se degrada a "sin anuncios" en vez de romper la pantalla.
      const articleSlots = await newsroomApi.publicSlots("article_sidebar", publication?.id).then(normalizeAdSlots).catch(() => []);
      if (articleSlots.length > 0) return articleSlots;
      return newsroomApi.publicSlots("home_hero", publication?.id).then(normalizeAdSlots).catch(() => []);
    },
    enabled: Boolean(publication),
    retry: false
  });
  const showPaywall = isPremium && !premiumDetail.data;
  const bodyBlocks = blocks(publication?.body);
  const previewBlocks = showPaywall ? bodyBlocks.slice(0, 2) : bodyBlocks;

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-slate-950">
      <section className="border-b border-slate-200 bg-white/70">
        <div className="container py-8 md:py-12">
          <Button asChild className="mb-8 rounded-none" variant="outline"><Link href="/novedades"><ArrowLeft className="h-4 w-4" /> Volver a contenido público</Link></Button>
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
                {(adsQuery.data ?? []).length > 0 ? (
                  <Card className="rounded-none border-slate-200 bg-white shadow-none">
                    <CardContent className="grid gap-4 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        <Megaphone className="h-4 w-4" aria-hidden="true" /> Publicidad
                      </div>
                      {(adsQuery.data ?? []).slice(0, 2).map((ad) => (
                        <a key={ad.creativeId} href={ad.destinationUrl} target="_blank" rel="noreferrer" className="group block overflow-hidden border border-slate-200 bg-[#fbfaf8] transition hover:border-teal-900/40">
                          <img src={ad.assetUrl} alt={ad.altText} className="h-40 w-full object-cover transition group-hover:scale-[1.02]" />
                          <div className="space-y-1 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-800">{ad.sponsorLabel}</p>
                            <p className="text-sm font-semibold text-slate-950">{ad.title}</p>
                            {ad.company ? <p className="text-xs text-slate-500">{ad.company}</p> : null}
                          </div>
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
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
