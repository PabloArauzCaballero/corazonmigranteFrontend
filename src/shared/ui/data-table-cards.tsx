import { type DataTableColumn, resolvePriority } from "@/shared/ui/data-table-types";

/**
 * Vista compacta de una tabla: una tarjeta por fila.
 *
 * Se usa por debajo de `md` (768 px). Motivo: una tabla de gestión con 4–6 columnas no
 * cabe en un teléfono, y resolverlo solo con desplazamiento horizontal deja la columna
 * de acciones permanentemente fuera de pantalla — que es justo la que permite operar.
 *
 * No recibe una configuración aparte: reutiliza las MISMAS columnas que la tabla, de
 * modo que ninguna pantalla que ya use `DataTable` necesita cambiar, y cualquier badge,
 * botón o modal dentro de `render` sigue funcionando igual porque se invoca tal cual.
 */
export function DataTableCards<T>({
  columns,
  rows,
  getRowKey,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
}) {
  const resolved = columns.map((column, index) => ({
    column,
    priority: resolvePriority(column, index),
  }));

  const primary = resolved.filter((entry) => entry.priority === "primary");
  const details = resolved.filter((entry) => entry.priority === "secondary");
  const actions = resolved.filter((entry) => entry.priority === "actions");

  return (
    <ul className="grid gap-3 md:hidden">
      {rows.map((row, i) => (
        <li
          key={getRowKey(row)}
          className="table-row-animated overflow-hidden rounded-2xl border bg-card shadow-sm"
          style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
        >
          {primary.length > 0 && (
            <div className="min-w-0 border-b bg-muted/40 px-4 py-3 text-sm font-semibold">
              {primary.map(({ column }) => (
                <div className="min-w-0" key={column.key}>
                  {column.render(row)}
                </div>
              ))}
            </div>
          )}

          {details.length > 0 && (
            /* `dl` en lugar de `div`: en una tarjeta la relación etiqueta→valor deja de
               ser evidente por posición (ya no hay encabezado de columna arriba), así
               que se hace explícita en el marcado para los lectores de pantalla. */
            <dl className="grid gap-2.5 px-4 py-3 text-sm">
              {details.map(({ column }) => (
                <div className="grid grid-cols-[minmax(6rem,40%)_1fr] items-start gap-3" key={column.key}>
                  <dt className="min-w-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {column.cardLabel ?? column.header}
                  </dt>
                  <dd className="min-w-0 break-words text-right">{column.render(row)}</dd>
                </div>
              ))}
            </dl>
          )}

          {actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-4 py-3">
              {actions.map(({ column }) => (
                <div className="flex min-w-0 flex-wrap items-center gap-2" key={column.key}>
                  {column.render(row)}
                </div>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Equivalente de `DataTableSkeleton` para la vista de tarjetas. */
export function DataTableCardsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-3 md:hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b bg-muted/40 px-4 py-3">
            <div className="skeleton h-4 w-2/5 rounded" style={{ animationDelay: `${i * 60}ms` }} />
          </div>
          <div className="grid gap-2.5 px-4 py-3">
            <div className="skeleton h-3 w-3/5 rounded" style={{ animationDelay: `${i * 60 + 40}ms` }} />
            <div className="skeleton h-3 w-2/5 rounded" style={{ animationDelay: `${i * 60 + 80}ms` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
