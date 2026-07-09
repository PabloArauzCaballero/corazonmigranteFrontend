"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { listAppointmentRequests, updateAdminAppointment, type AppointmentRequestRow } from "@/features/therapy/therapy.api";
import { listBookingProducts, listBookingTherapists } from "@/features/booking/booking.api";
import { AppointmentsCalendar } from "@/features/therapy/appointments-calendar";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "REQUESTED", label: "Solicitada" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED_BY_PATIENT", label: "Cancelada por paciente" },
  { value: "CANCELLED_BY_ADMIN", label: "Cancelada por admin" },
  { value: "CANCELLED_BY_THERAPIST", label: "Cancelada por terapeuta" },
  { value: "NO_SHOW", label: "No se presentó" }
];

function toDatetimeLocal(iso: string) {
  const date = iso ? new Date(iso) : undefined;
  if (!date || Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function EditAppointmentPanel({ row, onClose }: { row: AppointmentRequestRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [therapistUserId, setTherapistUserId] = useState(row.therapistUserId);
  const [productId, setProductId] = useState(row.productId);
  const [scheduledStartAt, setScheduledStartAt] = useState(toDatetimeLocal(row.scheduledStartAt));
  const [status, setStatus] = useState(row.rawStatus);
  const [error, setError] = useState<string | null>(null);

  const therapists = useQuery({ queryKey: ["admin-appointments-therapists"], queryFn: () => listBookingTherapists({ canUseAdminDirectory: true }) });
  const products = useQuery({ queryKey: ["admin-appointments-products"], queryFn: listBookingProducts });

  const mutation = useMutation({
    mutationFn: () =>
      updateAdminAppointment(row.id, {
        therapistUserId: therapistUserId !== row.therapistUserId ? therapistUserId : undefined,
        productId: productId !== row.productId ? productId : undefined,
        scheduledStartAt: scheduledStartAt && scheduledStartAt !== toDatetimeLocal(row.scheduledStartAt) ? new Date(scheduledStartAt).toISOString() : undefined,
        status: status !== row.rawStatus ? status : undefined
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointment-requests"] });
      onClose();
    },
    onError: (mutationError) => setError(humanizeApiError(mutationError))
  });

  return (
    <div className="grid gap-4 border border-teal-900/20 bg-teal-900/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-950">Editar sesión</h3>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Terapeuta</Label>
          <select className="h-11 w-full rounded-[14px] border bg-background px-3 text-sm" value={therapistUserId} onChange={(event) => setTherapistUserId(event.target.value)}>
            {!therapists.data?.some((therapist) => therapist.id === therapistUserId) && therapistUserId ? <option value={therapistUserId}>{row.therapist}</option> : null}
            {(therapists.data ?? []).map((therapist) => (
              <option key={therapist.id} value={therapist.id}>{therapist.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Producto</Label>
          <select className="h-11 w-full rounded-[14px] border bg-background px-3 text-sm" value={productId} onChange={(event) => setProductId(event.target.value)}>
            {!products.data?.some((product) => product.id === productId) && productId ? <option value={productId}>{row.service}</option> : null}
            {(products.data ?? []).map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Fecha y hora</Label>
          <Input type="datetime-local" value={scheduledStartAt} onChange={(event) => setScheduledStartAt(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <select className="h-11 w-full rounded-[14px] border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>Guardar cambios</Button>
      </div>
    </div>
  );
}

export function RequestsTable() {
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["appointment-requests", { page, pageSize: PAGE_SIZE }], queryFn: () => listAppointmentRequests({ page, pageSize: PAGE_SIZE }) });

  if (query.isLoading) return <LoadingState title="Consultando solicitudes en el sistema" />;
  if (query.isError) return <ErrorState title="No se pudieron cargar las solicitudes" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />;

  const editingRow = query.data?.items.find((row) => row.id === editingId);

  return query.data ? (
    <div className="grid gap-4">
      <AppointmentsCalendar
        title="Solicitudes de la semana"
        items={query.data.items.map((row) => ({ id: row.id, date: row.scheduledStartAt || row.date, title: row.patient, subtitle: row.service, status: row.status }))}
      />
      {editingRow ? <EditAppointmentPanel row={editingRow} onClose={() => setEditingId(null)} /> : null}
      <DataTable<AppointmentRequestRow>
        data={query.data.items}
        getRowKey={(row) => row.id}
        columns={[
          { key: "patient", header: "Paciente", render: (row) => <span className="font-semibold">{row.patient}</span> },
          { key: "therapist", header: "Terapeuta", render: (row) => row.therapist },
          { key: "date", header: "Horario", render: (row) => <span>{row.date}{row.time !== "—" ? <span className="text-muted-foreground"> · {row.time}</span> : null}</span> },
          { key: "service", header: "Producto", render: (row) => row.service },
          { key: "approach", header: "Enfoque", render: (row) => row.approach },
          { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "pendiente" ? "warning" : "secondary"}>{row.status}</Badge> },
          {
            key: "actions",
            header: "Acciones",
            render: (row) => (
              <Button size="sm" variant="outline" onClick={() => setEditingId(row.id)}>
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            )
          }
        ]}
      />
      <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
    </div>
  ) : null;
}
