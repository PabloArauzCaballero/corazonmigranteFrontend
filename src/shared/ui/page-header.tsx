import { ReactNode } from "react";
import { TUTORIAL_TARGETS } from "@/features/tutorial/model/tutorial-targets";

/**
 * Los `data-tutorial-id` viven en esta primitiva a propósito: al usarla casi todas las
 * pantallas de los portales, cualquier tutorial puede resaltar el título o las acciones
 * de una página sin que haya que anotar cada una por separado.
 */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div
      className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between md:pb-6"
      data-tutorial-id={TUTORIAL_TARGETS.encabezadoPagina}
    >
      {/* `min-w-0`: sin él un hijo flex se niega a encoger por debajo de su contenido,
          y un título largo empujaba las acciones fuera del ancho de la página. */}
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm sm:tracking-[0.22em]">{eyebrow}</p> : null}
        <h1
          className="text-fluid-title break-words font-bold tracking-tight"
          data-tutorial-id={TUTORIAL_TARGETS.tituloPagina}
        >
          {title}
        </h1>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p> : null}
      </div>
      {actions ? (
        /* `flex-wrap`: los botones llevan `whitespace-nowrap` por diseño (no queremos
           botones partidos en dos líneas), así que la envoltura tiene que ocurrir en el
           contenedor. Sin esto, dos acciones ya desbordaban la página por debajo de
           400 px. En móvil se alinean a la izquierda, siguiendo el flujo de lectura. */
        <div
          className="flex flex-wrap items-center gap-2 md:justify-end"
          data-tutorial-id={TUTORIAL_TARGETS.accionesPagina}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
