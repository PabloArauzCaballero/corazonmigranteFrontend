"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CircleDollarSign, Pencil, ReceiptText, Search, X } from "lucide-react";
import { listAppointmentRequests, updateAdminAppointment, updateAppointmentPayment, type AppointmentRequestRow } from "@/features/therapy/therapy.api";
import { listBookingProducts, listBookingTherapists } from "@/features/booking/booking.api";
import { createSaleFromAppointment, listAccountingRows } from "@/features/accounting/accounting.api";
import { AppointmentsCalendar } from "@/features/therapy/appointments-calendar";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { DataTable, DataTableSkeleton, PaginationBar } from "@/shared/ui/data-table";
import { TableShell } from "@/shared/ui/table-shell";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "REQUESTED", label: "Pendiente de confirmación" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED_BY_PATIENT", label: "Cancelada por paciente" },
  { value: "CANCELLED_BY_ADMIN", label: "Cancelada por admin" },
  { value: "CANCELLED_BY_THERAPIST", label: "Cancelada por terapeuta" },
  { value: "NO_SHOW", label: "No se presentó" },
];

type StatusBadgeVariant = "warning" | "success" | "muted" | "danger" | "secondary" | "default";

function statusBadge(rawStatus: string): { label: string; variant: StatusBadgeVariant } {
  switch (rawStatus) {
    case "REQUESTED": return { label: "Pendiente", variant: "warning" };
    case "CONFIRMED": return { label: "Confirmada", variant: "success" };
    case "COMPLETED": return { label: "Completada", variant: "muted" };
    case "CANCELLED_BY_PATIENT":
    case "CANCELLED_BY_ADMIN":
    case "CANCELLED_BY_THERAPIST": return { label: "Cancelada", variant: "danger" };
    case "NO_SHOW": return { label: "No se presentó", variant: "danger" };
    default: return { label: rawStatus, variant: "secondary" };
  }
}

function toDatetimeLocal(iso: string) {
  const date = iso ? new Date(iso) : undefined;
  if (!date || Number.isNaN(date.getTime())) return "";
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function EditAppointmentPanel({ row, onClose }: { row: AppointmentRequestRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [therapistUserId, setTherapistUserId] = useState(row.therapistUserId);
  const [productId, setProductId] = useState(row.productId);
  const [scheduledStartAt, setScheduledStartAt] = useState(toDatetimeLocal(row.scheduledStartAt));
  const [status, setStatus] = useState(row.rawStatus);
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const therapists = useQuery({ queryKey: ["admin-appointments-therapists"], queryFn: () => listBookingTherapists({ canUseAdminDirectory: true }) });
  const products = useQuery({ queryKey: ["admin-appointments-products"], queryFn: listBookingProducts });

  const mutation = useMutation({
    mutationFn: () =>
      updateAdminAppointment(row.id, {
        therapistUserId: therapistUserId !== row.therapistUserId ? therapistUserId : undefined,
        productId: productId !== row.productId ? productId : undefined,
        scheduledStartAt: scheduledStartAt && scheduledStartAt !== toDatetimeLocal(row.scheduledStartAt) ? new Date(scheduledStartAt).toISOString() : undefined,
        status: status !== row.rawStatus ? status : undefined,
        adminNotes: adminNotes || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["appointment-requests"] });
      onClose();
    },
    onError: (e) => setError(humanizeApiError(e)),
  });

  return (
    <div className="animate-slide-up-fade grid gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Editar cita — {row.patient}</h3>
        <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Terapeuta</Label>
          <select className="h-11 w-full rounded-xl border bg-background px-3 text-sm" value={therapistUserId} onChange={(e) => setTherapistUserId(e.target.value)}>
            {!therapists.data?.some((t) => t.id === therapistUserId) && therapistUserId ? <option value={therapistUserId}>{row.therapist}</option> : null}
            {(therapists.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Servicio</Label>
          <select className="h-11 w-full rounded-xl border bg-background px-3 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}>
            {!products.data?.some((p) => p.id === productId) && productId ? <option value={productId}>{row.service}</option> : null}
            {(products.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Fecha y hora</Label>
          <Input type="datetime-local" value={scheduledStartAt} onChange={(e) => setScheduledStartAt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <select className="h-11 w-full rounded-xl border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.filter(o => o.value).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nota interna del administrador (opcional)</Label>
        <Input placeholder="Ej: Paciente llamó para confirmar..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>Guardar cambios</Button>
      </div>
    </div>
  );
}

function QuickConfirmButton({ row }: { row: AppointmentRequestRow }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => updateAdminAppointment(row.id, { status: "CONFIRMED" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["appointment-requests"] }),
  });
  if (row.rawStatus !== "REQUESTED") return null;
  return (
    <Button size="sm" variant="default" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      <Check className="h-4 w-4" /> Confirmar
    </Button>
  );
}

function TogglePaymentButton({ row }: { row: AppointmentRequestRow }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => updateAppointmentPayment(row.id, !row.isPaid),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["appointment-requests"] }),
  });
  return (
    <Button size="sm" variant={row.isPaid ? "outline" : "secondary"} disabled={mutation.isPending || Boolean(row.saleTransactionId)} onClick={() => mutation.mutate()} title={row.saleTransactionId ? "Ya tiene venta registrada" : undefined}>
      <CircleDollarSign className="h-4 w-4" /> {row.isPaid ? "Quitar pago" : "Marcar pagada"}
    </Button>
  );
}

