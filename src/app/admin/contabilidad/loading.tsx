export default function AdminContabilidadLoading() {
  return (
    <div className="grid gap-6">
      {/* PageHeader skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>

      {/* Module cards grid skeleton (mirrors 2-col card layout of actual page) */}
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
              <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
