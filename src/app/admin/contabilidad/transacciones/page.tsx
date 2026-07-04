import { TransactionsTable } from "@/features/accounting/transactions-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function TransactionsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Transacciones" description="Movimientos contables consultados con paginación real." actions={<Button>Nueva transacción</Button>} />
      <TransactionsTable />
    </div>
  );
}
