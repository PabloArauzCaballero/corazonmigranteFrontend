import { CreateTransactionButton } from "@/features/accounting/accounting-create";
import { TransactionsTable } from "@/features/accounting/transactions-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function TransactionsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Transacciones y ventas" description="Aquí quedan registrados todos los movimientos de dinero: pagos, gastos y las ventas que se registran desde una cita ya pagada (sección Citas de los pacientes)." actions={<CreateTransactionButton />} />
      <TransactionsTable />
    </div>
  );
}
