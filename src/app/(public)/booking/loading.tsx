export default function BookingLoading() {
  return (
    <div className="container py-16 max-w-3xl mx-auto">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="rounded-2xl border bg-card p-8 space-y-6">
        {/* Step indicator skeleton */}
        <div className="flex items-center gap-3">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              {step < 3 && <div className="h-px w-12 animate-pulse bg-muted" />}
            </div>
          ))}
        </div>
        {/* Form skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted" />
            ))}
          </div>
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