function RegisterSaleDialog({ row, onClose }: { row: AppointmentRequestRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [debitAccountId, setDebitAccountId] = useState("");
  const [creditAccountId, setCreditAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const accounts = useQuery({ queryKey: ["accounting-accounts-for-sale"], queryFn: () => listAccountingRows("accounts", { page: 1, pageSize: 200 }) });
  const mutation = useMutation({
    mutationFn: () => createSaleFromAppointment(row.id, { debitAccountId, creditAccountId, description: `Venta - cita con ${row.patient} - ${row.service}` }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["appointment-requests"] }); onClose(); },
    onError: (e) => setError(humanizeApiError(e)),
  });
  return (
    <div className="animate-slide-up-fade grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-emerald-900">Registrar venta contable</h3>
        <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <p className="text-sm text-emerald-800">Monto: <strong>{row.price}</strong> por <strong>{row.service}</strong> con <strong>{row.patient}</strong>.</p>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Cuenta donde entra el dinero (Caja o Banco)</Label>
          <select className="h-11 w-full rounded-xl border bg-white px-3 text-sm" value={debitAccountId} onChange={(e) => setDebitAccountId(e.target.value)}>
            <option value="" disabled>{accounts.isLoading ? "Cargando..." : "Selecciona cuenta"}</option>
            {(accounts.data?.items ?? []).map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Cuenta de ingresos (Ventas de servicios)</Label>
          <select className="h-11 w-full rounded-xl border bg-white px-3 text-sm" value={creditAccountId} onChange={(e) => setCreditAccountId(e.target.value)}>
            <option value="" disabled>{accounts.isLoading ? "Cargando..." : "Selecciona cuenta"}</option>
            {(accounts.data?.items ?? []).map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button disabled={mutation.isPending || !debitAccountId || !creditAccountId} onClick={() => mutation.mutate()}>Registrar venta</Button>
      </div>
    </div>
  );
}

export function RequestsTable() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "REQUESTED");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [registeringSaleId, setRegisteringSaleId] = useState<string | null>(null);

  useEffect(() => {
    const s = searchParams.get("status");
    if (s) setStatusFilter(s);
  }, [searchParams]);

  const query = useQuery({
    queryKey: ["appointment-requests", { page, pageSize: PAGE_SIZE, search, status: statusFilter }],
    queryFn: () => listAppointmentRequests({ page, pageSize: PAGE_SIZE, search: search || undefined, status: statusFilter || undefined }),
  });

  if (query.isLoading) return <DataTableSkeleton columns={6} rows={8} />;
  if (query.isError) return <ErrorState title="No se pudieron cargar las citas" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />;

  const editingRow = query.data?.items.find((r) => r.id === editingId);
  const registeringSaleRow = query.data?.items.find((r) => r.id === registeringSaleId);
  const pendingCount = query.data?.items.filter((r) => r.rawStatus === "REQUESTED").length ?? 0;

  const filtersBar = (
    <>
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por paciente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      <select
        className="h-10 rounded-xl border bg-background px-3 text-sm"
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
      >
        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {statusFilter === "REQUESTED" && pendingCount > 0 && (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""} en esta página
        </span>
      )}
    </>
  );

  return (
    <div className="grid gap-5">
      {/* Calendario */}
      {query.data && (
        <AppointmentsCalendar
          title="Vista semanal"
          items={query.data.items.map((r) => ({ id: r.id, date: r.scheduledStartAt || r.date, title: r.patient, subtitle: r.service, status: r.status }))}
        />
      )}

      {/* Paneles de edición */}
      {editingRow && <EditAppointmentPanel row={editingRow} onClose={() => setEditingId(null)} />}
      {registeringSaleRow && <RegisterSaleDialog row={registeringSaleRow} onClose={() => setRegisteringSaleId(null)} />}

      {/* Tabla */}
      {query.data && (
        <TableShell
          filters={filtersBar}
          footer={
            <PaginationBar page={query.data.page} totalPages={query.data.totalPages} loading={query.isFetching} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(query.data.totalPages, p + 1))} onGoTo={(p) => setPage(p)} />
          }
        >
          <DataTable<AppointmentRequestRow>
            data={query.data.items}
            getRowKey={(r) => r.id}
            emptyTitle="Sin citas"
            emptyDescription={statusFilter === "REQUESTED" ? "No hay citas pendientes de confirmación. ¡Todo al día!" : "Ajusta los filtros para ver resultados."}
            columns={[
              {
                key: "patient",
                header: "Paciente",
                render: (r) => (
                  <div>
                    <p className="font-semibold">{r.patient}</p>
                    <p className="text-xs text-muted-foreground">{r.service}</p>
                  </div>
                ),
              },
              { key: "therapist", header: "Terapeuta", render: (r) => <span className="text-sm">{r.therapist}</span> },
              {
                key: "date",
                header: "Fecha y hora",
                render: (r) => (
                  <div>
                    <p className="text-sm font-medium">{r.date}</p>
                    {r.time !== "—" && <p className="text-xs text-muted-foreground">{r.time}</p>}
                  </div>
                ),
              },
              {
                key: "status",
                header: "Estado",
                render: (r) => {
                  const { label, variant } = statusBadge(r.rawStatus);
                  return <Badge variant={variant}>{label}</Badge>;
                },
              },
              {
                key: "payment",
                header: "Pago",
                render: (r) => (
                  <div className="flex flex-col gap-1">
                    <Badge variant={r.isPaid ? "success" : "muted"}>{r.isPaid ? "Pagada" : "No pagada"}</Badge>
                    {r.saleTransactionId && <span className="text-xs text-muted-foreground">Venta registrada</span>}
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Acciones",
                render: (r) => (
                  <div className="flex flex-wrap gap-2">
                    <QuickConfirmButton row={r} />
                    <Button size="sm" variant="outline" onClick={() => setEditingId(r.id)}>
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <TogglePaymentButton row={r} />
                    {r.isPaid && !r.saleTransactionId && (
                      <Button size="sm" variant="outline" onClick={() => setRegisteringSaleId(r.id)}>
                        <ReceiptText className="h-4 w-4" /> Venta
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </TableShell>
      )}
    </div>
  );
}
