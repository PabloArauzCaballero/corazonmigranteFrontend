import { AccountingTable } from "@/features/accounting/accounting-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

const rows = [
  { id: "c-1", code: "1.1.01", name: "Caja", group: "Activo corriente", status: "activo" as const },
  { id: "c-2", code: "4.1.01", name: "Ingresos por servicios", group: "Ingresos", status: "activo" as const }
];

export default function AccountsPage() {
  return <div className="grid gap-6"><PageHeader title="Cuentas contables" description="No filtrar localmente sobre datasets parciales; usar query params del backend." actions={<Button>Crear cuenta</Button>} /><AccountingTable rows={rows} /></div>;
}
