import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";

const sections = [
  { id: "hero", name: "Hero principal", page: "landing", status: "visible" },
  { id: "cta", name: "CTA final", page: "landing", status: "visible" },
  { id: "privacy", name: "Privacidad", page: "legal", status: "pendiente" }
];

export function PublicContentTable() {
  return (
    <DataTable
      data={sections}
      getRowKey={(row) => row.id}
      columns={[
        { key: "name", header: "Sección", render: (row) => <span className="font-semibold">{row.name}</span> },
        { key: "page", header: "Página", render: (row) => row.page },
        { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "visible" ? "success" : "warning"}>{row.status}</Badge> },
        { key: "actions", header: "Acciones", render: () => <Button size="sm" variant="outline">Editar</Button> }
      ]}
    />
  );
}
