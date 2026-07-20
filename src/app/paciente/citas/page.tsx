import { PatientAppointmentsTable } from "@/features/therapy/patient-appointments-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function PatientAppointmentsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Mis citas" description="Listado conectado al sistema con paginación real." />
      <PatientAppointmentsTable />
    </div>
  );
}
