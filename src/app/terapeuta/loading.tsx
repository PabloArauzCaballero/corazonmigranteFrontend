export default function TerapeutaLoading() {
  return (
    <div className="grid gap-8">
      {/* PageHeader skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-44 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>

      {/* StatCards skeleton */}
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-8 w-12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-44 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* ProfileCard skeleton */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
