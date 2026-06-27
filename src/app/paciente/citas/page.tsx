import { Badge } from "@/shared/ui/badge";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

const rows = [
  { id: "cm-demo-1", fecha: "2026-07-02 15:00", servicio: "Orientación inicial", estado: "pendiente" }
];

export default function PatientAppointmentsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Mis citas" description="Listado preparado para conectarse a paginación server-side del backend." />
      <DataTable
        data={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "fecha", header: "Fecha", render: (row) => row.fecha },
          { key: "servicio", header: "Servicio", render: (row) => row.servicio },
          { key: "estado", header: "Estado", render: (row) => <Badge variant="warning">{row.estado}</Badge> }
        ]}
      />
    </div>
  );
}
