"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";

export type CatalogRow = {
  id: string;
  name: string;
  type: string;
  status: "activo" | "inactivo";
};

export function CatalogTable({ rows }: { rows: CatalogRow[] }) {
  return (
    <DataTable<CatalogRow>
      data={rows}
      getRowKey={(row) => row.id}
      columns={[
        { key: "name", header: "Nombre", render: (row) => <span className="font-semibold">{row.name}</span> },
        { key: "type", header: "Tipo", render: (row) => row.type },
        { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : "muted"}>{row.status}</Badge> },
        { key: "actions", header: "Acciones", render: () => <Button size="sm" variant="outline">Editar</Button> }
      ]}
    />
  );
}
