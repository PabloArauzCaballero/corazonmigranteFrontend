"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listApproaches, listServices, type CatalogRow } from "@/features/products/products.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

type CatalogKind = "approaches" | "services";

const catalogLoaders = {
  approaches: listApproaches,
  services: listServices
} satisfies Record<CatalogKind, typeof listApproaches>;

export function CatalogTable({ kind }: { kind: CatalogKind }) {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["catalog", kind, { page, pageSize: PAGE_SIZE }], queryFn: () => catalogLoaders[kind]({ page, pageSize: PAGE_SIZE }) });

  if (query.isLoading) return <LoadingState title="Consultando catálogo en el backend" />;
  if (query.isError) return <ErrorState title="No se pudo cargar el catálogo" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />;

  return query.data ? (
    <div className="grid gap-4">
      <DataTable<CatalogRow>
        data={query.data.items}
        getRowKey={(row) => row.id}
        columns={[
          { key: "name", header: "Nombre", render: (row) => <span className="font-semibold">{row.name}</span> },
          { key: "type", header: "Tipo", render: (row) => row.type },
          { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : row.status === "pendiente" ? "warning" : "muted"}>{row.status}</Badge> },
          { key: "actions", header: "Acciones", render: () => <Button size="sm" variant="outline">Editar</Button> }
        ]}
      />
      <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
    </div>
  ) : null;
}
