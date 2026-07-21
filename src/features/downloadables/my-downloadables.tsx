"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, Check, Download, Lock, ShoppingCart, Sparkles } from "lucide-react";
import { myLibrary, requestDownload, type LibraryCard } from "@/features/downloadables/downloadables.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { DataTableSkeleton, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState } from "@/shared/ui/state";

function accessLabel(card: LibraryCard): { text: string; variant: "success" | "warning" | "danger" | "muted" | "secondary" } {
  switch (card.access.action) {
    case "DIRECT_DOWNLOAD": return { text: "Disponible", variant: "success" };
    case "PREMIUM_DOWNLOAD": return { text: "Incluido en premium", variant: "success" };
    case "HOTMART_PRODUCT_ACCESS": return { text: "Comprado", variant: "success" };
    case "UPGRADE_REQUIRED": return { text: "Solo premium", variant: "warning" };
    case "HOTMART_CHECKOUT": return { text: "Compra requerida", variant: "danger" };
    case "LOGIN_REQUIRED": return { text: "Inicia sesión", variant: "secondary" };
    default: return { text: "No disponible", variant: "muted" };
  }
}

function DownloadableCard({ card }: { card: LibraryCard }) {
  const [error, setError] = useState<string | null>(null);
  const badge = accessLabel(card);
  const download = useMutation({
    mutationFn: () => requestDownload(card.id),
    onSuccess: (res) => { if (res.url) window.open(res.url, "_blank", "noopener"); },
    onError: (e) => setError(humanizeApiError(e)),
  });

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(43,27,23,0.12)]">
      <div className="relative h-36 overflow-hidden bg-muted">
        {card.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.coverUrl} alt={card.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground"><Download className="h-8 w-8 opacity-40" /></div>
        )}
        <span className="absolute left-3 top-3"><Badge variant={badge.variant}>{badge.text}</Badge></span>
      </div>
      <CardContent className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-[#2b1b17]">{card.title}</h3>
        {card.shortDescription && <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">{card.shortDescription}</p>}
        <div className="mt-4">
          {card.access.allowed ? (
            <Button className="w-full" loading={download.isPending} onClick={() => download.mutate()}>
              <Download className="h-4 w-4" /> Descargar
            </Button>
          ) : card.access.action === "HOTMART_CHECKOUT" && card.access.checkoutUrl ? (
            <Button asChild className="w-full" variant="outline">
              <a href={card.access.checkoutUrl} target="_blank" rel="noreferrer"><ShoppingCart className="h-4 w-4" /> Comprar en Hotmart <ArrowUpRight className="h-4 w-4" /></a>
            </Button>
          ) : card.access.action === "UPGRADE_REQUIRED" ? (
            <Button asChild className="w-full" variant="outline"><a href="/paciente/premium"><Sparkles className="h-4 w-4" /> Hazte premium</a></Button>
          ) : (
            <Button className="w-full" variant="outline" disabled><Lock className="h-4 w-4" /> No disponible</Button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

export function MyDownloadablesLibrary() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["my-downloadables", page], queryFn: () => myLibrary(page) });

  return (
    <section className="grid gap-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Check className="h-5 w-5" /></span>
        <div>
          <h2 className="text-xl font-black">Mi contenido premium</h2>
          <p className="text-sm text-muted-foreground">Guías, audios y recursos con tu estado de acceso.</p>
        </div>
      </div>

      {query.isLoading ? <DataTableSkeleton columns={3} rows={2} /> : null}
      {query.isError ? <ErrorState title="No se pudo cargar tu contenido" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
      {query.data && query.data.items.length === 0 ? (
        <Card><CardContent className="grid place-items-center gap-2 py-12 text-center text-muted-foreground"><Download className="h-8 w-8 opacity-30" /><p className="text-sm">Aún no hay recursos disponibles.</p></CardContent></Card>
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.items.map((card) => <DownloadableCard key={card.id} card={card} />)}
          </div>
          {query.data.pagination.totalPages > 1 && (
            <PaginationBar page={query.data.pagination.page} totalPages={query.data.pagination.totalPages} loading={query.isFetching} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(query.data.pagination.totalPages, p + 1))} onGoTo={(p) => setPage(p)} />
          )}
        </>
      ) : null}
    </section>
  );
}
