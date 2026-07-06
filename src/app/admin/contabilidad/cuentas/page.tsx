import { CreateAccountButton } from "@/features/accounting/accounting-create";
import { AccountingTable } from "@/features/accounting/accounting-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function AccountsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Cuentas contables" description="Plan de cuentas consultado y creado directamente contra el sistema." actions={<CreateAccountButton />} />
      <AccountingTable resource="accounts" />
    </div>
  );
}
