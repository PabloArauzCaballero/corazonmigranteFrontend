"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useRef, useState } from "react";
import type { AdminUser, AdminUserStatus } from "@/features/users/users.types";
import {
  deleteUser,
  resetUserPassword,
  updateTherapistProfileByAdmin,
  updateUser,
  updateUserStatus,
  uploadUserPhotoByAdmin,
  type UpdateTherapistProfileInput,
  type UpdateUserInput
} from "@/features/users/users.api";
import {
  createAdminTherapistSchedule,
  deleteAdminTherapistSchedule,
  listAdminTherapistSchedules,
  updateAdminTherapistSchedule,
  type TherapistScheduleRow
} from "@/features/therapy/therapy.api";
import {
  ScheduleEditModal,
  SELECT_CLASS,
  WEEKDAYS,
  browserTimezone,
  readScheduleForm,
  todayDate,
  type ScheduleFormValues
} from "@/features/therapy/schedule-form";
import { fetchProfessions, fetchSpecialties } from "@/features/auth/public-options";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useConfirm } from "@/shared/ui/confirm-dialog";
import { DataTable } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Modal } from "@/shared/ui/modal";
import { PasswordInput } from "@/shared/ui/password-input";
import { ErrorState, LoadingState } from "@/shared/ui/state";
import { useToast } from "@/shared/ui/toast";
import { FaIcon, type FaIconName } from "@/shared/ui/fontawesome";

export function IconButtonLabel({ icon, label, spin = false }: { icon: FaIconName; label: string; spin?: boolean }) {
  return (
    <>
      <FaIcon name={icon} className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} />
      <span className="sr-only">{label}</span>
    </>
  );
}

function statusIcon(status: AdminUserStatus): FaIconName {
  if (status === "activo") return "circle-check";
  if (status === "bloqueado") return "lock";
  return "clock";
}

const statusActions: { value: AdminUserStatus; label: string }[] = [
  { value: "activo", label: "Activar" },
  { value: "bloqueado", label: "Bloquear" },
  { value: "pendiente", label: "Marcar pendiente" }
];

function optionValues(values?: string[], current?: string) {
  const set = new Set<string>();
  if (current?.trim()) set.add(current.trim());
  for (const value of values ?? []) {
    if (value.trim()) set.add(value.trim());
  }
  return [...set];
}

