"use client";

import { type FormEvent } from "react";
import type { TherapistBlockedTimeRow, TherapistScheduleRow } from "@/features/therapy/therapy.api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Modal } from "@/shared/ui/modal";

export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const SELECT_CLASS =
  "focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-surface-raised px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50";

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/La_Paz";
  } catch {
    return "America/La_Paz";
  }
}

/**
 * `datetime-local` necesita `YYYY-MM-DDTHH:mm` en hora local; el backend devuelve
 * ISO en UTC. Sin esta conversión el formulario de edición abre en blanco.
 */
export function toLocalInputValue(isoDate: string) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function formatDateTime(isoDate: string) {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export type ScheduleFormValues = {
  weekday: number;
  startTime: string;
  endTime: string;
  timezone: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export function readScheduleForm(form: FormData): ScheduleFormValues {
  const effectiveTo = String(form.get("effectiveTo") ?? "").trim();
  return {
    weekday: Number(form.get("weekday")),
    startTime: String(form.get("startTime") ?? ""),
    endTime: String(form.get("endTime") ?? ""),
    timezone: String(form.get("timezone") ?? browserTimezone()),
    effectiveFrom: String(form.get("effectiveFrom") ?? todayDate()),
    ...(effectiveTo ? { effectiveTo } : {}),
    ...(form.get("status") ? { status: String(form.get("status")) as "ACTIVE" | "INACTIVE" } : {})
  };
}

/** Edición de un horario existente. El alta usa el formulario en línea de cada pantalla. */
export function ScheduleEditModal({
  schedule,
  onClose,
  onSubmit,
  pending,
  errorMessage
}: {
  schedule: TherapistScheduleRow | null;
  onClose: () => void;
  onSubmit: (values: ScheduleFormValues) => void;
  pending?: boolean;
  errorMessage?: string;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(readScheduleForm(new FormData(event.currentTarget)));
  }

  return (
    <Modal
      open={Boolean(schedule)}
      onClose={onClose}
      title="Editar horario"
      description="Corrige el día, la hora o la vigencia. La disponibilidad pública se recalcula al guardar."
    >
      {schedule ? (
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="edit-weekday">Día</Label>
            <select id="edit-weekday" name="weekday" defaultValue={schedule.weekday} className={SELECT_CLASS} required>
              {WEEKDAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-start">Hora inicio</Label>
            <Input id="edit-start" name="startTime" type="time" defaultValue={schedule.startTime} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-end">Hora fin</Label>
            <Input id="edit-end" name="endTime" type="time" defaultValue={schedule.endTime} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-timezone">Zona horaria</Label>
            <Input id="edit-timezone" name="timezone" defaultValue={schedule.timezone} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-from">Vigente desde</Label>
            <Input id="edit-from" name="effectiveFrom" type="date" defaultValue={schedule.effectiveFrom} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-to">Vigente hasta</Label>
            <Input id="edit-to" name="effectiveTo" type="date" defaultValue={schedule.effectiveTo} />
          </div>
          <div className="grid gap-2 md:col-span-3">
            <Label htmlFor="edit-status">Estado</Label>
            <select id="edit-status" name="status" defaultValue={schedule.status} className={SELECT_CLASS}>
              <option value="ACTIVE">Activo (genera disponibilidad)</option>
              <option value="INACTIVE">Inactivo (no genera disponibilidad)</option>
            </select>
          </div>
          {errorMessage ? <p className="text-sm text-destructive md:col-span-3">{errorMessage}</p> : null}
          <div className="flex flex-col-reverse gap-2 md:col-span-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

export type BlockedTimeFormValues = {
  startAt: string;
  endAt: string;
  reason?: string;
};

export function readBlockedTimeForm(form: FormData): BlockedTimeFormValues {
  const reason = String(form.get("reason") ?? "").trim();
  const startAt = String(form.get("startAt") ?? "");
  const endAt = String(form.get("endAt") ?? "");
  return {
    startAt: startAt ? new Date(startAt).toISOString() : startAt,
    endAt: endAt ? new Date(endAt).toISOString() : endAt,
    ...(reason ? { reason } : {})
  };
}

export function BlockedTimeEditModal({
  blockedTime,
  onClose,
  onSubmit,
  pending,
  errorMessage
}: {
  blockedTime: TherapistBlockedTimeRow | null;
  onClose: () => void;
  onSubmit: (values: BlockedTimeFormValues) => void;
  pending?: boolean;
  errorMessage?: string;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(readBlockedTimeForm(new FormData(event.currentTarget)));
  }

  return (
    <Modal open={Boolean(blockedTime)} onClose={onClose} title="Editar bloqueo" description="Ajusta el rango bloqueado o su motivo.">
      {blockedTime ? (
        <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="edit-block-start">Inicio</Label>
            <Input id="edit-block-start" name="startAt" type="datetime-local" defaultValue={toLocalInputValue(blockedTime.startAt)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-block-end">Fin</Label>
            <Input id="edit-block-end" name="endAt" type="datetime-local" defaultValue={toLocalInputValue(blockedTime.endAt)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-block-reason">Motivo</Label>
            <Input id="edit-block-reason" name="reason" defaultValue={blockedTime.reason} placeholder="Ej. supervisión clínica" />
          </div>
          {errorMessage ? <p className="text-sm text-destructive md:col-span-3">{errorMessage}</p> : null}
          <div className="flex flex-col-reverse gap-2 md:col-span-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
