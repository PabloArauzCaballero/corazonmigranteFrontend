import { AccountingTable } from "@/features/accounting/accounting-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

const rows = [{ id: "cc-1", code: "CM-OPS", name: "Operaciones", group: "Centro", status: "activo" as const }];

export default function CostCentersPage() {
  return <div className="grid gap-6"><PageHeader title="Centros de costo" description="Centros usados para clasificar operaciones y reportes." actions={<Button>Crear centro</Button>} /><AccountingTable rows={rows} /></div>;
}
