"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Crown, LockKeyhole, ShieldCheck } from "lucide-react";
import { getMyContentSubscription, listPremiumCandidates } from "@/features/newsroom/premium-content.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha de vencimiento";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "long" }).format(date);
}

export function PatientPremiumPage() {
  const subscription = useQuery({ queryKey: ["patient-premium-subscription"], queryFn: getMyContentSubscription });
  const content = useQuery({ queryKey: ["patient-premium-content"], queryFn: listPremiumCandidates });

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.72fr]">
          <div className="space-y-5 p-7 md:p-10">
            <Badge variant="secondary" className="w-fit"><Crown className="mr-1 h-3.5 w-3.5" />Premium</Badge>
            <div>
              <h1 className="font-serif text-4xl font-bold tracking-tight text-slate-950">Contenido de acompanamiento premium</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Lecturas de profundizacion para pacientes con suscripcion activa dentro del portal privado.</p>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-[#f7f4ef] p-7 lg:border-l lg:border-t-0 md:p-10">
            {subscription.isLoading ? <LoadingState title="Consultando suscripcion" /> : null}
            {subscription.isError ? <ErrorState title="No se pudo leer tu suscripcion" description={humanizeApiError(subscription.error)} /> : null}
            {subscription.data ? (
              <Card className="rounded-none border-slate-200 bg-white shadow-none">
                <CardHeader>
                  <CardDescription>Estado de acceso</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    {subscription.data.isPremiumActive ? <ShieldCheck className="h-5 w-5 text-teal-800" /> : <LockKeyhole className="h-5 w-5 text-amber-700" />}
                    {subscription.data.isPremiumActive ? "Premium activo" : "Premium no activo"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-slate-600">
                  <p>Plan: <b>{subscription.data.subscriptionTier ?? "FREE"}</b></p>
                  <p>Vigencia: {formatDate(subscription.data.premiumUntil)}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </section>

      {content.isLoading ? <LoadingState title="Cargando contenido premium" /> : null}
      {content.isError ? <ErrorState title="No se pudo cargar contenido premium" description={humanizeApiError(content.error)} actionLabel="Reintentar" onAction={() => void content.refetch()} /> : null}
      {content.data?.length === 0 ? <EmptyState title="Sin contenido premium publicado" description="Cuando el equipo publique nuevas lecturas premium apareceran aqui." /> : null}
      {content.data && content.data.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {content.data.map((item) => (
            <article key={item.id} className="border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={item.accessType === "PREMIUM" ? "warning" : "muted"}>{item.accessType === "PREMIUM" ? "Premium" : "Publico"}</Badge>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.publicationType}</span>
              </div>
              <h2 className="mt-4 font-serif text-2xl font-bold leading-tight text-slate-950">{item.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{item.summary}</p>
              <Button asChild variant="outline" className="mt-5 rounded-none">
                <Link href={{ pathname: "/novedades/detalle", query: { slug: item.slug, premium: "1", kind: item.publicationType === "COLUMN" ? "columns" : "news" } }}>
                  Abrir lectura <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
