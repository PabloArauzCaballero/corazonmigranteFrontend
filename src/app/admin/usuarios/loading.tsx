export default function AdminUsuariosLoading() {
  return (
    <div className="grid gap-6">
      {/* PageHeader skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-52 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>

      {/* Toolbar: search + role filter + invite button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-9 w-60 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="ml-auto h-9 w-32 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Users table skeleton */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center gap-4 border-b px-6 py-3 bg-muted/30">
          <div className="h-3 w-8 animate-pulse rounded bg-muted" />
          <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-6 py-4 last:border-0">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-36 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            <div className="ml-auto h-8 w-8 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
