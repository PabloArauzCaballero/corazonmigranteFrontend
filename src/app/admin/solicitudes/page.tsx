import { RequestsTable } from "@/features/therapy/requests-table";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function AdminRequestsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Solicitudes de cita" description="Gestión de solicitudes con estados controlados, sin exponer información sensible innecesaria." actions={<Button asChild><Link href="/admin/booking">Nueva cita</Link></Button>} />
      <RequestsTable />
    </div>
  );
}
