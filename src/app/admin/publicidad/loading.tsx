export default function AdminPublicidadLoading() {
  return (
    <div className="grid gap-6">
      {/* PageHeader skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </div>

      {/* Tab nav skeleton */}
      <div className="flex gap-2 border-b pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-t-lg bg-muted" />
        ))}
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex gap-4 border-b px-6 py-3 bg-muted/30">
          {[140, 100, 80, 60].map((w, i) => (
            <div key={i} className={`h-3 animate-pulse rounded bg-muted`} style={{ width: w }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-6 py-4 last:border-0">
            <div className="h-4 w-44 animate-pulse rounded bg-muted" />
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            <div className="ml-auto h-8 w-8 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
