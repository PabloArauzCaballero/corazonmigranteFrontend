"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listAccountingRows, type AccountingResource, type AccountingRow } from "@/features/accounting/accounting.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

export function AccountingTable({ resource }: { resource: AccountingResource }) {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["accounting", resource, { page, pageSize: PAGE_SIZE }], queryFn: () => listAccountingRows(resource, { page, pageSize: PAGE_SIZE }) });

  if (query.isLoading) return <LoadingState title="Consultando contabilidad" />;
  if (query.isError) return <ErrorState title="No se pudo cargar la información contable" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />;

  if (query.data && query.data.items.length === 0) {
    return <EmptyState title="Sin registros" description="Aún no hay elementos en este catálogo contable. Crea el primero desde el botón superior." />;
  }

  return query.data ? (
    <div className="grid gap-4">
      <DataTable<AccountingRow>
        data={query.data.items}
        getRowKey={(row) => row.id}
        columns={[
          { key: "code", header: "Código", render: (row) => <span className="font-mono text-xs">{row.code}</span> },
          { key: "name", header: "Nombre", render: (row) => <span className="font-semibold">{row.name}</span> },
          { key: "group", header: "Grupo", render: (row) => row.group },
          { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : row.status === "pendiente" ? "warning" : "muted"}>{row.status}</Badge> }
        ]}
      />
      <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
    </div>
  ) : null;
}
