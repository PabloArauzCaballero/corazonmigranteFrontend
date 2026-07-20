import { CreateAccountButton } from "@/features/accounting/accounting-create";
import { AccountingTable } from "@/features/accounting/accounting-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function AccountsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Cuentas contables" description="El listado de cuentas que usa el sistema para clasificar el dinero que entra y sale (por ejemplo: caja, banco, ventas)." actions={<CreateAccountButton />} />
      <AccountingTable resource="accounts" />
    </div>
  );
}
