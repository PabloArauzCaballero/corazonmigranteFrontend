"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listPublicContent, type PublicContentRow } from "@/features/public-content/public-content.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

export function PublicContentTable() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["public-content", { page, pageSize: PAGE_SIZE }], queryFn: () => listPublicContent({ page, pageSize: PAGE_SIZE }) });

  if (query.isLoading) return <LoadingState title="Consultando contenido público en el sistema" />;
  if (query.isError) return <ErrorState title="No se pudo cargar el contenido público" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />;

  return query.data ? (
    <div className="grid gap-4">
      <DataTable<PublicContentRow>
        data={query.data.items}
        getRowKey={(row) => row.id}
        columns={[
          { key: "name", header: "Sección", render: (row) => <span className="font-semibold">{row.name}</span> },
          { key: "page", header: "Página", render: (row) => row.page },
          { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : row.status === "pendiente" ? "warning" : "muted"}>{row.status}</Badge> },
          { key: "actions", header: "Acciones", render: () => <Button size="sm" variant="outline">Editar</Button> }
        ]}
      />
      <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
    </div>
  ) : null;
}
