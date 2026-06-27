"use client";

import { Badge } from "@/shared/ui/badge";
import { DataTable } from "@/shared/ui/data-table";

export type AccountingRow = {
  id: string;
  code: string;
  name: string;
  group: string;
  status: "activo" | "inactivo";
};

export function AccountingTable({ rows }: { rows: AccountingRow[] }) {
  return (
    <DataTable<AccountingRow>
      data={rows}
      getRowKey={(row) => row.id}
      columns={[
        { key: "code", header: "Código", render: (row) => <span className="font-mono text-xs">{row.code}</span> },
        { key: "name", header: "Nombre", render: (row) => <span className="font-semibold">{row.name}</span> },
        { key: "group", header: "Grupo", render: (row) => row.group },
        { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : "muted"}>{row.status}</Badge> }
      ]}
    />
  );
}
