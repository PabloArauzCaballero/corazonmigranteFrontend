import { ReactNode } from "react";
import { EmptyState } from "@/shared/ui/state";
import { Button } from "@/shared/ui/button";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyTitle = "Sin resultados",
  emptyDescription = "Ajusta la búsqueda o los filtros para encontrar información."
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
    <div className="overflow-hidden rounded-2xl border bg-card">
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
            {data.map((row) => (
              <tr className="transition hover:bg-muted/40" key={getRowKey(row)}>
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

export function PaginationBar({ page, totalPages, onPrevious, onNext }: { page: number; totalPages: number; onPrevious?: () => void; onNext?: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        Página <span className="font-semibold text-foreground">{page}</span> de <span className="font-semibold text-foreground">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <Button disabled={page <= 1} onClick={onPrevious} variant="outline" size="sm">
          Anterior
        </Button>
        <Button disabled={page >= totalPages} onClick={onNext} variant="outline" size="sm">
          Siguiente
        </Button>
      </div>
    </div>
  );
}
