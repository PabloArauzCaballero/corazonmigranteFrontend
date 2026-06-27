"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";

const requests = [
  { id: "s-1", paciente: "Paciente Demo", servicio: "Orientación inicial", fecha: "2026-07-02 15:00", estado: "solicitada" },
  { id: "s-2", paciente: "Paciente Demo 2", servicio: "Acompañamiento", fecha: "2026-07-03 10:00", estado: "pendiente" }
];

export function RequestsTable() {
  return (
    <DataTable
      data={requests}
      getRowKey={(row) => row.id}
      columns={[
        { key: "paciente", header: "Paciente", render: (row) => <span className="font-semibold">{row.paciente}</span> },
        { key: "servicio", header: "Servicio", render: (row) => row.servicio },
        { key: "fecha", header: "Fecha", render: (row) => row.fecha },
        { key: "estado", header: "Estado", render: (row) => <Badge variant="warning">{row.estado}</Badge> },
        { key: "acciones", header: "Acciones", render: () => <Button size="sm" variant="outline">Revisar</Button> }
      ]}
    />
  );
}
