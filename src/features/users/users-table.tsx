"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { AdminUser } from "@/features/users/users.types";
import { listUsers } from "@/features/users/users.api";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

export function UsersTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const query = useQuery({
    queryKey: ["users", { search: debouncedSearch, page, pageSize: PAGE_SIZE }],
    queryFn: () => listUsers({ search: debouncedSearch, page, pageSize: PAGE_SIZE })
  });

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border bg-card p-4">
        <Label htmlFor="usersSearch">Buscar usuarios</Label>
        <Input
          id="usersSearch"
          className="mt-2 max-w-md"
          placeholder="Nombre, correo o rol"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">La búsqueda, paginación y filtros se procesan con datos completos.</p>
      </div>

      {query.isLoading ? <LoadingState title="Consultando usuarios" /> : null}
      {query.isError ? <ErrorState title="No se pudieron cargar los usuarios" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
      {query.data ? (
        <>
          <DataTable<AdminUser>
            data={query.data.items}
            getRowKey={(row) => row.id}
            columns={[
              { key: "name", header: "Nombre", render: (row) => <span className="font-semibold">{row.name}</span> },
              { key: "email", header: "Correo", render: (row) => row.email },
              { key: "role", header: "Rol", render: (row) => <Badge variant="secondary">{row.role}</Badge> },
              { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : row.status === "pendiente" ? "warning" : "muted"}>{row.status}</Badge> }
            ]}
          />
          <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
        </>
      ) : null}
    </div>
  );
}
