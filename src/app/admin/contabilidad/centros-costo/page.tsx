import { CreateCostCenterButton } from "@/features/accounting/accounting-create";
import { AccountingTable } from "@/features/accounting/accounting-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function CostCentersPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Centros de costo" description="Son las áreas o proyectos internos (por ejemplo, un departamento) a los que se les puede asignar un ingreso o un gasto." actions={<CreateCostCenterButton />} />
      <AccountingTable resource="costCenters" />
    </div>
  );
}
