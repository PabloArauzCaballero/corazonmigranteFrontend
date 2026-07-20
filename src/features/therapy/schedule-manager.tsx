"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { humanizeApiError } from "@/shared/api/errors";
import { getString, isRecord, normalizePaginatedResponse } from "@/shared/api/normalizers";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { DataTable } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/state";

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type ScheduleRow = {
  id: string;
  weekday: string;
  startTime: string;
  endTime: string;
  timezone: string;
  effectiveFrom: string;
  effectiveTo: string;
};

function mapSchedule(item: unknown, index: number): ScheduleRow {
  const record = isRecord(item) ? item : {};
  const weekdayRaw = getString(record, ["weekday", "dia", "dia_semana"], "");
  const weekdayIndex = Number(weekdayRaw);
  return {
    id: getString(record, ["id", "schedule_id", "uuid"], `horario-${index + 1}`),
    weekday: Number.isInteger(weekdayIndex) && WEEKDAYS[weekdayIndex] ? WEEKDAYS[weekdayIndex] : weekdayRaw || "—",
    startTime: getString(record, ["startTime", "start_time", "hora_inicio"], "—"),
    endTime: getString(record, ["endTime", "end_time", "hora_fin"], "—"),
    timezone: getString(record, ["timezone", "timeZone", "zonaHoraria"], "America/La_Paz"),
    effectiveFrom: getString(record, ["effectiveFrom", "effective_from", "vigente_desde"], "—"),
    effectiveTo: getString(record, ["effectiveTo", "effective_to", "vigente_hasta"], "")
  };
}

async function listSchedules() {
  const payload = await apiRequest<unknown>(ENDPOINTS.therapy.therapistSchedules);
  return normalizePaginatedResponse(payload, mapSchedule, { page: 1, pageSize: 100 }).items;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/La_Paz";
  } catch {
    return "America/La_Paz";
  }
}

export function TherapistScheduleManager() {
  const queryClient = useQueryClient();
  const schedules = useQuery({ queryKey: ["therapist", "schedules"], queryFn: listSchedules });

  const createSchedule = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<unknown>(ENDPOINTS.therapy.therapistSchedules, { method: "POST", body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["therapist", "schedules"] });
    }
  });

  const createBlock = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<unknown>(ENDPOINTS.therapy.therapistBlockedTimes, { method: "POST", body })
  });

  function onCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const effectiveTo = String(form.get("effectiveTo") ?? "").trim();
    createSchedule.mutate({
      weekday: Number(form.get("weekday")),
      startTime: String(form.get("startTime") ?? ""),
      endTime: String(form.get("endTime") ?? ""),
      timezone: String(form.get("timezone") ?? browserTimezone()),
      effectiveFrom: String(form.get("effectiveFrom") ?? todayDate()),
      ...(effectiveTo ? { effectiveTo } : {})
    });
  }

  function onCreateBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    const startAt = String(form.get("startAt") ?? "");
    const endAt = String(form.get("endAt") ?? "");
    createBlock.mutate({
      startAt: startAt ? new Date(startAt).toISOString() : startAt,
      endAt: endAt ? new Date(endAt).toISOString() : endAt,
      ...(reason ? { reason } : {})
    });
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold">Nuevo horario recurrente</h2>
          <p className="mt-1 text-sm text-muted-foreground">Define los bloques base de atención por día de semana. El servidor rechaza solapamientos.</p>
          <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={onCreateSchedule}>
            <div className="grid gap-2">
              <Label>Día de la semana</Label>
              <select name="weekday" required className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                {WEEKDAYS.map((day, index) => (
                  <option key={day} value={index}>{day}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2"><Label>Hora inicio</Label><Input name="startTime" type="time" required /></div>
            <div className="grid gap-2"><Label>Hora fin</Label><Input name="endTime" type="time" required /></div>
            <div className="grid gap-2"><Label>Zona horaria</Label><Input name="timezone" defaultValue={browserTimezone()} required /></div>
            <div className="grid gap-2"><Label>Vigente desde</Label><Input name="effectiveFrom" type="date" defaultValue={todayDate()} required /></div>
            <div className="grid gap-2"><Label>Vigente hasta (opcional)</Label><Input name="effectiveTo" type="date" /></div>
            {createSchedule.isError ? <p className="text-sm text-destructive md:col-span-3">{humanizeApiError(createSchedule.error)}</p> : null}
            {createSchedule.isSuccess ? <p className="text-sm font-semibold text-emerald-700 md:col-span-3">Horario creado correctamente.</p> : null}
            <div className="md:col-span-3"><Button type="submit" disabled={createSchedule.isPending}>{createSchedule.isPending ? "Creando..." : "Crear horario"}</Button></div>
          </form>
        </CardContent>
      </Card>

      {schedules.isLoading ? <LoadingState title="Consultando horarios configurados" /> : null}
      {schedules.isError ? <ErrorState title="No se pudieron cargar los horarios" description={humanizeApiError(schedules.error)} actionLabel="Reintentar" onAction={() => void schedules.refetch()} /> : null}
      {schedules.data ? (
        schedules.data.length === 0 ? (
          <EmptyState title="Sin horarios configurados" description="Crea tu primer bloque de atención para que la disponibilidad pública pueda calcularse." />
        ) : (
          <DataTable<ScheduleRow>
            data={schedules.data}
            getRowKey={(row) => row.id}
            columns={[
              { key: "weekday", header: "Día", render: (row) => <span className="font-semibold">{row.weekday}</span> },
              { key: "startTime", header: "Inicio", render: (row) => row.startTime },
              { key: "endTime", header: "Fin", render: (row) => row.endTime },
              { key: "timezone", header: "Zona horaria", render: (row) => <Badge variant="secondary">{row.timezone}</Badge> },
              { key: "effectiveFrom", header: "Desde", render: (row) => row.effectiveFrom },
              { key: "effectiveTo", header: "Hasta", render: (row) => row.effectiveTo || "Indefinido" }
            ]}
          />
        )
      ) : null}

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold">Bloquear agenda</h2>
          <p className="mt-1 text-sm text-muted-foreground">Los bloqueos se descuentan del cálculo público de disponibilidad.</p>
          <form className="mt-5 grid gap-4 md:grid-cols-3" onSubmit={onCreateBlock}>
            <div className="grid gap-2"><Label>Inicio</Label><Input name="startAt" type="datetime-local" required /></div>
            <div className="grid gap-2"><Label>Fin</Label><Input name="endAt" type="datetime-local" required /></div>
            <div className="grid gap-2"><Label>Motivo (opcional)</Label><Input name="reason" placeholder="Ej. supervisión clínica" /></div>
            {createBlock.isError ? <p className="text-sm text-destructive md:col-span-3">{humanizeApiError(createBlock.error)}</p> : null}
            {createBlock.isSuccess ? <p className="text-sm font-semibold text-emerald-700 md:col-span-3">Bloqueo registrado correctamente.</p> : null}
            <div className="md:col-span-3"><Button type="submit" variant="outline" disabled={createBlock.isPending}>{createBlock.isPending ? "Registrando..." : "Registrar bloqueo"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
