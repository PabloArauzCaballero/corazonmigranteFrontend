import { CreateTransactionButton } from "@/features/accounting/accounting-create";
import { TransactionsTable } from "@/features/accounting/transactions-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function TransactionsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Transacciones" description="Movimientos contables con partida doble." actions={<CreateTransactionButton />} />
      <TransactionsTable />
    </div>
  );
}
