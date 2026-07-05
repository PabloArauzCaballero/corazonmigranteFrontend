"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listTherapistAgenda, type TherapistAgendaRow } from "@/features/therapy/therapy.api";
import { AppointmentsCalendar } from "@/features/therapy/appointments-calendar";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

export function TherapistAgendaTable() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["therapist-agenda", { page, pageSize: PAGE_SIZE }],
    queryFn: () => listTherapistAgenda({ page, pageSize: PAGE_SIZE })
  });

  if (query.isLoading) return <LoadingState title="Consultando agenda asignada en el sistema" />;
  if (query.isError) return <ErrorState title="No se pudo cargar la agenda" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />;

  return query.data ? (
    <div className="grid gap-4">
      <AppointmentsCalendar
        title="Agenda semanal"
        items={query.data.items.map((row) => ({ id: row.id, date: row.date, title: row.patient, subtitle: row.service, status: row.status }))}
      />
      <DataTable<TherapistAgendaRow>
        data={query.data.items}
        getRowKey={(row) => row.id}
        emptyTitle="Sin citas asignadas"
        emptyDescription="No hay citas para la agenda del terapeuta en esta página."
        columns={[
          { key: "date", header: "Fecha", render: (row) => row.date },
          { key: "time", header: "Hora", render: (row) => row.time },
          { key: "patient", header: "Paciente", render: (row) => <span className="font-semibold">{row.patient}</span> },
          { key: "service", header: "Servicio", render: (row) => row.service },
          { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "pendiente" ? "warning" : "secondary"}>{row.status}</Badge> }
        ]}
      />
      <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
    </div>
  ) : null;
}
