export default function NovedadesLoading() {
  return (
    <div className="container py-16">
      <div className="mb-10 space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      {/* Featured article skeleton */}
      <div className="mb-8 overflow-hidden rounded-2xl border bg-card">
        <div className="h-56 animate-pulse bg-muted sm:h-72" />
        <div className="space-y-3 p-6">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
      {/* Article list skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border bg-card">
            <div className="h-36 animate-pulse bg-muted" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-5 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
