import { AccountingTable } from "@/features/accounting/accounting-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function AccountsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Cuentas contables" description="Búsqueda y paginación resueltas contra el backend, no sobre filas locales." actions={<Button>Crear cuenta</Button>} />
      <AccountingTable resource="accounts" />
    </div>
  );
}
