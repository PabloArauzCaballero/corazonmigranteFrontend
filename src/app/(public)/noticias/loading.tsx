import { Loader2 } from "lucide-react";

export default function NoticiasLoading() {
  return (
    <div className="container py-16">
      <div className="mb-10 h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border bg-card">
            <div className="h-44 animate-pulse bg-muted" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-5 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="flex items-center gap-2 pt-2">
                <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">
        <Loader2 className="animate-spin" aria-label="Cargando noticias" />
      </span>
    </div>
  );
}
