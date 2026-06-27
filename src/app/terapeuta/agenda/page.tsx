import { Badge } from "@/shared/ui/badge";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

const agenda = [{ id: "a-1", hora: "15:00", paciente: "Paciente asignado", estado: "pendiente" }];

export default function TherapistAgendaPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Agenda" description="Vista preparada para agenda asignada y acciones permitidas por rol terapeuta." />
      <DataTable
        data={agenda}
        getRowKey={(row) => row.id}
        columns={[
          { key: "hora", header: "Hora", render: (row) => row.hora },
          { key: "paciente", header: "Paciente", render: (row) => row.paciente },
          { key: "estado", header: "Estado", render: (row) => <Badge variant="warning">{row.estado}</Badge> }
        ]}
      />
    </div>
  );
}
