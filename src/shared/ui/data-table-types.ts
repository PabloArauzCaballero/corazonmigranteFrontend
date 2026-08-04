import { type ReactNode } from "react";

/**
 * Prioridad de una columna. Determina cómo se presenta la columna en la vista
 * compacta (tarjetas) que `DataTable` usa por debajo de `md`.
 *
 * Es OPCIONAL en todos los casos: sin declararla, `DataTable` infiere un
 * comportamiento razonable (primera columna = título, columna `actions` = pie), de
 * modo que las tablas existentes no necesitan cambio alguno.
 */
export type DataTableColumnPriority =
  /** Identidad de la fila: encabeza la tarjeta, sin etiqueta. */
  | "primary"
  /** Dato normal: aparece como par etiqueta/valor. */
  | "secondary"
  /** Controles: se agrupan al pie de la tarjeta, separados por una línea. */
  | "actions"
  /** Solo tabla: se omite en la vista de tarjetas por ser redundante o decorativa. */
  | "hidden";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Ver `DataTableColumnPriority`. Si se omite, se infiere. */
  priority?: DataTableColumnPriority;
  /**
   * Etiqueta alternativa para la vista de tarjetas, cuando el encabezado de la tabla
   * resulta demasiado escueto fuera del contexto de una fila de columnas.
   */
  cardLabel?: string;
};

/**
 * Resuelve la prioridad efectiva de cada columna.
 *
 * Reglas de inferencia (verificadas contra las 16 tablas del producto):
 *  - la primera columna es la identidad de la entidad → `primary`;
 *  - una columna con `key === "actions"` agrupa controles → `actions`;
 *  - el resto son datos → `secondary`.
 */
export function resolvePriority<T>(
  column: DataTableColumn<T>,
  index: number
): DataTableColumnPriority {
  if (column.priority) return column.priority;
  if (column.key === "actions") return "actions";
  if (index === 0) return "primary";
  return "secondary";
}
