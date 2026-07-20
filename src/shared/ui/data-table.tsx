import { type ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { EmptyState } from "@/shared/ui/state";
import { Button } from "@/shared/ui/button";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

// Skeleton row shown while data is loading
export function DataTableSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/70">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="skeleton h-3 w-20 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-4">
                    <div
                      className="skeleton h-4 rounded"
                      style={{
                        width: colIdx === 0 ? "70%" : colIdx === columns - 1 ? "40%" : "55%",
                        animationDelay: `${(rowIdx * columns + colIdx) * 40}ms`,
                      }}
                    />
                    {colIdx === 0 && (
                      <div className="skeleton mt-1.5 h-3 w-2/5 rounded" style={{ animationDelay: `${rowIdx * 120}ms` }} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyTitle = "Sin resultados",
  emptyDescription = "Ajusta la búsqueda o los filtros para encontrar información.",
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th className={column.className ?? "px-4 py-3 font-semibold"} key={column.key}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, i) => (
              <tr
                className="table-row-animated transition-colors hover:bg-muted/40"
                key={getRowKey(row)}
                style={{ animationDelay: `${i * 35}ms` }}
              >
                {columns.map((column) => (
                  <td className={column.className ?? "px-4 py-4 align-top"} key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function pageWindow(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | "...")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) out.push("...");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 1) out.push("...");
  out.push(totalPages);
  return out;
}

export function PaginationBar({
  page,
  totalPages,
  loading = false,
  onPrevious,
  onNext,
  onGoTo,
}: {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onGoTo?: (page: number) => void;
}) {
  const pages = pageWindow(page, totalPages);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className={`flex items-center gap-2 text-muted-foreground transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
        Página <span className="font-semibold text-foreground">{page}</span> de{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          disabled={page <= 1 || loading}
          onClick={onPrevious}
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          className="h-9 w-9 transition-transform duration-150 hover:-translate-x-0.5 disabled:translate-x-0 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Numbered pages */}
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`gap-${i}`} className="px-1.5 text-muted-foreground">…</span>
            ) : (
              <button
                key={p}
                type="button"
                disabled={loading}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onGoTo?.(p)}
                className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-semibold transition-all duration-150 ${
                  p === page
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border bg-background text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
                } ${onGoTo ? "cursor-pointer" : "cursor-default"}`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <Button
          disabled={page >= totalPages || loading}
          onClick={onNext}
          variant="outline"
          size="icon"
          aria-label="Página siguiente"
          className="h-9 w-9 transition-transform duration-150 hover:translate-x-0.5 disabled:translate-x-0 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
