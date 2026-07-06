"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listTransactions, type TransactionRow } from "@/features/accounting/accounting.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

export function TransactionsTable() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["transactions", { page, pageSize: PAGE_SIZE }], queryFn: () => listTransactions({ page, pageSize: PAGE_SIZE }) });

  if (query.isLoading) return <LoadingState title="Consultando transacciones" />;
  if (query.isError) return <ErrorState title="No se pudieron cargar las transacciones" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />;

  if (query.data && query.data.items.length === 0) {
    return <EmptyState title="Sin transacciones registradas" description="Aún no hay movimientos contables. Usa el botón Nueva transacción para registrar la primera partida." />;
  }

  return query.data ? (
    <div className="grid gap-4">
      <DataTable<TransactionRow>
        data={query.data.items}
        getRowKey={(row) => row.id}
        columns={[
          { key: "date", header: "Fecha", render: (row) => row.date },
          { key: "detail", header: "Detalle", render: (row) => row.detail },
          { key: "amount", header: "Monto", render: (row) => row.amount },
          { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "pendiente" ? "warning" : "secondary"}>{row.status}</Badge> }
        ]}
      />
      <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
    </div>
  ) : null;
}
