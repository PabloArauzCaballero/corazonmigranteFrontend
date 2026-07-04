import { TherapistAgendaTable } from "@/features/therapy/therapist-agenda-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function TherapistAgendaPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Agenda" description="Agenda asignada al terapeuta, consultada con paginación real." />
      <TherapistAgendaTable />
    </div>
  );
}
