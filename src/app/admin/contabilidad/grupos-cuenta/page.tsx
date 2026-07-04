import { AccountingTable } from "@/features/accounting/accounting-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function AccountGroupsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Grupos de cuenta" description="Catálogo contable con paginación server-side." actions={<Button>Crear grupo</Button>} />
      <AccountingTable resource="accountGroups" />
    </div>
  );
}
