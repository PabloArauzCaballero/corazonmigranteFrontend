import { CreateAccountGroupButton } from "@/features/accounting/accounting-create";
import { AccountingTable } from "@/features/accounting/accounting-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function AccountGroupsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Grupos de cuenta" description="Catálogo contable con paginación server-side." actions={<CreateAccountGroupButton />} />
      <AccountingTable resource="accountGroups" />
    </div>
  );
}
