"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  createMyBlockedTime,
  createMySchedule,
  deleteMyBlockedTime,
  deleteMySchedule,
  listMyBlockedTimes,
  listMySchedules,
  updateMyBlockedTime,
  updateMySchedule,
  type TherapistBlockedTimeRow,
  type TherapistScheduleRow
} from "@/features/therapy/therapy.api";
import {
  BlockedTimeEditModal,
  ScheduleEditModal,
  SELECT_CLASS,
  WEEKDAYS,
  browserTimezone,
  formatDateTime,
  readBlockedTimeForm,
  readScheduleForm,
  todayDate,
  type BlockedTimeFormValues,
  type ScheduleFormValues
} from "@/features/therapy/schedule-form";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { useConfirm } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";
import { useToast } from "@/shared/ui/toast";

const SCHEDULES_KEY = ["therapist", "schedules"];
const BLOCKS_KEY = ["therapist", "blocked-times"];

export function TherapistScheduleManager() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();

  const scheduleFormRef = useRef<HTMLFormElement>(null);
  const blockFormRef = useRef<HTMLFormElement>(null);
  const [editingSchedule, setEditingSchedule] = useState<TherapistScheduleRow | null>(null);
  const [editingBlock, setEditingBlock] = useState<TherapistBlockedTimeRow | null>(null);

  const schedules = useQuery({ queryKey: SCHEDULES_KEY, queryFn: listMySchedules });
  const blocks = useQuery({ queryKey: BLOCKS_KEY, queryFn: listMyBlockedTimes });

  const invalidateSchedules = () => queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
  const invalidateBlocks = () => queryClient.invalidateQueries({ queryKey: BLOCKS_KEY });

  const createSchedule = useMutation({
    mutationFn: (values: ScheduleFormValues) => createMySchedule(values),
    onSuccess: async () => {
      scheduleFormRef.current?.reset();
      await invalidateSchedules();
    }
  });

  const updateSchedule = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ScheduleFormValues }) => updateMySchedule(id, values),
    onSuccess: async () => {
      setEditingSchedule(null);
      toast({ variant: "success", title: "Horario actualizado" });
      await invalidateSchedules();
    }
  });

  const deleteSchedule = useMutation({
    mutationFn: (id: string) => deleteMySchedule(id),
    onSuccess: async () => {
      toast({ variant: "success", title: "Horario eliminado" });
      await invalidateSchedules();
    },
    onError: (error) => toast({ variant: "danger", title: "No se pudo eliminar", description: humanizeApiError(error) })
  });

  const createBlock = useMutation({
    mutationFn: (values: BlockedTimeFormValues) => createMyBlockedTime(values),
    onSuccess: async () => {
      blockFormRef.current?.reset();
      await invalidateBlocks();
    }
  });

  const updateBlock = useMutation({
    mutationFn: ({ id, values }: { id: string; values: BlockedTimeFormValues }) => updateMyBlockedTime(id, values),
    onSuccess: async () => {
      setEditingBlock(null);
      toast({ variant: "success", title: "Bloqueo actualizado" });
      await invalidateBlocks();
    }
  });

  const deleteBlock = useMutation({
    mutationFn: (id: string) => deleteMyBlockedTime(id),
    onSuccess: async () => {
      toast({ variant: "success", title: "Bloqueo eliminado" });
      await invalidateBlocks();
    },
    onError: (error) => toast({ variant: "danger", title: "No se pudo eliminar", description: humanizeApiError(error) })
  });

  function onCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createSchedule.mutate(readScheduleForm(new FormData(event.currentTarget)));
  }

  function onCreateBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createBlock.mutate(readBlockedTimeForm(new FormData(event.currentTarget)));
  }

  async function onDeleteSchedule(row: TherapistScheduleRow) {
    const confirmed = await confirm({
      title: `¿Eliminar el horario del ${row.weekdayLabel}?`,
      description: `${row.startTime} a ${row.endTime}. Dejará de ofrecerse en la reserva pública. Las citas ya agendadas no se cancelan.`,
      confirmLabel: "Eliminar horario",
      variant: "danger"
    });
    if (confirmed) deleteSchedule.mutate(row.id);
  }

  async function onDeleteBlock(row: TherapistBlockedTimeRow) {
    const confirmed = await confirm({
      title: "¿Eliminar el bloqueo?",
      description: `${formatDateTime(row.startAt)} — ${formatDateTime(row.endAt)}. El horario volverá a ofrecerse.`,
      confirmLabel: "Eliminar bloqueo",
      variant: "danger"
    });
    if (confirmed) deleteBlock.mutate(row.id);
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold">Nuevo horario recurrente</h2>
          <p className="mt-1 text-sm text-muted-foreground">Define los bloques base de atención por día de semana. El servidor rechaza solapamientos.</p>
          <form ref={scheduleFormRef} className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={onCreateSchedule}>
            <div className="grid gap-2">
              <Label htmlFor="new-weekday">Día de la semana</Label>
              <select id="new-weekday" name="weekday" required className={SELECT_CLASS}>
                {WEEKDAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-start">Hora inicio</Label>
              <Input id="new-start" name="startTime" type="time" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-end">Hora fin</Label>
              <Input id="new-end" name="endTime" type="time" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-timezone">Zona horaria</Label>
              <Input id="new-timezone" name="timezone" defaultValue={browserTimezone()} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-from">Vigente desde</Label>
              <Input id="new-from" name="effectiveFrom" type="date" defaultValue={todayDate()} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-to">Vigente hasta (opcional)</Label>
              <Input id="new-to" name="effectiveTo" type="date" />
            </div>
            {createSchedule.isError ? <p className="text-sm text-destructive md:col-span-3">{humanizeApiError(createSchedule.error)}</p> : null}
            {createSchedule.isSuccess ? <p className="text-sm font-semibold text-emerald-700 md:col-span-3">Horario creado correctamente.</p> : null}
            <div className="md:col-span-3">
              <Button type="submit" disabled={createSchedule.isPending}>
                {createSchedule.isPending ? "Creando..." : "Crear horario"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {schedules.isLoading ? <LoadingState title="Consultando horarios configurados" /> : null}
      {schedules.isError ? (
        <ErrorState
          title="No se pudieron cargar los horarios"
          description={humanizeApiError(schedules.error)}
          actionLabel="Reintentar"
          onAction={() => void schedules.refetch()}
        />
      ) : null}
      {schedules.data ? (
        schedules.data.length === 0 ? (
          <EmptyState title="Sin horarios configurados" description="Crea tu primer bloque de atención para que la disponibilidad pública pueda calcularse." />
        ) : (
          <DataTable<TherapistScheduleRow>
            data={schedules.data}
            getRowKey={(row) => row.id}
            columns={[
              { key: "weekday", header: "Día", render: (row) => <span className="font-semibold">{row.weekdayLabel}</span> },
              { key: "time", header: "Horario", render: (row) => `${row.startTime} - ${row.endTime}` },
              { key: "timezone", header: "Zona horaria", render: (row) => <Badge variant="secondary">{row.timezone}</Badge> },
              { key: "effectiveFrom", header: "Desde", render: (row) => row.effectiveFrom },
              { key: "effectiveTo", header: "Hasta", render: (row) => row.effectiveTo || "Indefinido" },
              {
                key: "status",
                header: "Estado",
                render: (row) => <Badge variant={row.status === "ACTIVE" ? "success" : "muted"}>{row.status === "ACTIVE" ? "activo" : "inactivo"}</Badge>
              },
              {
                key: "actions",
                header: "Acciones",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      title="Editar horario"
                      aria-label={`Editar el horario del ${row.weekdayLabel}`}
                      onClick={() => setEditingSchedule(row)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      title="Eliminar horario"
                      aria-label={`Eliminar el horario del ${row.weekdayLabel}`}
                      disabled={deleteSchedule.isPending}
                      onClick={() => void onDeleteSchedule(row)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )
              }
            ]}
          />
        )
      ) : null}

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold">Bloquear agenda</h2>
          <p className="mt-1 text-sm text-muted-foreground">Los bloqueos se descuentan del cálculo público de disponibilidad.</p>
          <form ref={blockFormRef} className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={onCreateBlock}>
            <div className="grid gap-2">
              <Label htmlFor="new-block-start">Inicio</Label>
              <Input id="new-block-start" name="startAt" type="datetime-local" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-block-end">Fin</Label>
              <Input id="new-block-end" name="endAt" type="datetime-local" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-block-reason">Motivo (opcional)</Label>
              <Input id="new-block-reason" name="reason" placeholder="Ej. supervisión clínica" />
            </div>
            {createBlock.isError ? <p className="text-sm text-destructive md:col-span-3">{humanizeApiError(createBlock.error)}</p> : null}
            {createBlock.isSuccess ? <p className="text-sm font-semibold text-emerald-700 md:col-span-3">Bloqueo registrado correctamente.</p> : null}
            <div className="md:col-span-3">
              <Button type="submit" variant="outline" disabled={createBlock.isPending}>
                {createBlock.isPending ? "Registrando..." : "Registrar bloqueo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {blocks.isLoading ? <LoadingState title="Consultando bloqueos de agenda" /> : null}
      {blocks.isError ? (
        <ErrorState
          title="No se pudieron cargar los bloqueos"
          description={humanizeApiError(blocks.error)}
          actionLabel="Reintentar"
          onAction={() => void blocks.refetch()}
        />
      ) : null}
      {blocks.data ? (
        blocks.data.length === 0 ? (
          <EmptyState title="Sin bloqueos registrados" description="Cuando necesites reservar tiempo fuera de consulta, regístralo aquí." />
        ) : (
          <DataTable<TherapistBlockedTimeRow>
            data={blocks.data}
            getRowKey={(row) => row.id}
            columns={[
              { key: "startAt", header: "Inicio", render: (row) => formatDateTime(row.startAt) },
              { key: "endAt", header: "Fin", render: (row) => formatDateTime(row.endAt) },
              { key: "reason", header: "Motivo", render: (row) => row.reason || "—" },
              {
                key: "actions",
                header: "Acciones",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <Button size="icon" variant="outline" title="Editar bloqueo" aria-label="Editar bloqueo" onClick={() => setEditingBlock(row)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      title="Eliminar bloqueo"
                      aria-label="Eliminar bloqueo"
                      disabled={deleteBlock.isPending}
                      onClick={() => void onDeleteBlock(row)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )
              }
            ]}
          />
        )
      ) : null}

      <ScheduleEditModal
        schedule={editingSchedule}
        pending={updateSchedule.isPending}
        errorMessage={updateSchedule.isError ? humanizeApiError(updateSchedule.error) : undefined}
        onClose={() => setEditingSchedule(null)}
        onSubmit={(values) => editingSchedule && updateSchedule.mutate({ id: editingSchedule.id, values })}
      />

      <BlockedTimeEditModal
        blockedTime={editingBlock}
        pending={updateBlock.isPending}
        errorMessage={updateBlock.isError ? humanizeApiError(updateBlock.error) : undefined}
        onClose={() => setEditingBlock(null)}
        onSubmit={(values) => editingBlock && updateBlock.mutate({ id: editingBlock.id, values })}
      />
    </div>
  );
}
