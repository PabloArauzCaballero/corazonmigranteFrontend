import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TUTORIAL_TARGETS } from "@/features/tutorial/model/tutorial-targets";

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
      {/* El padding es progresivo: a 320 px los 40 px fijos anteriores se comían el
          12,5 % del ancho útil, sumados a los del contenedor de página. En escritorio
          se conserva el espaciado original. */}
      {filters && (
        <div
          className="flex flex-wrap items-center gap-2.5 border-b bg-muted/30 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4"
          data-tutorial-id={TUTORIAL_TARGETS.filtrosTabla}
        >
          {filters}
        </div>
      )}
      <div className="p-3 sm:p-5">
        {children}
      </div>
      {footer && (
        <div className="border-t px-3 py-3 sm:px-5">
          {footer}
        </div>
      )}
    </div>
  );
}