/** Datos de cuenta comunes a cualquier rol: nombre, correo y teléfono. */
export function EditUserAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const profile = user.therapistProfile ?? user.patientProfile;

  const mutation = useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(user.id, input),
    onSuccess: async () => {
      setOpen(false);
      toast({ variant: "success", title: "Usuario actualizado" });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      email: String(form.get("email") ?? ""),
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      phone: String(form.get("phone") ?? "")
    });
  }

  const [firstName = "", lastName = ""] = user.name.split(" ");

  return (
    <>
      <Button size="icon" variant="outline" title="Editar datos de cuenta" aria-label={`Editar datos de ${user.name}`} onClick={() => setOpen(true)}>
        <IconButtonLabel icon="user-pen" label="Editar datos de cuenta" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Datos de ${user.name}`} description="Nombre, correo y teléfono de la cuenta.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor={`first-${user.id}`}>Nombre</Label>
            <Input id={`first-${user.id}`} name="firstName" defaultValue={profile?.firstName || firstName} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`last-${user.id}`}>Apellido</Label>
            <Input id={`last-${user.id}`} name="lastName" defaultValue={profile?.lastName || lastName} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`email-${user.id}`}>Correo</Label>
            <Input id={`email-${user.id}`} name="email" type="email" defaultValue={user.email} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`phone-${user.id}`}>Teléfono</Label>
            <Input id={`phone-${user.id}`} name="phone" defaultValue={profile?.phone ?? ""} />
          </div>
          {mutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(mutation.error)}</p> : null}
          <div className="flex flex-col-reverse gap-2 md:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function EditTherapistAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const profile = user.therapistProfile;
  const professions = useQuery({ queryKey: ["public-options", "professions", "edit-therapist"], queryFn: fetchProfessions, enabled: open });
  const specialties = useQuery({ queryKey: ["public-options", "specialties", "edit-therapist"], queryFn: fetchSpecialties, enabled: open });
  const mutation = useMutation({
    mutationFn: (input: UpdateTherapistProfileInput) => updateTherapistProfileByAdmin(user.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      title: String(form.get("title") ?? ""),
      mainSpecialty: String(form.get("mainSpecialty") ?? ""),
      personalPhrase: String(form.get("personalPhrase") ?? ""),
      bio: String(form.get("bio") ?? "")
    });
  }

  const titleOptions = optionValues(professions.data, profile?.title);
  const specialtyOptions = optionValues(specialties.data, profile?.mainSpecialty);

  return (
    <>
      <Button size="icon" variant="outline" title="Editar terapeuta" aria-label="Editar terapeuta" onClick={() => setOpen(true)}>
        <IconButtonLabel icon="pencil" label="Editar terapeuta" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Información de ${user.name}`} description="Actualiza los datos profesionales del terapeuta.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2"><Label>Nombre</Label><Input name="firstName" defaultValue={profile?.firstName ?? ""} /></div>
          <div className="grid gap-2"><Label>Apellido</Label><Input name="lastName" defaultValue={profile?.lastName ?? ""} /></div>
          <div className="grid gap-2"><Label>Teléfono</Label><Input name="phone" defaultValue={profile?.phone ?? ""} /></div>
          <div className="grid gap-2">
            <Label>Título profesional</Label>
            <select name="title" defaultValue={profile?.title ?? ""} className={SELECT_CLASS} disabled={professions.isLoading}>
              <option value="">{professions.isLoading ? "Cargando..." : "Seleccionar título"}</option>
              {titleOptions.map((title) => <option key={title} value={title}>{title}</option>)}
            </select>
            {professions.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de títulos. Puedes guardar los demás campos.</p> : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Especialidad principal</Label>
            <select name="mainSpecialty" defaultValue={profile?.mainSpecialty ?? ""} className={SELECT_CLASS} disabled={specialties.isLoading}>
              <option value="">{specialties.isLoading ? "Cargando..." : "Seleccionar especialidad"}</option>
              {specialtyOptions.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
            </select>
            {specialties.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de especialidades. Puedes guardar los demás campos.</p> : null}
          </div>
          <div className="grid gap-2 md:col-span-2"><Label>Frase personal</Label><Input name="personalPhrase" defaultValue={profile?.personalPhrase ?? ""} /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Bio</Label><Input name="bio" defaultValue={profile?.bio ?? ""} /></div>
          <p className="text-xs text-muted-foreground md:col-span-2">Solo se envían los campos con contenido; los vacíos no modifican el perfil.</p>
          {mutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(mutation.error)}</p> : null}
          <div className="md:col-span-2">
            <Button type="submit" title="Guardar cambios" aria-label="Guardar cambios" disabled={mutation.isPending}>
              <IconButtonLabel icon={mutation.isPending ? "spinner" : "floppy-disk"} label={mutation.isPending ? "Guardando" : "Guardar cambios"} spin={mutation.isPending} />
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function AdminTherapistSchedulesAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TherapistScheduleRow | null>(null);
  const scheduleFormRef = useRef<HTMLFormElement>(null);
  const queryKey = ["admin", "therapist-schedules", user.id];

  const schedules = useQuery({ queryKey, queryFn: () => listAdminTherapistSchedules(user.id), enabled: open });
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createSchedule = useMutation({
    mutationFn: (values: ScheduleFormValues) => createAdminTherapistSchedule(user.id, values),
    onSuccess: async () => {
      scheduleFormRef.current?.reset();
      await invalidate();
    }
  });

  const editSchedule = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ScheduleFormValues }) => updateAdminTherapistSchedule(user.id, id, values),
    onSuccess: async () => {
      setEditing(null);
      toast({ variant: "success", title: "Horario actualizado" });
      await invalidate();
    }
  });

  const removeSchedule = useMutation({
    mutationFn: (scheduleId: string) => deleteAdminTherapistSchedule(user.id, scheduleId),
    onSuccess: async () => {
      toast({ variant: "success", title: "Horario eliminado" });
      await invalidate();
    },
    onError: (error) => toast({ variant: "danger", title: "No se pudo eliminar", description: humanizeApiError(error) })
  });

  function onCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createSchedule.mutate(readScheduleForm(new FormData(event.currentTarget)));
  }

  async function onDelete(row: TherapistScheduleRow) {
    const confirmed = await confirm({
      title: `¿Eliminar el horario del ${row.weekdayLabel}?`,
      description: `${row.startTime} a ${row.endTime} de ${user.name}. Dejará de ofrecerse en la reserva pública.`,
      confirmLabel: "Eliminar horario",
      variant: "danger"
    });
    if (confirmed) removeSchedule.mutate(row.id);
  }

  return (
    <>
      <Button size="icon" variant="outline" title="Horarios" aria-label={`Horarios de ${user.name}`} onClick={() => setOpen(true)}>
        <IconButtonLabel icon="calendar-days" label="Horarios" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Horarios de ${user.name}`} description="Registra, corrige o elimina los horarios recurrentes que habilitan disponibilidad para booking.">
        <div className="grid gap-5">
          <form ref={scheduleFormRef} className="grid gap-4 md:grid-cols-3" onSubmit={onCreateSchedule}>
            <div className="grid gap-2">
              <Label>Día</Label>
              <select name="weekday" required className={SELECT_CLASS}>
                {WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
            </div>
            <div className="grid gap-2"><Label>Inicio</Label><Input name="startTime" type="time" required /></div>
            <div className="grid gap-2"><Label>Fin</Label><Input name="endTime" type="time" required /></div>
            <div className="grid gap-2"><Label>Zona horaria</Label><Input name="timezone" defaultValue={browserTimezone()} required /></div>
            <div className="grid gap-2"><Label>Vigente desde</Label><Input name="effectiveFrom" type="date" defaultValue={todayDate()} required /></div>
            <div className="grid gap-2"><Label>Vigente hasta</Label><Input name="effectiveTo" type="date" /></div>
            {createSchedule.isError ? <p className="text-sm text-destructive md:col-span-3">{humanizeApiError(createSchedule.error)}</p> : null}
            {createSchedule.isSuccess ? <p className="text-sm text-emerald-700 md:col-span-3">Horario registrado correctamente.</p> : null}
            <div className="md:col-span-3">
              <Button type="submit" title="Registrar horario" aria-label="Registrar horario" disabled={createSchedule.isPending}>
                <IconButtonLabel icon={createSchedule.isPending ? "spinner" : "plus"} label={createSchedule.isPending ? "Guardando" : "Registrar horario"} spin={createSchedule.isPending} />
              </Button>
            </div>
          </form>

          {schedules.isLoading ? <LoadingState title="Cargando horarios" /> : null}
          {schedules.isError ? (
            <ErrorState title="No se pudieron cargar los horarios" description={humanizeApiError(schedules.error)} actionLabel="Reintentar" onAction={() => void schedules.refetch()} />
          ) : null}
          {schedules.data?.length ? (
            <DataTable<TherapistScheduleRow>
              data={schedules.data}
              getRowKey={(row) => row.id}
              columns={[
                { key: "weekday", header: "Día", render: (row) => row.weekdayLabel },
                { key: "time", header: "Horario", render: (row) => `${row.startTime} - ${row.endTime}` },
                { key: "timezone", header: "Zona", render: (row) => row.timezone },
                { key: "effective", header: "Vigencia", render: (row) => `${row.effectiveFrom}${row.effectiveTo ? ` a ${row.effectiveTo}` : ""}` },
                { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "ACTIVE" ? "success" : "muted"}>{row.status}</Badge> },
                {
                  key: "actions",
                  header: "Acciones",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <Button size="icon" variant="outline" title="Editar horario" aria-label={`Editar el horario del ${row.weekdayLabel}`} onClick={() => setEditing(row)}>
                        <IconButtonLabel icon="pencil" label="Editar horario" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        title="Eliminar horario"
                        aria-label={`Eliminar el horario del ${row.weekdayLabel}`}
                        disabled={removeSchedule.isPending}
                        onClick={() => void onDelete(row)}
                      >
                        <IconButtonLabel icon={removeSchedule.isPending ? "spinner" : "trash"} label="Eliminar horario" spin={removeSchedule.isPending} />
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          ) : schedules.isSuccess ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Este terapeuta todavía no tiene horarios. Registra al menos uno para que el booking muestre disponibilidad.
            </p>
          ) : null}
        </div>
      </Modal>

      <ScheduleEditModal
        schedule={editing}
        pending={editSchedule.isPending}
        errorMessage={editSchedule.isError ? humanizeApiError(editSchedule.error) : undefined}
        onClose={() => setEditing(null)}
        onSubmit={(values) => editing && editSchedule.mutate({ id: editing.id, values })}
      />
    </>
  );
}

/** «Ya me había creado un usuario y no me acuerdo la contraseña»: se asigna una nueva. */
export function ResetPasswordAction({ user }: { user: AdminUser }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (newPassword: string) => resetUserPassword(user.id, newPassword),
    onSuccess: () => {
      setOpen(false);
      toast({
        variant: "success",
        title: "Contraseña restablecida",
        description: `${user.email} ya puede entrar con la contraseña nueva. Sus sesiones anteriores se cerraron.`
      });
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setError("");
    mutation.mutate(newPassword);
  }

  return (
    <>
      <Button size="icon" variant="outline" title="Restablecer contraseña" aria-label={`Restablecer la contraseña de ${user.name}`} onClick={() => setOpen(true)}>
        <IconButtonLabel icon="key" label="Restablecer contraseña" />
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Restablecer contraseña de ${user.name}`}
        description="Asigna una contraseña nueva y compártela con la persona. Se cerrarán sus sesiones abiertas."
      >
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor={`new-password-${user.id}`}>Contraseña nueva</Label>
            <PasswordInput id={`new-password-${user.id}`} name="newPassword" required minLength={8} autoComplete="new-password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`confirm-password-${user.id}`}>Repetir contraseña</Label>
            <PasswordInput id={`confirm-password-${user.id}`} name="confirmPassword" required minLength={8} autoComplete="new-password" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {mutation.isError ? <p className="text-sm text-destructive">{humanizeApiError(mutation.error)}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Restablecer contraseña"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteUserAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: () => deleteUser(user.id),
    onSuccess: async () => {
      toast({ variant: "success", title: "Usuario eliminado", description: `${user.email} ya no puede iniciar sesión.` });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => toast({ variant: "danger", title: "No se pudo eliminar", description: humanizeApiError(error) })
  });

  async function onDelete() {
    const confirmed = await confirm({
      title: `¿Eliminar a ${user.name}?`,
      description: `Se cerrarán sus sesiones y no podrá volver a entrar con ${user.email}. Su historial de citas se conserva.`,
      confirmLabel: "Eliminar usuario",
      variant: "danger"
    });
    if (confirmed) mutation.mutate();
  }

  return (
    <Button
      size="icon"
      variant="outline"
      title="Eliminar usuario"
      aria-label={`Eliminar a ${user.name}`}
      disabled={mutation.isPending}
      onClick={() => void onDelete()}
    >
      <IconButtonLabel icon={mutation.isPending ? "spinner" : "trash"} label="Eliminar usuario" spin={mutation.isPending} />
    </Button>
  );
}

