"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, XCircle } from "lucide-react";
import { cancelPatientAppointment, isAppointmentCancellable, listPatientAppointments, type PatientAppointmentRow } from "@/features/therapy/therapy.api";
import { AppointmentsCalendar } from "@/features/therapy/appointments-calendar";
import { contactHref, resolveContactPhone } from "@/features/landing/contact";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

function requestChangeMessage(row: PatientAppointmentRow) {
  return [
    "Hola, quiero solicitar un cambio en mi sesión.",
    `ID de sesión: ${row.id}`,
    `Fecha: ${row.date}`,
    `Servicio: ${row.service}`,
    `Terapeuta: ${row.therapist}`,
    `Estado actual: ${row.rawStatus}`
  ].join("\n");
}

export function PatientAppointmentsTable() {
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["patient-appointments", { page, pageSize: PAGE_SIZE }], queryFn: () => listPatientAppointments({ page, pageSize: PAGE_SIZE }) });
  const cancelMutation = useMutation({
    mutationFn: cancelPatientAppointment,
    onSuccess: () => {
      setError(null);
      void qc.invalidateQueries({ queryKey: ["patient-appointments"] });
    },
    onError: (mutationError) => setError(humanizeApiError(mutationError))
  });

  if (query.isLoading) return <LoadingState title="Consultando tus citas en el sistema" />;
  if (query.isError) return <ErrorState title="No se pudieron cargar tus citas" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />;

  const phone = resolveContactPhone();

  return query.data ? (
    <div className="grid gap-4">
      <AppointmentsCalendar
        title="Mi semana de citas"
        items={query.data.items.map((row) => ({ id: row.id, date: row.date, title: row.service, subtitle: row.therapist, status: row.status }))}
      />
      {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      <DataTable<PatientAppointmentRow>
        data={query.data.items}
        getRowKey={(row) => row.id}
        columns={[
          { key: "date", header: "Fecha", render: (row) => row.date },
          { key: "service", header: "Servicio", render: (row) => row.service },
          { key: "therapist", header: "Terapeuta", render: (row) => row.therapist },
          { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "pendiente" ? "warning" : "secondary"}>{row.status}</Badge> },
          {
            key: "actions",
            header: "Acciones",
            render: (row) =>
              isAppointmentCancellable(row.rawStatus) ? (
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={contactHref(phone, requestChangeMessage(row))} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4" /> Solicitar un cambio
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={cancelMutation.isPending}
                    onClick={() => {
                      if (window.confirm("¿Seguro que quieres cancelar esta sesión?")) cancelMutation.mutate(row.id);
                    }}
                  >
                    <XCircle className="h-4 w-4" /> Cancelar
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )
          }
        ]}
      />
      <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
    </div>
  ) : null;
}
