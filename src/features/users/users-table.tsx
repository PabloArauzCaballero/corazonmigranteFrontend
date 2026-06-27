"use client";

import { useMemo, useState } from "react";
import { demoUsers } from "@/features/users/users.data";
import type { AdminUser } from "@/features/users/users.types";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { Badge } from "@/shared/ui/badge";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function UsersTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const rows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return demoUsers;
    return demoUsers.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(term));
  }, [debouncedSearch]);

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border bg-card p-4">
        <Label htmlFor="usersSearch">Buscar usuarios</Label>
        <Input id="usersSearch" className="mt-2 max-w-md" placeholder="Nombre, correo o rol" value={search} onChange={(event) => setSearch(event.target.value)} />
        <p className="mt-2 text-xs text-muted-foreground">En producción esta búsqueda debe enviarse al backend con debounce y paginación server-side.</p>
      </div>
      <DataTable<AdminUser>
        data={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "name", header: "Nombre", render: (row) => <span className="font-semibold">{row.name}</span> },
          { key: "email", header: "Correo", render: (row) => row.email },
          { key: "role", header: "Rol", render: (row) => <Badge variant="secondary">{row.role}</Badge> },
          { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : "muted"}>{row.status}</Badge> }
        ]}
      />
      <PaginationBar page={page} totalPages={1} onPrevious={() => setPage(Math.max(1, page - 1))} onNext={() => setPage(page + 1)} />
    </div>
  );
}
