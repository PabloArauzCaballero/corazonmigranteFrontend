import { CreateCostCenterButton } from "@/features/accounting/accounting-create";
import { AccountingTable } from "@/features/accounting/accounting-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function CostCentersPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Centros de costo" description="Centros usados para clasificar operaciones y reportes." actions={<CreateCostCenterButton />} />
      <AccountingTable resource="costCenters" />
    </div>
  );
}
