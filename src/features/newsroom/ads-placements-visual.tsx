"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle } from "lucide-react";
import { adsApi } from "@/features/newsroom/newsroom.api";
import type { AdsPlacement } from "@/features/newsroom/newsroom.types";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { PageHeader } from "@/shared/ui/page-header";
import { LoadingState, ErrorState } from "@/shared/ui/state";
import { humanizeApiError } from "@/shared/api/errors";

// Visual map: code -> position in the diagram
const PLACEMENT_MAP: Record<string, { label: string; position: string; color: string; page: "home" | "article" | "category" | "all" }> = {
  home_hero:         { label: "Banner principal",     position: "Inicio — arriba del todo",         color: "bg-violet-100 text-violet-800 border-violet-300",  page: "home" },
  home_sidebar:      { label: "Lateral inicio",       position: "Inicio — columna derecha",          color: "bg-blue-100 text-blue-800 border-blue-300",        page: "home" },
  article_top:       { label: "Sobre el artículo",    position: "Publicación — encabezado",          color: "bg-amber-100 text-amber-800 border-amber-300",     page: "article" },
  article_sidebar:   { label: "Lateral artículo",     position: "Publicación — columna derecha",     color: "bg-orange-100 text-orange-800 border-orange-300",  page: "article" },
  article_inline:    { label: "Dentro del artículo",  position: "Publicación — entre párrafos",      color: "bg-rose-100 text-rose-800 border-rose-300",        page: "article" },
  category_top:      { label: "Top de categoría",     position: "Categoría — encabezado",            color: "bg-emerald-100 text-emerald-800 border-emerald-300", page: "category" },
};

function SiteWireframe({ placements }: { placements: AdsPlacement[] }) {
  const activeCodes = new Set(placements.filter((p) => p.isActive).map((p) => p.code));

  function Slot({ code, label, className = "" }: { code: string; label: string; className?: string }) {
    const active = activeCodes.has(code);
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-dashed text-center text-xs font-semibold transition-all duration-200 ${
          active
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-muted-foreground/20 bg-muted/40 text-muted-foreground/50"
        } ${className}`}
        title={active ? `${label} — activo` : `${label} — inactivo`}
      >
        <div>
          {active
            ? <CheckCircle className="mx-auto mb-1 h-4 w-4 text-primary" />
            : <XCircle className="mx-auto mb-1 h-4 w-4 text-muted-foreground/40" />}
          <span className="leading-tight">{label}</span>
          {active && <span className="mt-0.5 block text-[10px] font-normal opacity-70">Activo</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Home page wireframe */}
      <Card>
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Página de inicio</p>
          <div className="grid gap-2">
            {/* Nav bar mockup */}
            <div className="flex h-8 items-center gap-2 rounded-lg bg-muted/60 px-3">
              <div className="h-4 w-4 rounded-full bg-primary/30" />
              <div className="h-2 w-20 rounded bg-muted-foreground/20" />
              <div className="ml-auto flex gap-2">
                {[1,2,3].map(i => <div key={i} className="h-2 w-8 rounded bg-muted-foreground/20" />)}
              </div>
            </div>
            {/* Hero slot */}
            <Slot code="home_hero" label="Banner inicio" className="h-20" />
            {/* Content + sidebar */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-2">
                {[1,2].map(i => <div key={i} className="h-14 rounded-lg bg-muted/50" />)}
              </div>
              <Slot code="home_sidebar" label="Lateral inicio" className="h-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article page wireframe */}
      <Card>
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Página de artículo / publicación</p>
          <div className="grid gap-2">
            <div className="flex h-8 items-center gap-2 rounded-lg bg-muted/60 px-3">
              <div className="h-2 w-16 rounded bg-muted-foreground/20" />
              <div className="h-2 w-24 rounded bg-primary/30" />
            </div>
            <Slot code="article_top" label="Sobre el artículo" className="h-12" />
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-2">
                <div className="h-5 rounded bg-muted/50 w-3/4" />
                <div className="h-3 rounded bg-muted/40" />
                <Slot code="article_inline" label="Dentro del artículo" className="h-10 col-span-2" />
                <div className="h-3 rounded bg-muted/40" />
                <div className="h-3 rounded bg-muted/40 w-4/5" />
              </div>
              <Slot code="article_sidebar" label="Lateral artículo" className="h-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category page wireframe */}
      <Card>
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Página de categoría</p>
          <div className="grid gap-2">
            <div className="h-6 w-32 rounded-lg bg-muted/50" />
            <Slot code="category_top" label="Top de categoría" className="h-12" />
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-16 rounded-lg bg-muted/50" />)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-5">
          <p className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ubicaciones configuradas</p>
          <div className="grid gap-2">
            {placements.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay ubicaciones registradas en el servidor.</p>
            )}
            {placements.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{p.code} · {p.context}</p>
                </div>
                <Badge variant={p.isActive ? "success" : "muted"}>
                  {p.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdsPlacementsVisual() {
  const placements = useQuery({ queryKey: ["ads-placements"], queryFn: () => adsApi.placements() });

  if (placements.isLoading) return <LoadingState title="Cargando ubicaciones" />;
  if (placements.isError) return <ErrorState title="No se pudieron cargar las ubicaciones" description={humanizeApiError(placements.error)} actionLabel="Reintentar" onAction={() => void placements.refetch()} />;

  return <SiteWireframe placements={placements.data ?? []} />;
}
