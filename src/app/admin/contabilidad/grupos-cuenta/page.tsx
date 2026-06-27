import { AccountingTable } from "@/features/accounting/accounting-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

const rows = [{ id: "g-1", code: "1.1", name: "Activo corriente", group: "Activo", status: "activo" as const }];

export default function AccountGroupsPage() {
  return <div className="grid gap-6"><PageHeader title="Grupos de cuenta" description="Catálogo contable con paginación server-side." actions={<Button>Crear grupo</Button>} /><AccountingTable rows={rows} /></div>;
}
