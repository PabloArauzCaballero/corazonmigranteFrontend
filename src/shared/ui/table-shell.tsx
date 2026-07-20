import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * TableShell — wraps filters, table and pagination in one cohesive card container.
 * Slots:
 *   filters  — top bar (search inputs, selects, badges)
 *   children — the DataTable
 *   footer   — PaginationBar (optional)
 */
export function TableShell({
  filters,
  children,
  footer,
  className,
}: {
  filters?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card shadow-soft animate-fade-in", className)}>
      {filters && (
        <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-5 py-4">
          {filters}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
      {footer && (
        <div className="border-t px-5 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