export function UploadPhotoAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useMutation({
    mutationFn: (file: File) => uploadUserPhotoByAdmin(user.id, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) mutation.mutate(file);
          event.currentTarget.value = "";
        }}
      />
      <Button size="icon" variant="outline" title="Subir foto" aria-label="Subir foto" disabled={mutation.isPending} onClick={() => inputRef.current?.click()}>
        <IconButtonLabel icon={mutation.isPending ? "spinner" : "upload"} label={mutation.isPending ? "Subiendo foto" : "Subir foto"} spin={mutation.isPending} />
      </Button>
      {mutation.isError ? <p className="w-full text-xs text-destructive">{humanizeApiError(mutation.error)}</p> : null}
    </>
  );
}

export function StatusActions({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: AdminUserStatus) => updateUserStatus(user.id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  return (
    <div className="flex flex-wrap gap-2">
      {statusActions
        .filter((action) => action.value !== user.status)
        .map((action) => (
          <Button
            key={action.value}
            size="icon"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(action.value)}
            title={action.label}
            aria-label={action.label}
          >
            <IconButtonLabel icon={mutation.isPending ? "spinner" : statusIcon(action.value)} label={action.label} spin={mutation.isPending} />
          </Button>
        ))}
      {mutation.isError ? <p className="w-full text-xs text-destructive">{humanizeApiError(mutation.error)}</p> : null}
    </div>
  );
}
