import { AccountingTable } from "@/features/accounting/accounting-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function CostCentersPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Centros de costo" description="Centros usados para clasificar operaciones y reportes, leídos del backend." actions={<Button>Crear centro</Button>} />
      <AccountingTable resource="costCenters" />
    </div>
  );
}
