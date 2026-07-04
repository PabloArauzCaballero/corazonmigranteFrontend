"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listPatientAppointments, type PatientAppointmentRow } from "@/features/therapy/therapy.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

export function PatientAppointmentsTable() {
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ["patient-appointments", { page, pageSize: PAGE_SIZE }], queryFn: () => listPatientAppointments({ page, pageSize: PAGE_SIZE }) });

  if (query.isLoading) return <LoadingState title="Consultando tus citas en el sistema" />;
  if (query.isError) return <ErrorState title="No se pudieron cargar tus citas" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />;

  return query.data ? (
    <div className="grid gap-4">
      <DataTable<PatientAppointmentRow>
        data={query.data.items}
        getRowKey={(row) => row.id}
        columns={[
          { key: "date", header: "Fecha", render: (row) => row.date },
          { key: "service", header: "Servicio", render: (row) => row.service },
          { key: "therapist", header: "Terapeuta", render: (row) => row.therapist },
          { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "pendiente" ? "warning" : "secondary"}>{row.status}</Badge> }
        ]}
      />
      <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
    </div>
  ) : null;
}
