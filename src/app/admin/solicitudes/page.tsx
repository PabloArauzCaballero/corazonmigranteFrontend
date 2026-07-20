import { RequestsTable } from "@/features/therapy/requests-table";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function AdminRequestsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Citas de los pacientes" description="Aquí ves todas las citas que los pacientes han pedido. Puedes confirmarlas, cancelarlas, marcar si ya se pagaron y registrar la venta en contabilidad." actions={<Button asChild><Link href="/admin/booking">Agendar una cita nueva</Link></Button>} />
      <RequestsTable />
    </div>
  );
}
